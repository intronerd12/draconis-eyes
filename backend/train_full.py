"""Train a stronger self-trained detector from the full internet datasets.

This runs two trainings (YOLOv8 + YOLOv11 backbones) on the merged internet dataset
and selects the best weights based on validation mAP.

Outputs:
- backend/ml_models/yolo_best.pt (selected best)
- backend/ml_models/yolo_best.meta.json (training metadata)
- backend/ml_models/yolo_eval.json (evaluation of selected best)
"""

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _safe_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def _pick_score(numeric: dict) -> float:
    for k in ("box_map", "box_map50", "box_map75", "box_mp"):
        v = numeric.get(k)
        if isinstance(v, (int, float)):
            return float(v)
    return 0.0


def main():
    parser = argparse.ArgumentParser()
    rr = _repo_root()

    parser.add_argument("--device", default="cpu")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--epochs", type=int, default=140)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--patience", type=int, default=30)
    parser.add_argument("--model-size", default="s", help="n/s/m/l/x")
    parser.add_argument("--cache", action="store_true")
    parser.add_argument("--cos-lr", action="store_true")
    args = parser.parse_args()

    from dataset_merge import merge_two_yolo_datasets
    from yolo_eval import main as yolo_eval_main
    from yolo_train import _default_model, train

    internet_dir = rr / "backend" / "datasets" / "internet_combined"
    data_yaml = internet_dir / "data.yaml"
    if not data_yaml.exists():
        merge_two_yolo_datasets(
            dataset_a=rr / "Dragon Fruit Vignan.v2i.yolov8",
            dataset_b=rr / "Dragon Fruit Vignan.v2i.yolov11",
            out_dir=internet_dir,
            include_test=False,
        )

    ml_dir = rr / "backend" / "ml_models"
    tmp_v8 = ml_dir / "yolo_best_yolov8.pt"
    tmp_v11 = ml_dir / "yolo_best_yolov11.pt"
    meta_v8 = ml_dir / "yolo_best_yolov8.meta.json"
    meta_v11 = ml_dir / "yolo_best_yolov11.meta.json"
    eval_v8 = ml_dir / "yolo_eval_yolov8.json"
    eval_v11 = ml_dir / "yolo_eval_yolov11.json"

    v8_model = _default_model("yolov8", args.model_size)
    v11_model = _default_model("yolov11", args.model_size)

    info_v8 = train(
        dataset="combined",
        model=v8_model,
        data_yaml_override=str(data_yaml),
        finetune_from=None,
        epochs=int(args.epochs),
        imgsz=int(args.imgsz),
        device=args.device,
        batch=int(args.batch),
        patience=int(args.patience),
        seed=7,
        workers=0,
        cache=bool(args.cache),
        optimizer="AdamW",
        lr0=None,
        cos_lr=bool(args.cos_lr),
        resume=False,
        hsv_h=0.015,
        hsv_s=0.65,
        hsv_v=0.45,
        degrees=8.0,
        translate=0.10,
        scale=0.45,
        shear=2.0,
        perspective=0.0005,
        fliplr=0.5,
        flipud=0.0,
        mosaic=0.7,
        mixup=0.05,
        copy_paste=0.0,
        erasing=0.0,
    )
    best_v8 = Path(info_v8["best_weights"]) if info_v8.get("best_weights") else None
    if not best_v8 or not best_v8.exists():
        raise RuntimeError("YOLOv8 training did not produce best weights.")
    _safe_copy(best_v8, tmp_v8)
    _safe_copy(Path(info_v8["meta"]), meta_v8)

    info_v11 = train(
        dataset="combined",
        model=v11_model,
        data_yaml_override=str(data_yaml),
        finetune_from=None,
        epochs=int(args.epochs),
        imgsz=int(args.imgsz),
        device=args.device,
        batch=int(args.batch),
        patience=int(args.patience),
        seed=7,
        workers=0,
        cache=bool(args.cache),
        optimizer="AdamW",
        lr0=None,
        cos_lr=bool(args.cos_lr),
        resume=False,
        hsv_h=0.015,
        hsv_s=0.65,
        hsv_v=0.45,
        degrees=8.0,
        translate=0.10,
        scale=0.45,
        shear=2.0,
        perspective=0.0005,
        fliplr=0.5,
        flipud=0.0,
        mosaic=0.7,
        mixup=0.05,
        copy_paste=0.0,
        erasing=0.0,
    )
    best_v11 = Path(info_v11["best_weights"]) if info_v11.get("best_weights") else None
    if not best_v11 or not best_v11.exists():
        raise RuntimeError("YOLOv11 training did not produce best weights.")
    _safe_copy(best_v11, tmp_v11)
    _safe_copy(Path(info_v11["meta"]), meta_v11)

    def _eval(weights: Path, out_json: Path) -> dict:
        import sys

        sys.argv = [
            sys.argv[0],
            "--weights",
            str(weights),
            "--data",
            str(data_yaml),
            "--imgsz",
            str(int(args.imgsz)),
            "--device",
            str(args.device),
        ]
        yolo_eval_main()
        produced = rr / "backend" / "ml_models" / "yolo_eval.json"
        if not produced.exists():
            raise RuntimeError("yolo_eval did not produce output json.")
        _safe_copy(produced, out_json)
        return json.loads(out_json.read_text(encoding="utf-8"))

    r_v8 = _eval(tmp_v8, eval_v8)
    r_v11 = _eval(tmp_v11, eval_v11)

    s_v8 = _pick_score((r_v8.get("numeric") or {}) if isinstance(r_v8, dict) else {})
    s_v11 = _pick_score((r_v11.get("numeric") or {}) if isinstance(r_v11, dict) else {})

    chosen = "yolov11" if s_v11 >= s_v8 else "yolov8"
    chosen_weights = tmp_v11 if chosen == "yolov11" else tmp_v8
    chosen_eval = eval_v11 if chosen == "yolov11" else eval_v8
    chosen_meta = meta_v11 if chosen == "yolov11" else meta_v8

    best_dst = ml_dir / "yolo_best.pt"
    meta_dst = ml_dir / "yolo_best.meta.json"
    eval_dst = ml_dir / "yolo_eval.json"
    _safe_copy(chosen_weights, best_dst)
    _safe_copy(chosen_eval, eval_dst)

    merged_meta = {
        "selected_at": datetime.now(timezone.utc).isoformat(),
        "selected_backbone": chosen,
        "scores": {"yolov8": s_v8, "yolov11": s_v11},
        "data_yaml": str(data_yaml),
    }
    try:
        base_meta = json.loads(chosen_meta.read_text(encoding="utf-8"))
        if isinstance(base_meta, dict):
            merged_meta["train"] = base_meta
    except Exception:
        pass

    meta_dst.write_text(json.dumps(merged_meta, indent=2), encoding="utf-8")

    print(str(best_dst))
    print(chosen)
    print(f"score_yolov8={s_v8:.6f}")
    print(f"score_yolov11={s_v11:.6f}")


if __name__ == "__main__":
    main()

