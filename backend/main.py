from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageOps
import base64
import io
import json
import os
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
import numpy as np

try:
    from yolo_runtime import get_yolo_runtime, detections_to_mask, reset_yolo_runtime
except Exception:
    get_yolo_runtime = None
    detections_to_mask = None
    reset_yolo_runtime = None

try:
    from selftrain.collector import compute_image_quality, save_training_sample, should_collect_sample
except Exception:
    compute_image_quality = None
    save_training_sample = None
    should_collect_sample = None

app = FastAPI(title="Dragon Fruit Quality Detection System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup_check():
    try:
        rt = get_yolo_runtime() if callable(get_yolo_runtime) else None
        if rt is not None:
            print("AI: YOLO self-trained model enabled.")
            return

        weights_env = os.environ.get("DRAGON_YOLO_WEIGHTS")
        weights_exists = bool(weights_env and os.path.exists(weights_env))
        bootstrap = os.environ.get("DRAGON_MODEL_BOOTSTRAP") == "1"

        ultralytics_ok = True
        try:
            import ultralytics  # noqa: F401
        except Exception:
            ultralytics_ok = False

        if bootstrap and not weights_exists:
            print("AI: YOLO training in progress. Using heuristic fallback until weights are ready.")
        elif not ultralytics_ok:
            print("AI: YOLO disabled (ultralytics not installed). Using heuristic fallback.")
        elif not weights_exists:
            print("AI: YOLO disabled (missing weights). Using heuristic fallback.")
        else:
            print("AI: YOLO disabled (unknown reason). Using heuristic fallback.")
    except Exception:
        print("AI: YOLO model check failed. Using heuristic fallback.")

ANALYSIS_HISTORY = []
MAX_HISTORY = 20
LABELED_CORRECTIONS = []
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
LABELS_JSONL_PATH = os.path.join(DATA_DIR, "labels.jsonl")
SCANS_JSONL_PATH = os.path.join(DATA_DIR, "scans.jsonl")
PRICE_MODEL_PATH = os.path.join(MODEL_DIR, "price_model.json")
DEFAULT_CURRENCY = "PHP"
PH_RETAIL_GOOD_MIN = 136.17
PH_RETAIL_GOOD_MAX = 245.11
PH_RETAIL_BAD_MIN = 40.0
TRAINING_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "training_uploads", "images")

# Active-learning queue (opt-in via env)
SELFTRAIN_QUEUE_JSONL = os.path.join(DATA_DIR, "selftrain_queue.jsonl")


def _ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(TRAINING_UPLOAD_DIR, exist_ok=True)


def _append_jsonl(path: str, payload: dict):
    _ensure_dirs()
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def _read_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except Exception:
                continue
    return items


def _grade_num(grade: str | None) -> float:
    g = (grade or "").upper()
    if g == "A":
        return 3.0
    if g == "B":
        return 2.0
    if g == "C":
        return 1.0
    return 0.0


def _size_num(size_category: str | None) -> float:
    s = (size_category or "").lower()
    if s == "large":
        return 3.0
    if s == "medium":
        return 2.0
    if s == "small":
        return 1.0
    return 0.0


def _ridge_fit(X: np.ndarray, y: np.ndarray, lam: float) -> np.ndarray:
    n_features = X.shape[1]
    reg = np.eye(n_features, dtype=float) * float(lam)
    reg[0, 0] = 0.0
    XtX = X.T @ X
    Xty = X.T @ y
    return np.linalg.solve(XtX + reg, Xty)


def _ridge_predict(X: np.ndarray, coef: np.ndarray) -> np.ndarray:
    return X @ coef


def _load_price_model() -> dict:
    _ensure_dirs()
    if os.path.exists(PRICE_MODEL_PATH):
        try:
            with open(PRICE_MODEL_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and "coef" in data and "feature_names" in data:
                return data
        except Exception:
            pass

    return {
        "type": "ridge_linear",
        "target": "price_per_kg",
        "currency": DEFAULT_CURRENCY,
        "feature_names": [
            "intercept",
            "quality_score",
            "ripeness_score",
            "defect_probability",
            "fruit_area_ratio",
            "color_score",
            "grade_num",
            "size_num",
        ],
        "coef": [180.0, 0.9, 0.3, -6.0, 120.0, 15.0, 12.0, 8.0],
        "lambda": 1.0,
        "n_samples": 0,
        "metrics": {},
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }


PRICE_MODEL = _load_price_model()


def _price_features(features: dict) -> list[float]:
    return [
        1.0,
        float(features.get("quality_score") or 0.0),
        float(features.get("ripeness_score") or 0.0),
        float(features.get("defect_probability") or 0.0),
        float(features.get("fruit_area_ratio") or 0.0),
        float(features.get("color_score") or 0.0),
        float(features.get("grade_num") or 0.0),
        float(features.get("size_num") or 0.0),
    ]


def _predict_price_per_kg(features: dict) -> float:
    coef = PRICE_MODEL.get("coef") or []
    if not isinstance(coef, list) or not coef:
        return 0.0
    x = np.array(_price_features(features), dtype=float)
    c = np.array(coef, dtype=float)
    if x.shape[0] != c.shape[0]:
        return 0.0
    return float(x @ c)


def _clamp(v: float, lo: float, hi: float) -> float:
    if v < lo:
        return lo
    if v > hi:
        return hi
    return v


def _price_bounds_per_kg(grade: str, defect_level: str, is_valid_fruit: bool) -> tuple[float, float]:
    if not is_valid_fruit:
        return (0.0, 0.0)

    good_lo = float(PH_RETAIL_GOOD_MIN)
    good_hi = float(PH_RETAIL_GOOD_MAX)
    bad_lo = float(PH_RETAIL_BAD_MIN)

    if grade == "A":
        lo, hi = good_lo * 0.95, good_hi
    elif grade == "B":
        lo, hi = good_lo * 0.80, good_hi * 0.93
    else:
        lo, hi = good_lo * 0.45, good_lo * 0.90

    if defect_level == "high":
        lo, hi = lo * 0.85, hi * 0.80
    elif defect_level == "medium":
        lo, hi = lo * 0.95, hi * 0.92

    lo = max(bad_lo, lo)
    hi = max(lo, hi)
    return (float(lo), float(hi))


def _baseline_price_per_kg(grade: str, quality_score: float, defect_probability: float, defect_level: str) -> float:
    q = float(np.clip(float(quality_score) / 100.0, 0.0, 1.0))
    d = float(np.clip(float(defect_probability) / 100.0, 0.0, 1.0))

    base = float(PH_RETAIL_GOOD_MIN) + (float(PH_RETAIL_GOOD_MAX) - float(PH_RETAIL_GOOD_MIN)) * q
    if grade == "A":
        grade_mult = 1.0
    elif grade == "B":
        grade_mult = 0.90
    else:
        grade_mult = 0.75

    penalty = 1.0 - (0.35 * d)
    if defect_level == "high":
        penalty *= 0.80
    elif defect_level == "medium":
        penalty *= 0.92

    price = base * grade_mult * penalty
    lo, hi = _price_bounds_per_kg(grade, defect_level, True)
    return float(_clamp(float(price), lo, hi))


def _retrain_price_model() -> dict | None:
    rows = _read_jsonl(LABELS_JSONL_PATH)
    train = []
    for r in rows:
        price = r.get("correct_price_per_kg")
        feats = r.get("features")
        currency = r.get("currency")
        if price is None or feats is None:
            continue
        if currency and str(currency).upper() != DEFAULT_CURRENCY:
            continue
        train.append((feats, float(price)))

    if len(train) < 5:
        return None

    X = np.array([_price_features(feats) for feats, _ in train], dtype=float)
    y = np.array([p for _, p in train], dtype=float)
    lam = float(PRICE_MODEL.get("lambda") or 1.0)
    coef = _ridge_fit(X, y, lam)
    pred = _ridge_predict(X, coef)
    mae = float(np.mean(np.abs(pred - y)))

    updated = {
        **PRICE_MODEL,
        "coef": [float(v) for v in coef.tolist()],
        "n_samples": int(len(train)),
        "metrics": {"mae": mae},
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    _ensure_dirs()
    with open(PRICE_MODEL_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)

    return updated


def _segmentation_mask_from_colors(masks: list[np.ndarray]) -> np.ndarray:
    if not masks:
        return np.zeros((1, 1), dtype=bool)
    mask = np.zeros_like(masks[0], dtype=bool)
    for m in masks:
        mask |= m.astype(bool)
    if mask.size == 0:
        return mask

    # Improved filtering: Use OpenCV if available for robust noise removal
    try:
        import cv2
        # Convert to uint8 for OpenCV
        m_uint8 = (mask.astype(np.uint8) * 255)
        
        # Morphological Open (remove small noise) then Close (fill gaps)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        m_opened = cv2.morphologyEx(m_uint8, cv2.MORPH_OPEN, kernel)
        m_closed = cv2.morphologyEx(m_opened, cv2.MORPH_CLOSE, kernel)
        
        # Keep only the largest connected component
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(m_closed, connectivity=8)
        if num_labels > 1:
            # stats[1:] because 0 is background. Find index of max area.
            largest_idx = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]) 
            mask = (labels == largest_idx)
        else:
            mask = (m_closed > 0)
            
    except Exception:
        # Fallback to simple neighbor count if cv2 is missing
        for _ in range(2):
            p = np.pad(mask.astype(np.uint8), 1, mode="edge")
            s = (
                p[0:-2, 0:-2]
                + p[0:-2, 1:-1]
                + p[0:-2, 2:]
                + p[1:-1, 0:-2]
                + p[1:-1, 1:-1]
                + p[1:-1, 2:]
                + p[2:, 0:-2]
                + p[2:, 1:-1]
                + p[2:, 2:]
            )
            mask = s >= 4
            
    return mask


def _mask_bbox(mask: np.ndarray, width: int, height: int) -> tuple[int, int, int, int]:
    ys, xs = np.where(mask)
    if len(xs) == 0 or len(ys) == 0:
        return (0, 0, width - 1, height - 1)
    x0 = int(xs.min())
    x1 = int(xs.max())
    y0 = int(ys.min())
    y1 = int(ys.max())
    return (x0, y0, x1, y1)


def _bbox_pad(b: tuple[int, int, int, int], width: int, height: int, pad_frac: float = 0.08) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = b
    bw = max(1, x1 - x0)
    bh = max(1, y1 - y0)
    pad_x = int(round(bw * float(pad_frac)))
    pad_y = int(round(bh * float(pad_frac)))
    x0 = max(0, x0 - pad_x)
    y0 = max(0, y0 - pad_y)
    x1 = min(width - 1, x1 + pad_x)
    y1 = min(height - 1, y1 + pad_y)
    return (x0, y0, x1, y1)


def _bbox_to_mask(b: tuple[int, int, int, int], width: int, height: int) -> np.ndarray:
    x0, y0, x1, y1 = b
    x0 = max(0, min(int(x0), width - 1))
    x1 = max(0, min(int(x1), width - 1))
    y0 = max(0, min(int(y0), height - 1))
    y1 = max(0, min(int(y1), height - 1))
    m = np.zeros((height, width), dtype=bool)
    if x1 > x0 and y1 > y0:
        m[y0:y1, x0:x1] = True
    return m


def _segmentation_preview_base64(image: Image.Image, mask: np.ndarray, bbox: tuple[int, int, int, int]) -> str | None:
    try:
        preview = image.copy().convert("RGBA")
        arr = np.array(preview)
        alpha = np.zeros((arr.shape[0], arr.shape[1]), dtype=np.uint8)
        alpha[mask] = 90
        overlay = np.zeros_like(arr)
        overlay[..., 0] = 230
        overlay[..., 1] = 0
        overlay[..., 2] = 92
        overlay[..., 3] = alpha
        blended = Image.alpha_composite(Image.fromarray(arr), Image.fromarray(overlay))

        x0, y0, x1, y1 = bbox
        x0 = max(0, min(x0, blended.size[0] - 1))
        x1 = max(0, min(x1, blended.size[0] - 1))
        y0 = max(0, min(y0, blended.size[1] - 1))
        y1 = max(0, min(y1, blended.size[1] - 1))

        border = blended.load()
        for x in range(x0, x1 + 1):
            if 0 <= y0 < blended.size[1]:
                border[x, y0] = (255, 255, 255, 220)
            if 0 <= y1 < blended.size[1]:
                border[x, y1] = (255, 255, 255, 220)
        for y in range(y0, y1 + 1):
            if 0 <= x0 < blended.size[0]:
                border[x0, y] = (255, 255, 255, 220)
            if 0 <= x1 < blended.size[0]:
                border[x1, y] = (255, 255, 255, 220)

        max_w = 720
        if blended.size[0] > max_w:
            ratio = max_w / blended.size[0]
            blended = blended.resize((max_w, int(blended.size[1] * ratio)))

        buf = io.BytesIO()
        blended.convert("RGB").save(buf, format="JPEG", quality=82)
        return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        return None


def _recommendations(ripeness_score: float, defect_level: str, size_category: str, market_value_label: str) -> list[str]:
    tips: list[str] = []
    if market_value_label == "Rejected":
        tips.append("Rescan with the fruit centered and well-lit.")
        tips.append("Remove background clutter and avoid glare.")
        return tips

    if defect_level == "high":
        tips.append("Separate this fruit from the rest of the batch to prevent spread.")
        tips.append("Inspect for soft spots and odor; discard if leaking or moldy.")
        tips.append("Sanitize crates and sorting surface after handling.")
    elif defect_level == "medium":
        tips.append("Prioritize selling or processing sooner; monitor for fast spoilage.")
        tips.append("Handle gently to avoid bruising and worsening spots.")
    else:
        tips.append("Store in a cool, dry place with airflow to maintain quality.")

    if ripeness_score >= 95:
        tips.append("Sell/consume within 24 hours for best quality.")
    elif ripeness_score >= 85:
        tips.append("Sell/consume within 2–3 days; avoid stacking pressure.")
    else:
        tips.append("Allow ripening at room temperature; check daily for color change.")

    if size_category == "Large":
        tips.append("Use premium packaging to reduce handling damage during transport.")

    if market_value_label == "Premium":
        tips.append("Allocate to premium/export lane and keep a consistent temperature chain.")
    elif market_value_label == "Standard":
        tips.append("Allocate to local market lane; maintain clean sorting and ventilation.")
    else:
        tips.append("Allocate to processing lane; remove defects before slicing.")

    return tips


@app.get("/")
def read_root():
    return {"message": "Welcome to the Intelligent Dragon Fruit Ripeness and Quality Detection System API"}


@app.get("/health")
def health_check():
    rt = get_yolo_runtime() if callable(get_yolo_runtime) else None
    weights_env = os.environ.get("DRAGON_YOLO_WEIGHTS")
    weights_exists = bool(weights_env and os.path.exists(weights_env))
    return {
        "status": "healthy",
        "yolo_enabled": bool(rt),
        "weights_path": weights_env,
        "weights_exists": weights_exists,
        "selftrain_enabled": os.environ.get("DRAGON_SELFTRAIN_ENABLED") == "1",
        "bootstrap_training": os.environ.get("DRAGON_MODEL_BOOTSTRAP") == "1",
    }


@app.post("/admin/reload-yolo")
def reload_yolo(x_admin_token: str | None = Header(None, alias="X-Admin-Token")):
    token = os.environ.get("DRAGON_ADMIN_TOKEN")
    if token and (not x_admin_token or x_admin_token != token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if callable(reset_yolo_runtime):
        reset_yolo_runtime()
    rt = get_yolo_runtime() if callable(get_yolo_runtime) else None
    return {"status": "ok", "enabled": bool(rt)}


@app.post("/train/upload")
async def train_upload(file: UploadFile = File(...), source: str | None = Form(None)):
    _ensure_dirs()
    contents = await file.read()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"
    image_id = str(uuid.uuid4())
    name = f"{image_id}.{ext}"
    path = os.path.join(TRAINING_UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(contents)
    _append_jsonl(
        os.path.join(DATA_DIR, "uploads.jsonl"),
        {"id": image_id, "timestamp": datetime.now(timezone.utc).isoformat(), "filename": name, "source": source},
    )
    return {"status": "ok", "id": image_id, "filename": name}


@app.get("/train/pending")
def train_pending():
    _ensure_dirs()
    try:
        count = len([p for p in os.listdir(TRAINING_UPLOAD_DIR) if os.path.isfile(os.path.join(TRAINING_UPLOAD_DIR, p))])
    except Exception:
        count = 0
    return {"pending_images": count}


@app.post("/detect")
async def detect_quality(
    file: UploadFile = File(...),
    batch_id: str | None = Form(None),
    lat: float | None = Form(None),
    lon: float | None = Form(None),
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        # Handle phone orientation correctly (common for mobile captures)
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass
        image = image.convert('RGB')
        
        # Real Heuristic Analysis (Non-Mock)
        # 1. Image Properties
        width, height = image.size
        area = width * height
        
        # 2. Color Analysis for Ripeness
        # Convert to numpy array for fast processing
        img_array = np.array(image)
        quality_metrics = None
        if callable(compute_image_quality):
            try:
                quality_metrics = compute_image_quality(img_array)
            except Exception:
                quality_metrics = None

        yolo_runtime = get_yolo_runtime() if callable(get_yolo_runtime) else None
        yolo_detections = []
        yolo_mask = None
        if yolo_runtime:
            try:
                dets = yolo_runtime.predict(image, conf=0.35)
                yolo_detections = [
                    {
                        "x0": d.x0,
                        "y0": d.y0,
                        "x1": d.x1,
                        "y1": d.y1,
                        "conf": round(float(d.conf), 4),
                        "cls": int(d.cls),
                        "name": d.name,
                    }
                    for d in dets
                ]
                if dets and callable(detections_to_mask):
                    yolo_mask = detections_to_mask(dets, width, height)
            except Exception:
                yolo_detections = []
                yolo_mask = None

        # Pick the most reliable detection as the primary fruit region (handles multi-fruit frames).
        primary_bbox = None
        if yolo_detections:
            best = max(yolo_detections, key=lambda d: float(d.get("conf", 0.0)))
            try:
                primary_bbox = (
                    int(best.get("x0", 0)),
                    int(best.get("y0", 0)),
                    int(best.get("x1", width - 1)),
                    int(best.get("y1", height - 1)),
                )
                primary_bbox = _bbox_pad(primary_bbox, width, height, pad_frac=0.10)
            except Exception:
                primary_bbox = None
        
        # --- DRAGON FRUIT VERIFICATION LOGIC ---
        # Heuristic: Check if image contains significant Dragon Fruit colors (Pink, Red, Yellow, Green)
        # R, G, B channels
        R = img_array[:, :, 0]
        G = img_array[:, :, 1]
        B = img_array[:, :, 2]

        # Pink/Red (Skin): Red dominant, Green low
        mask_pink_red = (R > G * 1.2) & (R > B * 0.8) & (R > 50)
        
        # Yellow (Yellow Pitaya): Red + Green high, Blue low
        mask_yellow = (R > 100) & (G > 100) & (B < 100)
        
        # Green (Wings/Scales): Green dominant
        mask_green = (G > R * 1.05) & (G > B * 1.05) & (G > 40)
        
        # White (Flesh): High brightness, low saturation (R~G~B > 150)
        mask_white = (R > 150) & (G > 150) & (B > 150) & (np.abs(R - G) < 30) & (np.abs(G - B) < 30)

        # Count pixels
        dragon_fruit_pixels = np.sum(mask_pink_red | mask_yellow | mask_green | mask_white)
        total_pixels = width * height
        relevance_ratio = dragon_fruit_pixels / total_pixels
        
        is_valid_fruit = True
        warning_message = None
        
        # Threshold: At least 20% of the image should be relevant colors if no YOLO detection found
        if (not yolo_detections) and relevance_ratio < 0.20:
            is_valid_fruit = False
            warning_message = "The image is not a dragon fruit or not related to dragonfruit"
            grade = "N/A"
            fruit_type = "Unknown Object"
        
        color_union = mask_pink_red | mask_yellow | mask_green | mask_white

        # Prefer YOLO-guided region when available; intersect with color cues to reduce background.
        if primary_bbox is not None:
            bbox_mask = _bbox_to_mask(primary_bbox, width, height)
            inter = bbox_mask & color_union
            seg_mask = inter if int(np.sum(inter)) > 0 else bbox_mask
        elif yolo_mask is not None and yolo_mask.shape == color_union.shape:
            inter = yolo_mask & color_union
            seg_mask = inter if int(np.sum(inter)) > 0 else yolo_mask.astype(bool)
        else:
            seg_mask = _segmentation_mask_from_colors([mask_pink_red, mask_yellow, mask_green, mask_white])
        fruit_area_pixels = int(np.sum(seg_mask))
        fruit_area_ratio = float(fruit_area_pixels / max(1, total_pixels))
        bbox = _mask_bbox(seg_mask, width, height)
        preview_b64 = _segmentation_preview_base64(image, seg_mask, bbox)

        masked = img_array[seg_mask] if fruit_area_pixels > 0 else img_array.reshape(-1, 3)
        avg_color = masked.mean(axis=0) if masked.size else img_array.mean(axis=(0, 1))
        r, g, b = [float(v) for v in avg_color.tolist()]
        
        # Ripeness Heuristic: Dragon fruit turns from Green to Pink/Red
        # Normalized Redness Index = (R - G) / (R + G)
        # If Green > Red, it's unripe (negative index)
        # If Red > Green, it's ripe (positive index)
        
        total_intensity = r + g + b + 0.1 # Avoid div by zero
        redness_ratio = r / total_intensity
        greenness_ratio = g / total_intensity
        
        # Ripeness Score (0-100)
        # Assume ideal ripe is mostly red/pink (High R, Mod B, Low G)
        # Unripe is High G
        
        if greenness_ratio > redness_ratio:
            # Unripe
            ripeness_score = max(10, 50 - (greenness_ratio * 100))
            fruit_status = "Unripe"
        else:
            # Ripe
            ripeness_score = min(99, 60 + (redness_ratio * 100))
            fruit_status = "Ripe"
            
        # 3. Quality Score based on Brightness/Vibrancy
        brightness = (r + g + b) / 3
        quality_score = min(98, (brightness / 255) * 100 + 40) # Simple heuristic
        
        # 4. Defect Detection (Simple Blob/Contrast)
        # Convert to grayscale (defects should be computed on the fruit region, not background)
        gray = np.mean(img_array, axis=2)
        gray_roi = gray[seg_mask] if fruit_area_pixels > 0 else gray.reshape(-1)
        if gray_roi.size:
            p10 = float(np.percentile(gray_roi, 10))
            # Adaptive dark threshold: robust to lighting; keep a floor to avoid over-triggering.
            thr = max(35.0, p10 - 18.0)
            dark_pixels = int(np.sum(gray_roi < thr))
            defect_ratio = (dark_pixels / max(1, int(gray_roi.size))) * 100.0
        else:
            defect_ratio = 0.0

        defect_probability = float(min(90.0, defect_ratio * 9.0))
        
        if fruit_area_ratio < 0.12:
            size_category = "Small"
        elif fruit_area_ratio < 0.26:
            size_category = "Medium"
        else:
            size_category = "Large"

        weight_grams = int(round(np.clip(200.0 + 1650.0 * fruit_area_ratio, 180.0, 900.0)))
            
        brightness_rgb = (r + g + b) / 3.0
        sat_rgb = (max(r, g, b) - min(r, g, b))

        if is_valid_fruit:
            if (r > 110 and g > 110 and b < 120) and abs(r - g) < 70:
                fruit_type = "Yellow (Selenicereus megalanthus)"
            elif brightness_rgb > 175 and sat_rgb < 55:
                fruit_type = "White (Hylocereus undatus)"
            else:
                fruit_type = "Pink (Hylocereus undatus)"
        
        # Shape Analysis
        aspect_ratio = max(width, height) / min(width, height)
        if 1.0 <= aspect_ratio <= 1.2:
            shape_quality = "Perfectly Oval"
            shape_score = 10
        elif 1.2 < aspect_ratio <= 1.4:
            shape_quality = "Slightly Irregular"
            shape_score = 8
        else:
            shape_quality = "Irregular/Deformed"
            shape_score = 5

        # Wings Analysis based on ripeness
        if ripeness_score < 50:
            wings_condition = "Green & Firm"
        elif ripeness_score < 85:
            wings_condition = "Green with Red Tips"
        else:
            wings_condition = "Red/Pink & Soft"

        # Disease/Defect Logic
        if defect_probability < 3:
            defect_level = "low"
            disease_status = "Healthy"
        elif defect_probability < 7:
            defect_level = "medium"
            disease_status = "Minor Spotting"
        else:
            defect_level = "high"
            disease_status = "Potential Rot/Fungal Infection"

        # Shelf Life Logic
        if defect_probability >= 7 or ripeness_score >= 95:
            shelf_life_days = 1
            shelf_life_label = "Consume immediately"
        elif defect_probability >= 3 or ripeness_score >= 85:
            shelf_life_days = 3
            shelf_life_label = "2–3 days"
        else:
            shelf_life_days = 5
            shelf_life_label = "4–5 days"

        # Grading
        if not is_valid_fruit:
            grade = "N/A"
        elif quality_score > 85 and defect_probability < 4 and size_category != "Small":
            grade = "A"
        elif quality_score > 70 and defect_probability < 8:
            grade = "B"
        else:
            grade = "C"
            
        color_score = float(np.clip((redness_ratio - greenness_ratio) * 10.0 + 3.5, 0.0, 10.0))
        features = {
            "quality_score": float(round(quality_score, 3)),
            "ripeness_score": float(round(ripeness_score, 3)),
            "defect_probability": float(round(defect_probability, 3)),
            "fruit_area_ratio": float(round(fruit_area_ratio, 6)),
            "color_score": float(round(color_score, 4)),
            "grade_num": _grade_num(grade),
            "size_num": _size_num(size_category),
        }

        if is_valid_fruit:
            lo_price, hi_price = _price_bounds_per_kg(grade, defect_level, True)
            model_price = _predict_price_per_kg(features)
            baseline_price = _baseline_price_per_kg(grade, quality_score, defect_probability, defect_level)
            if model_price > 0:
                model_price = float(_clamp(float(model_price), lo_price, hi_price))
                estimated_price_per_kg = float((0.70 * model_price) + (0.30 * baseline_price))
            else:
                estimated_price_per_kg = float(baseline_price)
        else:
            estimated_price_per_kg = 0.0

        if not is_valid_fruit:
            market_value_label = "Rejected"
            market_value_score = 0
            sorting_lane = "Rejected"
        elif grade == "A":
            market_value_label = "Premium"
            market_value_score = 92 if defect_level == "low" else 85
            sorting_lane = "Export / Premium"
        elif grade == "B":
            market_value_label = "Standard"
            market_value_score = 75 if defect_level != "high" else 62
            sorting_lane = "Local Market"
        else:
            market_value_label = "Processing"
            market_value_score = 55 if defect_level != "high" else 35
            sorting_lane = "Processing / Reject check"

        recommendations = _recommendations(ripeness_score, defect_level, size_category, market_value_label)

        result = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "batch_id": batch_id,
            "lat": lat,
            "lon": lon,
            "width": width,
            "height": height,
            "fruit_type": fruit_type,
            "grade": grade,
            "is_valid_fruit": is_valid_fruit,
            "warning_message": warning_message,
            "size_category": size_category,
            "weight_grams_est": weight_grams,
            "ripeness_score": round(ripeness_score, 1),
            "quality_score": round(quality_score, 1),
            "defect_probability": round(defect_probability, 1),
            "shape_quality": shape_quality,
            "wings_condition": wings_condition,
            "disease_status": disease_status,
            "defect_level": defect_level,
            "defect_regions": [], # Skipping detailed region mapping for heuristic
            "shelf_life_days": shelf_life_days,
            "shelf_life_label": shelf_life_label,
            "fruit_area_ratio": round(fruit_area_ratio, 6),
            "segmentation_bbox": {"x0": bbox[0], "y0": bbox[1], "x1": bbox[2], "y1": bbox[3]},
            "segmentation_preview_base64": preview_b64,
            "market_value_label": market_value_label,
            "market_value_score": market_value_score,
            "sorting_lane": sorting_lane,
            "estimated_price_per_kg": round(estimated_price_per_kg, 2),
            "currency": DEFAULT_CURRENCY,
            "detections": yolo_detections,
            "detection_backend": "yolo" if yolo_detections else "heuristic",
            "detection_summary": {
                "count": int(len(yolo_detections)),
                "best_conf": (max([float(d.get("conf", 0.0)) for d in yolo_detections]) if yolo_detections else 0.0),
                "primary_bbox": (
                    {"x0": int(primary_bbox[0]), "y0": int(primary_bbox[1]), "x1": int(primary_bbox[2]), "y1": int(primary_bbox[3])}
                    if primary_bbox is not None
                    else None
                ),
            },
            "image_quality": quality_metrics,
            "price_model": {
                "type": PRICE_MODEL.get("type"),
                "n_samples": PRICE_MODEL.get("n_samples"),
                "trained_at": PRICE_MODEL.get("trained_at"),
                "mae": (PRICE_MODEL.get("metrics") or {}).get("mae"),
            },
            "recommendations": recommendations,
            "notes": f"Grade {grade} {fruit_type}. {wings_condition}.",
            "color_analysis": {"r": int(round(r)), "g": int(round(g)), "b": int(round(b)), "score": round(color_score, 2)},
            "defect_description": disease_status,
        }

        ANALYSIS_HISTORY.insert(0, result)
        if len(ANALYSIS_HISTORY) > MAX_HISTORY:
            ANALYSIS_HISTORY.pop()

        _append_jsonl(
            SCANS_JSONL_PATH,
            {
                "id": result["id"],
                "timestamp": result["timestamp"],
                "features": features,
                "prediction": {
                    "grade": result["grade"],
                    "price_per_kg": result["estimated_price_per_kg"],
                    "currency": result["currency"],
                    "weight_grams": result["weight_grams_est"],
                    "size_category": result["size_category"],
                    "market_value_label": result["market_value_label"],
                },
            },
        )

        # --- Self-training collection (opt-in) ---
        # Collect hard/uncertain samples for later labeling/pseudo-labeling.
        if os.environ.get("DRAGON_SELFTRAIN_ENABLED", "0") == "1" and callable(should_collect_sample) and callable(save_training_sample):
            try:
                collect, reasons = should_collect_sample(
                    yolo_detections=yolo_detections,
                    relevance_ratio=float(relevance_ratio),
                    quality=quality_metrics,
                    min_relevance=float(os.environ.get("DRAGON_SELFTRAIN_MIN_RELEVANCE", "0.08")),
                    conf_low=float(os.environ.get("DRAGON_SELFTRAIN_CONF_LOW", "0.35")),
                    conf_high=float(os.environ.get("DRAGON_SELFTRAIN_CONF_HIGH", "0.60")),
                    min_blur=float(os.environ.get("DRAGON_SELFTRAIN_MIN_BLUR", "25.0")),
                )
                if collect:
                    fn = file.filename or "upload.jpg"
                    ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else "jpg"
                    save_training_sample(
                        image_bytes=contents,
                        ext=ext,
                        out_root=Path(TRAINING_UPLOAD_DIR),
                        queue_jsonl=Path(SELFTRAIN_QUEUE_JSONL),
                        metadata={
                            "source": "api_detect",
                            "reasons": reasons,
                            "batch_id": batch_id,
                            "lat": lat,
                            "lon": lon,
                            "relevance_ratio": float(round(float(relevance_ratio), 6)),
                            "image_quality": quality_metrics,
                            "prediction": {
                                "is_valid_fruit": bool(is_valid_fruit),
                                "grade": grade,
                                "ripeness_score": float(round(ripeness_score, 3)),
                                "quality_score": float(round(quality_score, 3)),
                                "defect_probability": float(round(defect_probability, 3)),
                            },
                            "yolo": {
                                "detections": yolo_detections,
                                "weights": os.environ.get("DRAGON_YOLO_WEIGHTS"),
                            },
                        },
                    )
            except Exception:
                pass

        return result

    except Exception as e:
        return {"error": str(e)}


@app.get("/history")
def get_history():
    total = len(ANALYSIS_HISTORY)
    if total == 0:
        return {
            "items": [],
            "total": 0,
            "average_quality": None,
            "pass_rate": None,
            "ripeness_distribution": {"under": 0, "ideal": 0, "over": 0},
            "grade_distribution": {"A": 0, "B": 0, "C": 0},
            "defect_level_distribution": {"low": 0, "medium": 0, "high": 0},
        }

    qualities = [item["quality_score"] for item in ANALYSIS_HISTORY]
    grades = [item["grade"] for item in ANALYSIS_HISTORY]

    ripeness_distribution = {"under": 0, "ideal": 0, "over": 0}
    grade_distribution = {"A": 0, "B": 0, "C": 0}
    defect_level_distribution = {"low": 0, "medium": 0, "high": 0}

    for item in ANALYSIS_HISTORY:
        r = item["ripeness_score"]
        if r < 80:
            ripeness_distribution["under"] += 1
        elif r <= 95:
            ripeness_distribution["ideal"] += 1
        else:
            ripeness_distribution["over"] += 1

        g = item["grade"]
        if g in grade_distribution:
            grade_distribution[g] += 1

        level = item.get("defect_level")
        if level in defect_level_distribution:
            defect_level_distribution[level] += 1

    average_quality = sum(qualities) / len(qualities)
    passes = sum(1 for g in grades if g in ("A", "B"))
    pass_rate = passes / len(grades) * 100

    return {
        "items": ANALYSIS_HISTORY,
        "total": total,
        "average_quality": average_quality,
        "pass_rate": pass_rate,
        "ripeness_distribution": ripeness_distribution,
        "grade_distribution": grade_distribution,
        "defect_level_distribution": defect_level_distribution,
    }


@app.get("/batches/{batch_id}")
def get_batch(batch_id: str):
    items = [item for item in ANALYSIS_HISTORY if item.get("batch_id") == batch_id]
    total = len(items)
    if total == 0:
        return {
            "items": [],
            "total": 0,
            "average_quality": None,
            "pass_rate": None,
        }

    qualities = [item["quality_score"] for item in items]
    grades = [item["grade"] for item in items]

    average_quality = sum(qualities) / len(qualities)
    passes = sum(1 for g in grades if g in ("A", "B"))
    pass_rate = passes / len(grades) * 100

    return {
        "items": items,
        "total": total,
        "average_quality": average_quality,
        "pass_rate": pass_rate,
    }


class LabelPayload(BaseModel):
    analysis_id: str
    correct_grade: str | None = None
    correct_weight_grams: float | None = None
    correct_price_per_kg: float | None = None
    currency: str | None = None


@app.post("/admin/label")
def label_scan(payload: LabelPayload):
    correction = {
        "analysis_id": payload.analysis_id,
        "correct_grade": payload.correct_grade,
        "correct_weight_grams": payload.correct_weight_grams,
        "correct_price_per_kg": payload.correct_price_per_kg,
        "currency": (payload.currency or DEFAULT_CURRENCY).upper(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    LABELED_CORRECTIONS.append(
        {k: v for k, v in correction.items() if v is not None}
    )

    matched = None
    for item in ANALYSIS_HISTORY:
        if item["id"] == payload.analysis_id:
            matched = item
            if payload.correct_grade:
                item["grade"] = payload.correct_grade
            if payload.correct_weight_grams is not None:
                item["weight_grams_est"] = int(round(float(payload.correct_weight_grams)))
            if payload.correct_price_per_kg is not None:
                item["estimated_price_per_kg"] = float(payload.correct_price_per_kg)
                item["currency"] = (payload.currency or DEFAULT_CURRENCY).upper()
            item["label_corrected"] = True

    if matched:
        features = {
            "quality_score": float(matched.get("quality_score") or 0.0),
            "ripeness_score": float(matched.get("ripeness_score") or 0.0),
            "defect_probability": float(matched.get("defect_probability") or 0.0),
            "fruit_area_ratio": float(matched.get("fruit_area_ratio") or 0.0),
            "color_score": float((matched.get("color_analysis") or {}).get("score") or 0.0),
            "grade_num": _grade_num(payload.correct_grade or matched.get("grade")),
            "size_num": _size_num(matched.get("size_category")),
        }
        correction["features"] = features

    _append_jsonl(LABELS_JSONL_PATH, {k: v for k, v in correction.items() if v is not None})

    updated_model = None
    if payload.correct_price_per_kg is not None:
        updated_model = _retrain_price_model()
        if updated_model:
            global PRICE_MODEL
            PRICE_MODEL = updated_model

    return {
        "status": "ok",
        "total_labeled": len(LABELED_CORRECTIONS),
        "price_model": PRICE_MODEL,
    }


@app.get("/reports/summary")
def reports_summary(from_date: str | None = None, to_date: str | None = None):
    filtered = ANALYSIS_HISTORY
    if from_date or to_date:
        try:
            from_dt = datetime.fromisoformat(from_date).date() if from_date else None
            to_dt = datetime.fromisoformat(to_date).date() if to_date else None
            subset = []
            for item in ANALYSIS_HISTORY:
                ts = datetime.fromisoformat(item["timestamp"]).date()
                if from_dt and ts < from_dt:
                    continue
                if to_dt and ts > to_dt:
                    continue
                subset.append(item)
            filtered = subset
        except Exception:
            filtered = ANALYSIS_HISTORY

    total = len(filtered)
    if total == 0:
        return {
            "total": 0,
            "average_quality": None,
            "pass_rate": None,
            "grade_distribution": {"A": 0, "B": 0, "C": 0},
            "ripeness_distribution": {"under": 0, "ideal": 0, "over": 0},
            "from": from_date,
            "to": to_date,
        }

    qualities = [item["quality_score"] for item in filtered]
    grades = [item["grade"] for item in filtered]

    grade_distribution = {"A": 0, "B": 0, "C": 0}
    ripeness_distribution = {"under": 0, "ideal": 0, "over": 0}

    for item in filtered:
        g = item["grade"]
        if g in grade_distribution:
            grade_distribution[g] += 1
        r = item["ripeness_score"]
        if r < 80:
            ripeness_distribution["under"] += 1
        elif r <= 95:
            ripeness_distribution["ideal"] += 1
        else:
            ripeness_distribution["over"] += 1

    average_quality = sum(qualities) / len(qualities)
    passes = sum(1 for g in grades if g in ("A", "B"))
    pass_rate = passes / len(grades) * 100

    return {
        "total": total,
        "average_quality": average_quality,
        "pass_rate": pass_rate,
        "grade_distribution": grade_distribution,
        "ripeness_distribution": ripeness_distribution,
        "from": from_date,
        "to": to_date,
    }
