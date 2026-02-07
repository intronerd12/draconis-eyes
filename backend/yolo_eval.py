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

  out = {
    "evaluated_at": datetime.now(timezone.utc).isoformat(),
    "weights": args.weights,
    "data": args.data,
    "imgsz": int(args.imgsz),
    "device": args.device,
    "metrics": str(metrics),
  }

  out_path = repo_root / "backend" / "ml_models" / "yolo_eval.json"
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)

  print(str(out_path))


if __name__ == "__main__":
  main()

