import os
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image


@dataclass
class Detection:
  x0: int
  y0: int
  x1: int
  y1: int
  conf: float
  cls: int
  name: str | None


def _try_import_ultralytics():
  try:
    from ultralytics import YOLO
    return YOLO
  except Exception:
    return None


def _resolve_path(path_value: str | None, base_dir: str) -> str | None:
  if not path_value:
    return None
  raw = str(path_value).strip()
  if not raw:
    return None
  if os.path.exists(raw):
    return os.path.abspath(raw)
  rel = os.path.join(base_dir, raw)
  if os.path.exists(rel):
    return os.path.abspath(rel)
  return None


def _weights_path(model: str | None = None) -> str | None:
  here = os.path.dirname(__file__)
  key = (model or "best").strip().lower()

  if key in ("best", "default", "main"):
    local_best = _resolve_path(os.path.join("ml_models", "yolo_best.pt"), here)
    if local_best:
      return local_best
    env_best = _resolve_path(os.environ.get("DRAGON_YOLO_BEST_WEIGHTS"), here)
    if env_best:
      return env_best
    env_default = _resolve_path(os.environ.get("DRAGON_YOLO_WEIGHTS"), here)
    if env_default:
      return env_default
    local_last = _resolve_path(os.path.join("ml_models", "yolo_last.pt"), here)
    if local_last:
      return local_last
    return None

  if key in ("bad", "disease", "defect"):
    local_bad = _resolve_path(os.path.join("ml_models", "yolo_bad.pt"), here)
    if local_bad:
      return local_bad
    env_bad = _resolve_path(os.environ.get("DRAGON_YOLO_BAD_WEIGHTS"), here)
    if env_bad:
      return env_bad
    return None

  custom = _resolve_path(key, here)
  if custom:
    return custom
  return None


class YoloRuntime:
  def __init__(self, weights_path: str):
    YOLO = _try_import_ultralytics()
    if YOLO is None:
      raise RuntimeError("Ultralytics is not installed.")
    self.weights_path = os.path.abspath(weights_path)
    self._yolo = YOLO(self.weights_path)

  def predict(self, image: Image.Image, conf: float = 0.35) -> list[Detection]:
    im = image.convert("RGB")
    results = self._yolo.predict(source=im, conf=float(conf), verbose=False)
    if not results:
      return []

    r0 = results[0]
    names = getattr(r0, "names", None)
    boxes = getattr(r0, "boxes", None)
    if boxes is None:
      return []

    xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes.xyxy, "cpu") else np.array(boxes.xyxy)
    confs = boxes.conf.cpu().numpy() if hasattr(boxes.conf, "cpu") else np.array(boxes.conf)
    clss = boxes.cls.cpu().numpy() if hasattr(boxes.cls, "cpu") else np.array(boxes.cls)

    dets: list[Detection] = []
    for i in range(xyxy.shape[0]):
      x0, y0, x1, y1 = [int(round(v)) for v in xyxy[i].tolist()]
      c = float(confs[i])
      k = int(clss[i])
      name = None
      if isinstance(names, dict) and k in names:
        name = str(names[k])
      dets.append(Detection(x0=x0, y0=y0, x1=x1, y1=y1, conf=c, cls=k, name=name))
    return dets


_RUNTIMES: dict[str, YoloRuntime] = {}


def get_yolo_runtime(model: str | None = None) -> YoloRuntime | None:
  w = _weights_path(model)
  if not w:
    return None
  if w in _RUNTIMES:
    return _RUNTIMES[w]

  try:
    runtime = YoloRuntime(w)
    _RUNTIMES[w] = runtime
    return runtime
  except Exception:
    return None


def reset_yolo_runtime(model: str | None = None) -> None:
  global _RUNTIMES
  if model is None:
    _RUNTIMES = {}
    return

  w = _weights_path(model)
  if w and w in _RUNTIMES:
    _RUNTIMES.pop(w, None)


def detections_to_mask(detections: list[Detection], width: int, height: int) -> np.ndarray:
  mask = np.zeros((height, width), dtype=bool)
  for d in detections:
    x0 = max(0, min(int(d.x0), width - 1))
    x1 = max(0, min(int(d.x1), width - 1))
    y0 = max(0, min(int(d.y0), height - 1))
    y1 = max(0, min(int(d.y1), height - 1))
    if x1 <= x0 or y1 <= y0:
      continue
    mask[y0:y1, x0:x1] = True
  return mask
