# Self-Trained Dragonfruit AI (YOLOv8 / YOLOv11)

This backend supports training a self-trained detection model using your **internet datasets**:
- `Dragon Fruit Vignan.v2i.yolov8/`
- `Dragon Fruit Vignan.v2i.yolov11/`

It can also combine both into one training dataset, then save `backend/ml_models/yolo_best.pt` so the API can automatically use it for scanning.

## 1) Install ML requirements

Ultralytics is not included in `requirements.txt` (the API still works without it).

Install:
```bash
pip install -r backend/requirements-ml.txt
```

Or (Windows / this repo's venv):
```bash
cd backend
npm run ml:install
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

For best accuracy (trains both YOLOv8 + YOLOv11 and auto-selects the best on validation):
```bash
python backend/train_full.py --device cpu --cache --cos-lr
```

Train only YOLOv8 dataset:
```bash
python backend/yolo_train.py --dataset yolov8 --model-size s --epochs 120 --imgsz 640 --device cpu --cache --cos-lr
```

Train only YOLOv11 dataset:
```bash
python backend/yolo_train.py --dataset yolov11 --model-size s --epochs 120 --imgsz 640 --device cpu --cache --cos-lr
```

Fine-tune from an existing checkpoint (recommended once you have a good `yolo_best.pt`):
```bash
python backend/yolo_train.py --dataset combined --finetune-from backend/ml_models/yolo_best.pt --epochs 60 --imgsz 640 --device cpu --cos-lr
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

### Dev mode (recommended)

Running `npm run dev` in `backend/` starts both:
- Node API (`server.js`)
- Python AI service (`uvicorn main:app`)

It also auto-installs ML requirements and (if missing) auto-trains `ml_models/yolo_best.pt` so scanning works consistently.

Optional:
- Use `npm run dev:no-train` to skip auto-training if weights are missing.
- Set `DRAGON_BOOTSTRAP_EPOCHS=40` to control the auto-train epochs used by `npm run dev`.

While bootstrapping, the AI service starts immediately (heuristics fallback) and will automatically switch to YOLO once training finishes.

## 5) Upload shop photos for self-training (later)

API:
- `POST /train/upload` (multipart `file`)
- `GET /train/pending`

Then pseudo-label them to make a trainable dataset:
```bash
python backend/selftrain_ingest.py
```

Or run the full self-training loop (ingest -> merge -> fine-tune -> eval):
```bash
python backend/selftrain_pipeline.py --device cpu --pseudo-limit 100
```

Notes:
- The base training set uses the full internet datasets from:
  - `Dragon Fruit Vignan.v2i.yolov8/`
  - `Dragon Fruit Vignan.v2i.yolov11/`
- The self-training loop adds a small batch of new shop/mobile images each run (default: 100) to keep labels clean and training stable.

## Keeping the model improving automatically (recommended workflow)

1) Run the server normally (scanning uses `backend/ml_models/yolo_best.pt`).
2) Keep collecting new shop/mobile images (opt-in upload + auto-collection).
3) Re-train on a schedule:
   - Nightly/weekly: fine-tune using new images + full base dataset:
     ```bash
     cd backend
     npm run retrain:self
     ```
   - Monthly (or after major dataset updates): full retrain and auto-select best backbone:
     ```bash
     cd backend
     npm run train:full
     ```

To lock down the reload endpoint, set `DRAGON_ADMIN_TOKEN` in the Python environment and pass the same value as `X-Admin-Token` when calling reload.
