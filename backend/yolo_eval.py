import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def _require_ultralytics():
  try:
    from ultralytics import YOLO
    return YOLO
  except Exception as e:
    raise RuntimeError("Ultralytics is not installed. Install ML requirements before evaluation.") from e


def main():
  parser = argparse.ArgumentParser()
  repo_root = Path(__file__).resolve().parents[1]
  parser.add_argument("--weights", default=str(repo_root / "backend" / "ml_models" / "yolo_best.pt"))
  parser.add_argument("--data", default=str(repo_root / "backend" / "datasets" / "internet_combined" / "data.yaml"))
  parser.add_argument("--imgsz", type=int, default=640)
  parser.add_argument("--device", default="cpu")
  args = parser.parse_args()

  YOLO = _require_ultralytics()
  model = YOLO(args.weights)
  metrics = model.val(data=args.data, imgsz=int(args.imgsz), device=args.device, verbose=False)

  # Ultralytics Metrics objects differ slightly across versions; extract best-effort numeric fields.
  numeric: dict[str, float] = {}
  try:
    box = getattr(metrics, "box", None)
    if box is not None:
      for k in ("map", "map50", "map75", "mp", "mr"):
        v = getattr(box, k, None)
        if v is not None:
          numeric[f"box_{k}"] = float(v)
  except Exception:
    pass

  try:
    speed = getattr(metrics, "speed", None)
    if isinstance(speed, dict):
      for k, v in speed.items():
        try:
          numeric[f"speed_{k}"] = float(v)
        except Exception:
          continue
  except Exception:
    pass

  out = {
    "evaluated_at": datetime.now(timezone.utc).isoformat(),
    "weights": args.weights,
    "data": args.data,
    "imgsz": int(args.imgsz),
    "device": args.device,
    "metrics": str(metrics),
    "numeric": numeric,
  }

  out_path = repo_root / "backend" / "ml_models" / "yolo_eval.json"
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)

  print(str(out_path))


if __name__ == "__main__":
  main()
