import argparse
import datetime as _dt
import json
import os
import shutil
from pathlib import Path

try:
  from .dataset_merge import merge_two_yolo_datasets
except Exception:
  from dataset_merge import merge_two_yolo_datasets


def _require_ultralytics():
  try:
    from ultralytics import YOLO
    return YOLO
  except Exception as e:
    raise RuntimeError(
      "Ultralytics is not installed. Install ML requirements before training."
    ) from e


def _dataset_paths(repo_root: Path, dataset: str) -> tuple[Path, Path]:
  if dataset.lower() == "yolov8":
    base = repo_root / "Dragon Fruit Vignan.v2i.yolov8"
  elif dataset.lower() == "yolov11":
    base = repo_root / "Dragon Fruit Vignan.v2i.yolov11"
  elif dataset.lower() == "combined":
    base = repo_root / "backend" / "datasets" / "internet_combined"
    data_yaml = base / "data.yaml"
    if not data_yaml.exists():
      merge_two_yolo_datasets(
        dataset_a=repo_root / "Dragon Fruit Vignan.v2i.yolov8",
        dataset_b=repo_root / "Dragon Fruit Vignan.v2i.yolov11",
        out_dir=base,
        include_test=False,
      )
  else:
    raise ValueError("dataset must be yolov8, yolov11, or combined")

  data_yaml = base / "data.yaml"
  if not data_yaml.exists():
    raise FileNotFoundError(str(data_yaml))
  return base, data_yaml


def _default_model(dataset: str, size: str) -> str:
  s = (size or "n").lower()
  if s not in ("n", "s", "m", "l", "x"):
    s = "n"
  if dataset.lower() == "yolov11":
    return f"yolo11{s}.pt"
  return f"yolov8{s}.pt"


def train(
  dataset: str,
  model: str,
  data_yaml_override: str | None,
  finetune_from: str | None,
  epochs: int,
  imgsz: int,
  device: str,
  batch: int,
  patience: int,
  seed: int,
  workers: int,
  cache: bool,
  optimizer: str,
  lr0: float | None,
  cos_lr: bool,
  resume: bool,
  hsv_h: float,
  hsv_s: float,
  hsv_v: float,
  degrees: float,
  translate: float,
  scale: float,
  shear: float,
  perspective: float,
  fliplr: float,
  flipud: float,
  mosaic: float,
  mixup: float,
  copy_paste: float,
  erasing: float,
):
  YOLO = _require_ultralytics()

  repo_root = Path(__file__).resolve().parents[1]
  if data_yaml_override:
    data_yaml = Path(data_yaml_override)
  else:
    _, data_yaml = _dataset_paths(repo_root, dataset)
  if not data_yaml.exists():
    raise FileNotFoundError(str(data_yaml))

  out_dir = repo_root / "backend" / "ml_models" / "yolo_runs"
  out_dir.mkdir(parents=True, exist_ok=True)
  run_name = f"{dataset.lower()}_{_dt.datetime.now().strftime('%Y%m%d_%H%M%S')}"

  # Warm-start: fine-tune from a prior best checkpoint when available.
  if finetune_from and os.path.exists(finetune_from):
    yolo = YOLO(finetune_from)
  else:
    yolo = YOLO(model)

  train_kwargs = {
    "data": str(data_yaml),
    "epochs": int(epochs),
    "imgsz": int(imgsz),
    "device": device,
    "batch": int(batch),
    "patience": int(patience),
    "seed": int(seed),
    "workers": int(workers),
    "cache": bool(cache),
    "optimizer": optimizer,
    "cos_lr": bool(cos_lr),
    "resume": bool(resume),
    "hsv_h": float(hsv_h),
    "hsv_s": float(hsv_s),
    "hsv_v": float(hsv_v),
    "degrees": float(degrees),
    "translate": float(translate),
    "scale": float(scale),
    "shear": float(shear),
    "perspective": float(perspective),
    "fliplr": float(fliplr),
    "flipud": float(flipud),
    "mosaic": float(mosaic),
    "mixup": float(mixup),
    "copy_paste": float(copy_paste),
    "erasing": float(erasing),
    "project": str(out_dir),
    "name": run_name,
    "exist_ok": False,
  }
  if lr0 is not None:
    train_kwargs["lr0"] = float(lr0)

  results = yolo.train(**train_kwargs)

  run_dir = out_dir / run_name
  candidate_best = run_dir / "weights" / "best.pt"
  candidate_last = run_dir / "weights" / "last.pt"

  best_dst = repo_root / "backend" / "ml_models" / "yolo_best.pt"
  last_dst = repo_root / "backend" / "ml_models" / "yolo_last.pt"
  meta_dst = repo_root / "backend" / "ml_models" / "yolo_best.meta.json"

  if candidate_best.exists():
    shutil.copy2(candidate_best, best_dst)
  if candidate_last.exists():
    shutil.copy2(candidate_last, last_dst)

  meta = {
    "trained_at": _dt.datetime.utcnow().isoformat() + "Z",
    "dataset": dataset,
    "data_yaml": str(data_yaml),
    "model": model,
    "epochs": int(epochs),
    "imgsz": int(imgsz),
    "device": device,
    "batch": int(batch),
    "patience": int(patience),
    "seed": int(seed),
    "workers": int(workers),
    "cache": bool(cache),
    "optimizer": optimizer,
    "lr0": (None if lr0 is None else float(lr0)),
    "cos_lr": bool(cos_lr),
    "resume": bool(resume),
    "finetune_from": finetune_from,
    "augment": {
      "hsv_h": float(hsv_h),
      "hsv_s": float(hsv_s),
      "hsv_v": float(hsv_v),
      "degrees": float(degrees),
      "translate": float(translate),
      "scale": float(scale),
      "shear": float(shear),
      "perspective": float(perspective),
      "fliplr": float(fliplr),
      "flipud": float(flipud),
      "mosaic": float(mosaic),
      "mixup": float(mixup),
      "copy_paste": float(copy_paste),
      "erasing": float(erasing),
    },
    "run_dir": str(run_dir),
  }
  with open(meta_dst, "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2)

  return {
    "run_dir": str(run_dir),
    "best_weights": str(best_dst) if best_dst.exists() else None,
    "last_weights": str(last_dst) if last_dst.exists() else None,
    "data_yaml": str(data_yaml),
    "model": model,
    "epochs": epochs,
    "imgsz": imgsz,
    "device": device,
    "batch": batch,
    "meta": str(meta_dst),
    "results": str(results),
  }


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--dataset", choices=["yolov8", "yolov11", "combined"], required=True)
  parser.add_argument("--data", default=None, help="Override data.yaml path (skips --dataset lookup)")
  parser.add_argument("--model", default=None)
  parser.add_argument("--model-size", default="s")
  parser.add_argument("--finetune-from", default=None, help="Path to .pt checkpoint to fine-tune from")
  parser.add_argument("--epochs", type=int, default=120)
  parser.add_argument("--imgsz", type=int, default=640)
  parser.add_argument("--device", default="cpu")
  parser.add_argument("--batch", type=int, default=8)
  parser.add_argument("--patience", type=int, default=30)
  parser.add_argument("--seed", type=int, default=7)
  parser.add_argument("--workers", type=int, default=0)
  parser.add_argument("--cache", action="store_true")
  parser.add_argument("--optimizer", default="AdamW")
  parser.add_argument("--lr0", type=float, default=None)
  parser.add_argument("--cos-lr", action="store_true")
  parser.add_argument("--resume", action="store_true")
  # Augmentation knobs
  parser.add_argument("--hsv-h", type=float, default=0.015)
  parser.add_argument("--hsv-s", type=float, default=0.65)
  parser.add_argument("--hsv-v", type=float, default=0.45)
  parser.add_argument("--degrees", type=float, default=8.0)
  parser.add_argument("--translate", type=float, default=0.10)
  parser.add_argument("--scale", type=float, default=0.45)
  parser.add_argument("--shear", type=float, default=2.0)
  parser.add_argument("--perspective", type=float, default=0.0005)
  parser.add_argument("--fliplr", type=float, default=0.5)
  parser.add_argument("--flipud", type=float, default=0.0)
  parser.add_argument("--mosaic", type=float, default=0.7)
  parser.add_argument("--mixup", type=float, default=0.05)
  parser.add_argument("--copy-paste", type=float, default=0.0)
  parser.add_argument("--erasing", type=float, default=0.0)
  args = parser.parse_args()

  if args.model:
    model = args.model
  else:
    base = args.dataset if args.dataset != "combined" else "yolov8"
    model = _default_model(base, args.model_size)

  info = train(
    dataset=args.dataset,
    model=model,
    data_yaml_override=args.data,
    finetune_from=args.finetune_from,
    epochs=args.epochs,
    imgsz=args.imgsz,
    device=args.device,
    batch=args.batch,
    patience=args.patience,
    seed=args.seed,
    workers=args.workers,
    cache=args.cache,
    optimizer=args.optimizer,
    lr0=args.lr0,
    cos_lr=args.cos_lr,
    resume=args.resume,
    hsv_h=args.hsv_h,
    hsv_s=args.hsv_s,
    hsv_v=args.hsv_v,
    degrees=args.degrees,
    translate=args.translate,
    scale=args.scale,
    shear=args.shear,
    perspective=args.perspective,
    fliplr=args.fliplr,
    flipud=args.flipud,
    mosaic=args.mosaic,
    mixup=args.mixup,
    copy_paste=args.copy_paste,
    erasing=args.erasing,
  )
  print(info["run_dir"])
  if info["best_weights"]:
    print(info["best_weights"])
  if info["meta"]:
    print(info["meta"])


if __name__ == "__main__":
  main()
