import argparse
import os
import random
import shutil
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
import numpy as np

from yolo_runtime import Detection, get_yolo_runtime


def _quality_ok(im: Image.Image, *, min_blur: float, min_brightness: float, max_brightness: float) -> tuple[bool, dict]:
  arr = np.array(im.convert("RGB"), dtype=np.uint8)
  gray = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]).astype(np.float32)
  brightness = float(np.mean(gray) / 255.0)

  blur = 0.0
  try:
    import cv2  # type: ignore
    lap = cv2.Laplacian(gray, cv2.CV_32F)
    blur = float(lap.var())
  except Exception:
    g = gray
    dx2 = g[:, 2:] - 2 * g[:, 1:-1] + g[:, :-2]
    dy2 = g[2:, :] - 2 * g[1:-1, :] + g[:-2, :]
    blur = float(np.var(dx2) + np.var(dy2))

  ok = (blur >= float(min_blur)) and (float(min_brightness) <= brightness <= float(max_brightness))
  return ok, {"brightness": round(brightness, 6), "blur": round(blur, 6)}


def _ensure_dir(p: Path):
  p.mkdir(parents=True, exist_ok=True)


def _list_images(src: Path) -> list[Path]:
  out: list[Path] = []
  for root, _, files in os.walk(src):
    for fn in files:
      ext = fn.lower().rsplit(".", 1)[-1] if "." in fn else ""
      if ext in ("jpg", "jpeg", "png", "webp"):
        out.append(Path(root) / fn)
  out.sort()
  return out


def _to_yolo_label_line(d: Detection, w: int, h: int) -> str:
  x0 = max(0, min(int(d.x0), w - 1))
  x1 = max(0, min(int(d.x1), w - 1))
  y0 = max(0, min(int(d.y0), h - 1))
  y1 = max(0, min(int(d.y1), h - 1))
  bw = max(1, x1 - x0)
  bh = max(1, y1 - y0)
  cx = x0 + bw / 2.0
  cy = y0 + bh / 2.0
  return f"0 {cx / w:.6f} {cy / h:.6f} {bw / w:.6f} {bh / h:.6f}"


def ingest(
  uploads_dir: Path,
  out_dataset_dir: Path,
  min_conf: float,
  valid_split: float,
  seed: int,
  limit: int | None,
  min_blur: float,
  min_brightness: float,
  max_brightness: float,
  max_dets: int,
):
  rt = get_yolo_runtime()
  if rt is None:
    raise RuntimeError("YOLO runtime is not available. Train weights first and install ML requirements.")

  images = _list_images(uploads_dir)
  rng = random.Random(int(seed))
  rng.shuffle(images)
  if limit is not None:
    images = images[: int(limit)]
  n_valid = int(round(len(images) * float(valid_split)))
  valid_set = set(images[:n_valid])

  train_img = out_dataset_dir / "train" / "images"
  train_lbl = out_dataset_dir / "train" / "labels"
  valid_img = out_dataset_dir / "valid" / "images"
  valid_lbl = out_dataset_dir / "valid" / "labels"
  _ensure_dir(train_img)
  _ensure_dir(train_lbl)
  _ensure_dir(valid_img)
  _ensure_dir(valid_lbl)

  manifest_path = out_dataset_dir / "manifest.jsonl"
  _ensure_dir(out_dataset_dir)

  written = 0
  for src in images:
    im = Image.open(src).convert("RGB")
    ok, q = _quality_ok(im, min_blur=float(min_blur), min_brightness=float(min_brightness), max_brightness=float(max_brightness))
    if not ok:
      continue
    w, h = im.size
    dets = [d for d in rt.predict(im, conf=float(min_conf)) if float(d.conf) >= float(min_conf)]
    if not dets:
      continue
    if int(max_dets) > 0 and len(dets) > int(max_dets):
      # Too many detections usually indicates clutter/background false-positives.
      continue

    dst_base = f"{src.stem}_{abs(hash(str(src))) % 10**10}"
    is_valid = src in valid_set
    img_dir = valid_img if is_valid else train_img
    lbl_dir = valid_lbl if is_valid else train_lbl

    img_dst = img_dir / f"{dst_base}.jpg"
    lbl_dst = lbl_dir / f"{dst_base}.txt"

    im.save(img_dst, format="JPEG", quality=92)
    with open(lbl_dst, "w", encoding="utf-8") as f:
      lines = [_to_yolo_label_line(d, w, h) for d in dets]
      f.write("\n".join(lines) + "\n")

    record = {
      "timestamp": datetime.now(timezone.utc).isoformat(),
      "source_path": str(src),
      "image_path": str(img_dst),
      "label_path": str(lbl_dst),
      "quality": q,
      "min_conf": float(min_conf),
      "detections": [asdict(d) for d in dets],
    }
    with open(manifest_path, "a", encoding="utf-8") as f:
      import json
      f.write(json.dumps(record, ensure_ascii=False) + "\n")

    written += 1

  data_yaml = out_dataset_dir / "data.yaml"
  if not data_yaml.exists():
    data_yaml.write_text(
      "train: train/images\nval: valid/images\n\nnc: 1\nnames: ['dragon-fruit']\n",
      encoding="utf-8",
    )

  return {"written": written, "dataset_dir": str(out_dataset_dir), "data_yaml": str(data_yaml)}


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--uploads-dir", default=str(Path(__file__).resolve().parent / "training_uploads" / "images"))
  parser.add_argument("--out-dataset-dir", default=str(Path(__file__).resolve().parent / "selftrain_dataset"))
  parser.add_argument("--min-conf", type=float, default=0.45)
  parser.add_argument("--valid-split", type=float, default=0.1)
  parser.add_argument("--seed", type=int, default=7)
  parser.add_argument("--limit", type=int, default=None)
  parser.add_argument("--min-blur", type=float, default=25.0)
  parser.add_argument("--min-brightness", type=float, default=0.08)
  parser.add_argument("--max-brightness", type=float, default=0.98)
  parser.add_argument("--max-dets", type=int, default=3)
  args = parser.parse_args()

  info = ingest(
    uploads_dir=Path(args.uploads_dir),
    out_dataset_dir=Path(args.out_dataset_dir),
    min_conf=args.min_conf,
    valid_split=args.valid_split,
    seed=args.seed,
    limit=args.limit,
    min_blur=args.min_blur,
    min_brightness=args.min_brightness,
    max_brightness=args.max_brightness,
    max_dets=args.max_dets,
  )
  print(info["dataset_dir"])
  print(info["written"])


if __name__ == "__main__":
  main()
