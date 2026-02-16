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


def _weights_path() -> str | None:
  override = os.environ.get("DRAGON_YOLO_WEIGHTS")
  if override and os.path.exists(override):
    return override

  here = os.path.dirname(__file__)
  candidate = os.path.join(here, "ml_models", "yolo_best.pt")
  if os.path.exists(candidate):
    return candidate
  candidate = os.path.join(here, "ml_models", "yolo_last.pt")
  if os.path.exists(candidate):
    return candidate
  return None


class YoloRuntime:
  def __init__(self, weights_path: str):
    YOLO = _try_import_ultralytics()
    if YOLO is None:
      raise RuntimeError("Ultralytics is not installed.")
    self._yolo = YOLO(weights_path)

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


_RUNTIME: YoloRuntime | None = None


def get_yolo_runtime() -> YoloRuntime | None:
  global _RUNTIME
  if _RUNTIME is not None:
    return _RUNTIME

  w = _weights_path()
  if not w:
    return None

  try:
    _RUNTIME = YoloRuntime(w)
    return _RUNTIME
  except Exception:
    return None


def reset_yolo_runtime() -> None:
  global _RUNTIME
  _RUNTIME = None


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
