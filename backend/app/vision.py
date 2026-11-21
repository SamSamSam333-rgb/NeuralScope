"""Real object detection with Ultralytics YOLO."""
from __future__ import annotations

import io
import os
import threading
import time
from typing import Any, Dict, List

from PIL import Image

# name -> (weights file, label shown in the app, what it can recognise)
CATALOG = {
    "yolov8n": ("yolov8n.pt", "YOLOv8 nano: 80 everyday objects (fastest)", 80),
    "yolov8s": ("yolov8s.pt", "YOLOv8 small: 80 everyday objects", 80),
    "yolov8m": ("yolov8m.pt", "YOLOv8 medium: 80 everyday objects (most accurate)", 80),
    "yolov8n-oiv7": ("yolov8n-oiv7.pt", "Open Images nano: 600 object types (fast)", 601),
    "yolov8s-oiv7": ("yolov8s-oiv7.pt", "Open Images small: 600 object types", 601),
    "yolov8m-oiv7": ("yolov8m-oiv7.pt", "Open Images medium: 600 object types (most accurate)", 601),
    "letters": ("letters.pt", "Letters and digits (trained on your PC)", 62),
}
COMBO = "everything"  # 600 object types + letters and digits, results merged
ALLOWED = {k: v[0] for k, v in CATALOG.items()}
MAX_PIXELS = 25_000_000
_models: Dict[str, Any] = {}
_lock = threading.Lock()
WEIGHTS_DIR = os.environ.get("NEURALSCOPE_WEIGHTS", os.path.join(os.path.dirname(__file__), "..", "weights"))


def _device() -> str:
    import torch
    return "cuda:0" if torch.cuda.is_available() else "cpu"


def get_model(name: str):
    if name not in ALLOWED:
        raise KeyError(name)
    with _lock:
        if name not in _models:
            from ultralytics import YOLO  # imported lazily: it is slow and optional
            os.makedirs(WEIGHTS_DIR, exist_ok=True)
            path = os.path.join(WEIGHTS_DIR, ALLOWED[name])
            _models[name] = YOLO(path if os.path.exists(path) else ALLOWED[name])
            if not os.path.exists(path) and os.path.exists(ALLOWED[name]):  # first run downloads into cwd; keep it in weights/
                os.replace(ALLOWED[name], path)
        return _models[name]


def available() -> List[Dict[str, Any]]:
    """Models the app can offer. Custom ones appear only after you have trained them."""
    out = [{"id": k, "label": v[1], "classes": v[2]} for k, v in CATALOG.items() if k != "letters"]
    if os.path.exists(os.path.join(WEIGHTS_DIR, "letters.pt")):
        out.append({"id": "letters", "label": CATALOG["letters"][1], "classes": 62})
        out.append({"id": COMBO, "label": "Everything: 600 objects + letters and digits", "classes": 663})
    return out


def _run(m, img, conf: float, iou: float) -> List[Dict[str, Any]]:
    res = m.predict(img, conf=conf, iou=iou, device=_device(), verbose=False)[0]
    dets = []
    for b in res.boxes:
        x1, y1, x2, y2 = [float(v) for v in b.xyxy[0].tolist()]
        c = int(b.cls[0])
        dets.append({"cls": c, "name": res.names[c], "conf": float(b.conf[0]), "box": [x1, y1, x2, y2]})
    return dets


def detect(data: bytes, model: str, conf: float, iou: float) -> Dict[str, Any]:
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception as e:  # any decode failure means "not a usable image"
        raise ValueError("That file is not a readable image") from e
    if img.width * img.height > MAX_PIXELS:
        raise ValueError("Image is too large (over 25 megapixels)")
    img = img.convert("RGB")
    names = ["yolov8s-oiv7", "letters"] if model == COMBO else [model]
    for n in names:
        if n == "letters" and not os.path.exists(os.path.join(WEIGHTS_DIR, "letters.pt")):
            raise ValueError("Letters model not trained yet. Run train-letters.bat first.")
    t0 = time.perf_counter()
    dets: List[Dict[str, Any]] = []
    for n in names:
        dets += _run(get_model(n), img, conf, iou)
    ms = (time.perf_counter() - t0) * 1000.0
    dets.sort(key=lambda d: -d["conf"])
    return {"width": img.width, "height": img.height, "detections": dets, "ms": ms, "device": _device(),
            "model": model, "conf": conf, "iou": iou}
