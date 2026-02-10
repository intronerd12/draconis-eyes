"""End-to-end self-training helper.

Pipeline:
1) Ingest collected shop images from backend/training_uploads/images -> pseudo-labeled YOLO dataset
2) Merge internet dataset + pseudo dataset
3) Fine-tune YOLO from current best (if present)
4) Evaluate and write metrics json

This is intentionally lightweight (no external DB). It works with local files and can be
scheduled (e.g., nightly) once enough new samples are collected.
"""

import argparse
import os
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    rr = _repo_root()

    parser.add_argument("--uploads-dir", default=str(rr / "backend" / "training_uploads" / "images"))
    parser.add_argument("--pseudo-out", default=str(rr / "backend" / "datasets" / "selftrain_pseudo"))
    parser.add_argument("--internet-data", default=str(rr / "backend" / "datasets" / "internet_combined" / "data.yaml"))
    parser.add_argument("--merged-out", default=str(rr / "backend" / "datasets" / "combined_selftrain"))

    # Ingest controls
    parser.add_argument("--min-conf", type=float, default=0.55)
    parser.add_argument("--valid-split", type=float, default=0.1)
    parser.add_argument("--pseudo-limit", type=int, default=100)
    parser.add_argument("--min-blur", type=float, default=25.0)
    parser.add_argument("--min-brightness", type=float, default=0.08)
    parser.add_argument("--max-brightness", type=float, default=0.98)
    parser.add_argument("--max-dets", type=int, default=3)

    # Train/eval
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--model-size", default="s")
    parser.add_argument("--finetune-from", default=str(rr / "backend" / "ml_models" / "yolo_best.pt"))

    parser.add_argument("--skip-ingest", action="store_true")
    parser.add_argument("--skip-merge", action="store_true")
    parser.add_argument("--skip-train", action="store_true")
    parser.add_argument("--skip-eval", action="store_true")

    args = parser.parse_args()

    from dataset_merge import merge_many_yolo_datasets
    from selftrain_ingest import ingest
    from yolo_eval import main as _eval_main
    from yolo_train import _default_model, train

    uploads_dir = Path(args.uploads_dir)
    pseudo_out = Path(args.pseudo_out)
    merged_out = Path(args.merged_out)
    internet_data_yaml = Path(args.internet_data)
    if not internet_data_yaml.exists():
        # Ensure internet_combined exists.
        from dataset_merge import merge_two_yolo_datasets

        merge_two_yolo_datasets(
            dataset_a=rr / "Dragon Fruit Vignan.v2i.yolov8",
            dataset_b=rr / "Dragon Fruit Vignan.v2i.yolov11",
            out_dir=rr / "backend" / "datasets" / "internet_combined",
            include_test=False,
        )

    if not args.skip_ingest:
        ingest(
            uploads_dir=uploads_dir,
            out_dataset_dir=pseudo_out,
            min_conf=float(args.min_conf),
            valid_split=float(args.valid_split),
            seed=7,
            limit=(None if int(args.pseudo_limit) <= 0 else int(args.pseudo_limit)),
            min_blur=float(args.min_blur),
            min_brightness=float(args.min_brightness),
            max_brightness=float(args.max_brightness),
            max_dets=int(args.max_dets),
        )

    if not args.skip_merge:
        # Merge internet dataset dir + pseudo dataset dir (expects split folders).
        internet_dir = internet_data_yaml.parent
        merge_many_yolo_datasets(
            datasets=[internet_dir, pseudo_out],
            out_dir=merged_out,
            include_test=False,
        )

    if not args.skip_train:
        model = _default_model("yolov8", args.model_size)
        data_yaml = merged_out / "data.yaml"
        train(
            dataset="combined",
            model=model,
            data_yaml_override=str(data_yaml),
            finetune_from=(args.finetune_from or None),
            epochs=int(args.epochs),
            imgsz=int(args.imgsz),
            device=args.device,
            batch=int(args.batch),
            patience=20,
            seed=7,
            workers=0,
            cache=False,
            optimizer="AdamW",
            lr0=None,
            cos_lr=True,
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

    if not args.skip_eval:
        # Call yolo_eval via argv-style invocation for minimal coupling.
        import sys

        sys.argv = [
            sys.argv[0],
            "--weights",
            str(rr / "backend" / "ml_models" / "yolo_best.pt"),
            "--data",
            str((merged_out / "data.yaml") if merged_out.exists() else internet_data_yaml),
            "--imgsz",
            str(int(args.imgsz)),
            "--device",
            str(args.device),
        ]
        _eval_main()


if __name__ == "__main__":
    main()
