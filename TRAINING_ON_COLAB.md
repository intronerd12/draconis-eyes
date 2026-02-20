# Colab Training (Own Unhealthy Dataset)

Use this for your local folder dataset:
- `Own Dataset/not healthy dragon`

Target output:
- `yolo_bad_own.pt`

## 1) Create The Zip Locally
Run:

```powershell
.\prepare_own_bad_zip.ps1
```

This creates:
- `own_not_healthy_dragon_v2.zip`

## 2) Upload To Google Drive
Upload `own_not_healthy_dragon_v2.zip` to:
- `/content/drive/MyDrive/DragonFruit/own_not_healthy_dragon_v2.zip`

Optional (for fine-tuning from your existing model):
- `/content/drive/MyDrive/DragonFruit/yolo_best.pt`

## 3) Paste This Single Cell In Colab
Set Colab runtime to GPU first (`Runtime` -> `Change runtime type` -> `T4 GPU`), then run:

```python
from google.colab import drive, files
drive.mount("/content/drive")

!pip -q install ultralytics pyyaml

import hashlib
import random
import shutil
import zipfile
from pathlib import Path

import yaml
from ultralytics import YOLO

# ================== CONFIG ==================
ZIP_PATH = Path("/content/drive/MyDrive/DragonFruit/own_not_healthy_dragon_v2.zip")
BASE_WEIGHTS = Path("/content/drive/MyDrive/DragonFruit/yolo_best.pt")  # optional
CLASS_NAME = "not_healthy_dragon"

EPOCHS = 30
IMGSZ = 640
BATCH = 16
DEVICE = 0  # GPU 0. Use "cpu" if no GPU.

VAL_RATIO = 0.2
SEED = 42

RUN_NAME = "dragon_bad_own"
RUNS_PROJECT = Path("/content/runs/detect")
OUT_WEIGHTS = Path("/content/yolo_bad_own.pt")
# ============================================

if not ZIP_PATH.exists():
    raise FileNotFoundError(f"Zip not found: {ZIP_PATH}")

work_root = Path("/content/dragon_bad_own_workspace")
raw_dir = work_root / "raw"
yolo_dir = work_root / "yolo"
run_dir = RUNS_PROJECT / RUN_NAME

for p in (work_root, run_dir):
    if p.exists():
        shutil.rmtree(p)

raw_dir.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(ZIP_PATH, "r") as zf:
    zf.extractall(raw_dir)

img_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
all_images = [p for p in raw_dir.rglob("*") if p.is_file() and p.suffix.lower() in img_exts]

if not all_images:
    raise RuntimeError("No images found in zip.")

random.seed(SEED)
random.shuffle(all_images)

val_count = int(round(len(all_images) * VAL_RATIO))
val_count = max(1, min(val_count, len(all_images) - 1))
val_images = all_images[:val_count]
train_images = all_images[val_count:]

for split in ("train", "val"):
    (yolo_dir / split / "images").mkdir(parents=True, exist_ok=True)
    (yolo_dir / split / "labels").mkdir(parents=True, exist_ok=True)

def safe_name(text: str) -> str:
    out = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in text)
    return out.strip("._-") or "img"

def write_sample(src_img: Path, split: str) -> None:
    digest = hashlib.sha1(str(src_img).encode("utf-8")).hexdigest()[:10]
    img_name = f"{safe_name(src_img.stem)}_{digest}{src_img.suffix.lower()}"
    dst_img = yolo_dir / split / "images" / img_name
    dst_lbl = yolo_dir / split / "labels" / f"{Path(img_name).stem}.txt"

    shutil.copy2(src_img, dst_img)
    # Full-image pseudo box: class x_center y_center width height
    dst_lbl.write_text("0 0.5 0.5 1.0 1.0\n", encoding="utf-8")

for p in train_images:
    write_sample(p, "train")
for p in val_images:
    write_sample(p, "val")

data_yaml = yolo_dir / "data.yaml"
data = {
    "path": str(yolo_dir),
    "train": "train/images",
    "val": "val/images",
    "nc": 1,
    "names": [CLASS_NAME],
}
data_yaml.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")

weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8s.pt"
print(f"Starting weights: {weights}")
print(f"Train images: {len(train_images)}, Val images: {len(val_images)}")

model = YOLO(weights)
results = model.train(
    data=str(data_yaml),
    epochs=EPOCHS,
    imgsz=IMGSZ,
    batch=BATCH,
    device=DEVICE,
    project=str(RUNS_PROJECT),
    name=RUN_NAME,
    exist_ok=False,
)

best_pt = Path(results.save_dir) / "weights" / "best.pt"
if not best_pt.exists():
    raise FileNotFoundError(f"Training finished but best.pt missing: {best_pt}")

shutil.copy2(best_pt, OUT_WEIGHTS)
print(f"Saved final model: {OUT_WEIGHTS}")
files.download(str(OUT_WEIGHTS))
```

## Notes
- This dataset has image-level class only (no real boxes). The cell creates full-image pseudo boxes so YOLO training can run.
- Keep `EPOCHS = 30` as requested.
- If training fails due memory, reduce `BATCH` from `16` to `8`.
