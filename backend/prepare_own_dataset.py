import argparse
import hashlib
import os
import random
import re
import shutil
from dataclasses import dataclass
from pathlib import Path


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


@dataclass
class ClassSpec:
  source_dir: str
  class_id: int
  class_name: str
  output_prefix: str


CLASS_SPECS = [
  ClassSpec(source_dir="Healthy dragon", class_id=0, class_name="healthy", output_prefix="healthy"),
  ClassSpec(source_dir="not healthy dragon", class_id=1, class_name="unhealthy", output_prefix="unhealthy"),
]


def _ensure_dir(path: Path) -> None:
  path.mkdir(parents=True, exist_ok=True)


def _reset_dir(path: Path) -> None:
  if path.exists():
    shutil.rmtree(path)
  path.mkdir(parents=True, exist_ok=True)


def _iter_images(path: Path) -> list[Path]:
  if not path.exists():
    return []
  out = [p for p in path.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
  out.sort()
  return out


def _slugify(text: str) -> str:
  slug = re.sub(r"[^A-Za-z0-9._-]+", "_", text.strip())
  return slug.strip("._-") or "img"


def _stable_name(prefix: str, src: Path) -> str:
  digest = hashlib.sha1(str(src).encode("utf-8")).hexdigest()[:8]
  stem = _slugify(src.stem)
  ext = src.suffix.lower()
  return f"{prefix}_{stem}_{digest}{ext}"


def _link_or_copy(src: Path, dst: Path) -> None:
  if dst.exists():
    return
  try:
    os.link(src, dst)
  except Exception:
    shutil.copy2(src, dst)


def _split(items: list[Path], val_ratio: float, seed: int) -> tuple[list[Path], list[Path]]:
  if not items:
    return [], []
  rng = random.Random(seed)
  shuffled = items[:]
  rng.shuffle(shuffled)
  val_count = int(round(len(shuffled) * val_ratio))
  if len(shuffled) > 1:
    val_count = max(1, min(val_count, len(shuffled) - 1))
  else:
    val_count = 0
  val_items = shuffled[:val_count]
  train_items = shuffled[val_count:]
  return train_items, val_items


def _selected_specs(include_unhealthy: bool) -> list[ClassSpec]:
  selected = [CLASS_SPECS[0]]
  if include_unhealthy:
    selected.append(CLASS_SPECS[1])
  remapped: list[ClassSpec] = []
  for idx, spec in enumerate(selected):
    remapped.append(
      ClassSpec(
        source_dir=spec.source_dir,
        class_id=idx,
        class_name=spec.class_name,
        output_prefix=spec.output_prefix,
      )
    )
  return remapped


def prepare_dataset(root: Path, val_ratio: float, seed: int, include_unhealthy: bool) -> dict:
  if val_ratio <= 0 or val_ratio >= 0.5:
    raise ValueError("val_ratio must be > 0 and < 0.5 (recommended 0.2 to 0.3).")

  specs = _selected_specs(include_unhealthy=include_unhealthy)
  if not specs:
    raise RuntimeError("No classes selected.")

  # Match Roboflow-style YOLOv8 split layout as reference.
  images_train = root / "train" / "images"
  images_val = root / "valid" / "images"
  labels_train = root / "train" / "labels"
  labels_val = root / "valid" / "labels"

  _reset_dir(images_train)
  _reset_dir(images_val)
  _reset_dir(labels_train)
  _reset_dir(labels_val)

  # Remove older output layout to avoid mixed/stale datasets.
  for legacy in (root / "images", root / "labels"):
    if legacy.exists():
      shutil.rmtree(legacy)

  summary = {
    "train_images": 0,
    "val_images": 0,
    "selected_classes": [spec.class_name for spec in specs],
    "classes": {},
  }

  for spec in specs:
    source = root / spec.source_dir
    if not source.exists():
      raise FileNotFoundError(f"Missing source folder: {source}")
    images = _iter_images(source)
    if not images:
      raise RuntimeError(f"No images found in: {source}")

    train_items, val_items = _split(images, val_ratio=val_ratio, seed=seed + spec.class_id)
    summary["classes"][spec.class_name] = {
      "total": len(images),
      "train": len(train_items),
      "val": len(val_items),
    }

    for split, items in (("train", train_items), ("val", val_items)):
      img_dir = images_train if split == "train" else images_val
      lbl_dir = labels_train if split == "train" else labels_val
      for src in items:
        image_name = _stable_name(spec.output_prefix, src)
        image_dst = img_dir / image_name
        label_dst = lbl_dir / f"{Path(image_name).stem}.txt"

        _link_or_copy(src, image_dst)
        label_dst.write_text(
          f"{spec.class_id} 0.500000 0.500000 1.000000 1.000000\n",
          encoding="utf-8",
        )

        if split == "train":
          summary["train_images"] += 1
        else:
          summary["val_images"] += 1

  data_yaml = root / "data.yaml"
  names_yaml = "\n".join([f"  {spec.class_id}: {spec.class_name}" for spec in specs])
  data_yaml.write_text(
    "\n".join(
      [
        "train: train/images",
        "val: valid/images",
        "",
        f"nc: {len(specs)}",
        "names:",
        names_yaml,
        "",
      ]
    ),
    encoding="utf-8",
  )

  return summary


def main() -> None:
  repo_root = Path(__file__).resolve().parents[1]
  parser = argparse.ArgumentParser()
  parser.add_argument("--dataset-dir", default=str(repo_root / "Own Dataset"))
  parser.add_argument("--val-ratio", type=float, default=0.2)
  parser.add_argument("--seed", type=int, default=42)
  parser.add_argument(
    "--include-unhealthy",
    action="store_true",
    help="Include unhealthy class now. Default is healthy-only.",
  )
  args = parser.parse_args()

  summary = prepare_dataset(
    root=Path(args.dataset_dir),
    val_ratio=args.val_ratio,
    seed=args.seed,
    include_unhealthy=bool(args.include_unhealthy),
  )
  print(summary)


if __name__ == "__main__":
  main()
