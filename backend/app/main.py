"""NeuralScope API: real PyTorch training, scikit-learn references and YOLO detection."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import ml, train as trainer, vision
from .schemas import MLRequest, MLResponse, TrainRequest, TrainResponse

app = FastAPI(title="NeuralScope API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])
MAX_UPLOAD = 15 * 1024 * 1024


@app.get("/api/health")
def health() -> dict:
    import sklearn
    import torch
    try:
        import ultralytics
        uv = ultralytics.__version__
    except Exception:  # optional dependency
        uv = None
    cuda = torch.cuda.is_available()
    return {"status": "ok", "torch": torch.__version__, "cuda": cuda,
            "gpu": torch.cuda.get_device_name(0) if cuda else None,
            "sklearn": sklearn.__version__, "ultralytics": uv, "yolo_models": [x["id"] for x in vision.available()]}


@app.post("/api/train", response_model=TrainResponse)
def train_endpoint(req: TrainRequest) -> TrainResponse:
    return trainer.train(req)


@app.post("/api/sklearn/knn", response_model=MLResponse)
def knn_endpoint(req: MLRequest) -> MLResponse:
    return ml.knn(req)


@app.post("/api/sklearn/tree", response_model=MLResponse)
def tree_endpoint(req: MLRequest) -> MLResponse:
    return ml.tree(req)


@app.post("/api/sklearn/kmeans", response_model=MLResponse)
def kmeans_endpoint(req: MLRequest) -> MLResponse:
    return ml.kmeans(req)


@app.get("/api/yolo/models")
def yolo_models() -> list:
    return vision.available()


@app.post("/api/yolo/detect")
async def yolo_detect(file: UploadFile = File(...), model: str = Form("yolov8n"),
                      conf: float = Form(0.05), iou: float = Form(0.7)) -> dict:
    ids = [x["id"] for x in vision.available()]
    if model not in ids:
        raise HTTPException(400, f"Unknown or untrained model. Choose one of: {', '.join(ids)}")
    if not (0.0 < conf <= 1.0) or not (0.0 < iou <= 1.0):
        raise HTTPException(400, "conf and iou must be between 0 and 1")
    data = await file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "Image is larger than 15 MB")
    try:
        return vision.detect(data, model, conf, iou)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except ImportError:
        raise HTTPException(503, "Ultralytics is not installed on the server")
    except Exception as e:  # weights could not be downloaded, etc.
        raise HTTPException(503, f"Detection failed: {e}")


# In production the built frontend is served by the same process (npm run build, then start the API).
DIST = Path(os.environ.get("NEURALSCOPE_DIST", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")
    for sub in ("legacy", "vendor"):
        if (DIST / sub).exists():
            app.mount(f"/{sub}", StaticFiles(directory=DIST / sub, html=True), name=sub)

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        f = (DIST / path).resolve()
        if path and DIST in f.parents and f.is_file():
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
