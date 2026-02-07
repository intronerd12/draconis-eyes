import argparse
import os
import random
import shutil
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from yolo_runtime import Detection, get_yolo_runtime


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
):
  rt = get_yolo_runtime()
  if rt is None:
    raise RuntimeError("YOLO runtime is not available. Train weights first and install ML requirements.")

  images = _list_images(uploads_dir)
  if limit is not None:
    images = images[: int(limit)]

  rng = random.Random(int(seed))
  rng.shuffle(images)
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
    w, h = im.size
    dets = [d for d in rt.predict(im, conf=float(min_conf)) if float(d.conf) >= float(min_conf)]
    if not dets:
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
  args = parser.parse_args()

  info = ingest(
    uploads_dir=Path(args.uploads_dir),
    out_dataset_dir=Path(args.out_dataset_dir),
    min_conf=args.min_conf,
    valid_split=args.valid_split,
    seed=args.seed,
    limit=args.limit,
  )
  print(info["dataset_dir"])
  print(info["written"])


if __name__ == "__main__":
  main()

