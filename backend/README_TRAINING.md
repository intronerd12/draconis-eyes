# Self-Trained Dragonfruit AI (YOLOv8 / YOLOv11)

This backend supports training a self-trained detection model using your **internet datasets**:
- `Dragon Fruit.yolov8/`
- `Dragon Fruit.yolov11/`

It can also combine both into one training dataset, then save `backend/ml_models/yolo_best.pt` so the API can automatically use it for scanning.

## 1) Install ML requirements

Ultralytics is not included in `requirements.txt` (the API still works without it).

Install:
```bash
pip install -r backend/requirements-ml.txt
```

## 2) (Optional) Merge YOLOv8 + YOLOv11 datasets

This creates:
- `backend/datasets/internet_combined/`
- `backend/datasets/internet_combined/data.yaml`

It uses hardlinks when possible (fast + no double storage), otherwise it copies.

```bash
python backend/dataset_merge.py --include-test
```

## 3) Train (recommended)

Train using the combined dataset:
```bash
python backend/yolo_train.py --dataset combined --model-size s --epochs 120 --imgsz 640 --device cpu --cache --cos-lr
```

Train only YOLOv8 dataset:
```bash
python backend/yolo_train.py --dataset yolov8 --model-size s --epochs 120 --imgsz 640 --device cpu --cache --cos-lr
```

Train only YOLOv11 dataset:
```bash
python backend/yolo_train.py --dataset yolov11 --model-size s --epochs 120 --imgsz 640 --device cpu --cache --cos-lr
```

Outputs:
- Runs: `backend/ml_models/yolo_runs/<run_name>/`
- Best weights: `backend/ml_models/yolo_best.pt`
- Training metadata: `backend/ml_models/yolo_best.meta.json`

## 4) Use the model in scanning

When `backend/ml_models/yolo_best.pt` exists and Ultralytics is installed, `/detect` will include:
- `detection_backend: "yolo"`
- `detections: [...]`

If weights or Ultralytics are missing, it safely falls back to heuristics.

## 5) Upload shop photos for self-training (later)

API:
- `POST /train/upload` (multipart `file`)
- `GET /train/pending`

Then pseudo-label them to make a trainable dataset:
```bash
python backend/selftrain_ingest.py
```

