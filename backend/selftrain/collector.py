import json
import os
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def compute_image_quality(rgb: np.ndarray) -> dict[str, float]:
    """Cheap, robust image quality features.

    rgb: uint8 HxWx3
    """
    if rgb.ndim != 3 or rgb.shape[-1] != 3:
        return {"brightness": 0.0, "contrast": 0.0, "blur": 0.0, "saturation": 0.0}

    arr = rgb.astype(np.float32)
    gray = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]).astype(np.float32)
    brightness = float(np.mean(gray) / 255.0)
    contrast = float(np.std(gray) / 255.0)

    # Saturation (approx): average channel distance to gray.
    sat = np.mean(np.abs(arr - gray[..., None])) / 255.0
    saturation = float(sat)

    # Blur: variance of Laplacian; fall back to finite-difference approximation if cv2 missing.
    blur = 0.0
    try:
        import cv2  # type: ignore

        lap = cv2.Laplacian(gray, cv2.CV_32F)
        blur = float(lap.var())
    except Exception:
        # Approx Laplacian via second differences.
        g = gray
        dx2 = g[:, 2:] - 2 * g[:, 1:-1] + g[:, :-2]
        dy2 = g[2:, :] - 2 * g[1:-1, :] + g[:-2, :]
        blur = float(np.var(dx2) + np.var(dy2))

    return {
        "brightness": float(round(brightness, 6)),
        "contrast": float(round(contrast, 6)),
        "blur": float(round(blur, 6)),
        "saturation": float(round(saturation, 6)),
    }


def should_collect_sample(
    *,
    yolo_detections: list[Any],
    relevance_ratio: float,
    quality: dict[str, float] | None,
    min_relevance: float = 0.08,
    conf_low: float = 0.35,
    conf_high: float = 0.60,
    min_blur: float = 25.0,
) -> tuple[bool, list[str]]:
    """Active-learning policy.

    Collect samples that are likely informative:
    - YOLO has a detection but is unsure (conf in [conf_low, conf_high])
    - YOLO has no detections but the image *looks* fruit-like (relevance_ratio >= min_relevance)
    - Image is not too blurry (min_blur)
    """
    reasons: list[str] = []
    det_confs = [float(d.get("conf", 0.0)) for d in (yolo_detections or []) if isinstance(d, dict)]
    best_conf = max(det_confs) if det_confs else 0.0

    if det_confs and conf_low <= best_conf <= conf_high:
        reasons.append("yolo_uncertain")
    if (not det_confs) and float(relevance_ratio) >= float(min_relevance):
        reasons.append("no_yolo_but_color_relevant")

    if quality and float(quality.get("blur", 0.0)) < float(min_blur):
        reasons.append("too_blurry")

    # Gate: must have at least one positive reason and not be rejected for blur.
    positive = any(r in ("yolo_uncertain", "no_yolo_but_color_relevant") for r in reasons)
    rejected = "too_blurry" in reasons
    return (bool(positive and not rejected), reasons)


def save_training_sample(
    *,
    image_bytes: bytes,
    ext: str,
    out_root: Path,
    metadata: dict[str, Any],
    queue_jsonl: Path,
) -> dict[str, Any]:
    """Persist image + metadata into a lightweight queue for later labeling/pseudo-labeling."""
    _ensure_dir(out_root)
    _ensure_dir(queue_jsonl.parent)

    safe_ext = (ext or "jpg").lower()
    if safe_ext not in ("jpg", "jpeg", "png", "webp"):
        safe_ext = "jpg"

    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_dir = out_root / "auto" / day
    _ensure_dir(out_dir)

    sample_id = str(uuid.uuid4())
    img_path = out_dir / f"{sample_id}.{safe_ext}"
    meta = {
        "id": sample_id,
        "timestamp": _utc_now_iso(),
        "image_path": str(img_path),
        **(metadata or {}),
    }

    with open(img_path, "wb") as f:
        f.write(image_bytes)

    with open(queue_jsonl, "a", encoding="utf-8") as f:
        f.write(json.dumps(meta, ensure_ascii=False) + "\n")

    return meta

