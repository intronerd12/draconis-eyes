import argparse
import os
import shutil
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CopyStats:
  images: int = 0
  labels: int = 0
  missing_labels: int = 0


def _ensure_dir(p: Path):
  p.mkdir(parents=True, exist_ok=True)


def _safe_link_or_copy(src: Path, dst: Path):
  if dst.exists():
    return
  try:
    os.link(src, dst)
  except Exception:
    shutil.copy2(src, dst)


def _iter_images(images_dir: Path) -> list[Path]:
  if not images_dir.exists():
    return []
  out: list[Path] = []
  for fn in images_dir.iterdir():
    if not fn.is_file():
      continue
    ext = fn.suffix.lower()
    if ext in (".jpg", ".jpeg", ".png", ".webp"):
      out.append(fn)
  out.sort()
  return out


def merge_two_yolo_datasets(
  dataset_a: Path,
  dataset_b: Path,
  out_dir: Path,
  include_test: bool,
  limit_per_split: int | None = None,
):
  return merge_many_yolo_datasets(
    datasets=[dataset_a, dataset_b],
    out_dir=out_dir,
    include_test=include_test,
    limit_per_split=limit_per_split,
  )


def merge_many_yolo_datasets(
  datasets: list[Path],
  out_dir: Path,
  include_test: bool,
  limit_per_split: int | None = None,
):
  """Merge N YOLO datasets into a single YOLO dataset folder.

  - Datasets are expected to have split/{images,labels}
  - Uses hardlinks when possible, otherwise copies
  - Adds dataset-name prefix to avoid filename collisions
  """
  splits = ["train", "valid"]
  if include_test:
    splits.append("test")

  for ds in datasets:
    if not ds.exists():
      raise FileNotFoundError(f"Dataset folder not found: {ds}")

  _ensure_dir(out_dir)

  stats: dict[str, CopyStats] = {"total": CopyStats()}
  for idx, ds in enumerate(datasets):
    stats[f"d{idx}"] = CopyStats()

  for split in splits:
    for idx, base in enumerate(datasets):
      tag = f"d{idx}"
      img_src = base / split / "images"
      lbl_src = base / split / "labels"
      img_dst = out_dir / split / "images"
      lbl_dst = out_dir / split / "labels"
      _ensure_dir(img_dst)
      _ensure_dir(lbl_dst)

      copied_in_split = 0
      for img in _iter_images(img_src):
        if limit_per_split is not None and copied_in_split >= int(limit_per_split):
          break
        stem = img.stem
        label = lbl_src / f"{stem}.txt"

        safe_stem = f"{base.name.replace(' ', '_')}_{stem}"
        img_out = img_dst / f"{safe_stem}{img.suffix.lower()}"
        lbl_out = lbl_dst / f"{safe_stem}.txt"

        _safe_link_or_copy(img, img_out)
        stats[tag].images += 1
        stats["total"].images += 1
        copied_in_split += 1

        if label.exists():
          _safe_link_or_copy(label, lbl_out)
          stats[tag].labels += 1
          stats["total"].labels += 1
        else:
          stats[tag].missing_labels += 1
          stats["total"].missing_labels += 1

  data_yaml = out_dir / "data.yaml"
  if not data_yaml.exists():
    data_yaml.write_text(
      "train: train/images\nval: valid/images\n\nnc: 1\nnames: ['dragon-fruit']\n",
      encoding="utf-8",
    )

  if stats["total"].images <= 0:
    raise RuntimeError("Merged dataset has 0 images. Check your source dataset folders.")

  return {"out_dir": str(out_dir), "stats": {k: vars(v) for k, v in stats.items()}, "data_yaml": str(data_yaml)}


def main():
  parser = argparse.ArgumentParser()
  repo_root = Path(__file__).resolve().parents[1]
  parser.add_argument("--yolov8-dir", default=str(repo_root / "Dragon Fruit Vignan.v2i.yolov8"))
  parser.add_argument("--yolov11-dir", default=str(repo_root / "Dragon Fruit Vignan.v2i.yolov11"))
  parser.add_argument("--out-dir", default=str(repo_root / "backend" / "datasets" / "internet_combined"))
  parser.add_argument("--include-test", action="store_true")
  parser.add_argument("--limit-per-split", type=int, default=None)
  args = parser.parse_args()

  info = merge_two_yolo_datasets(
    dataset_a=Path(args.yolov8_dir),
    dataset_b=Path(args.yolov11_dir),
    out_dir=Path(args.out_dir),
    include_test=bool(args.include_test),
    limit_per_split=args.limit_per_split,
  )
  print(info["out_dir"])
  print(info["stats"])


if __name__ == "__main__":
  main()
