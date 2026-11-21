import io, math, random
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app

c = TestClient(app)

def moons(n=120, seed=1):
    r = random.Random(seed); X, Y = [], []
    for i in range(n):
        t = r.random() * math.pi; k = i % 2
        x = math.cos(t) + (1 if k else 0) - 0.5 + r.gauss(0, .08)
        y = (math.sin(t) if not k else -math.sin(t)) + (0 if not k else .25) + r.gauss(0, .08)
        X.append([x, y]); Y.append(k)
    return X, Y

def payload(**cfg):
    X, Y = moons()
    base = dict(layers=2, width=8, act="tanh", opt="adam", loss="bce", lr=0.03, batch=16, l2=0, epochs=60, seed=3)
    base.update(cfg)
    return dict(cfg=base, Xtr=X[:90], Ytr=Y[:90], Xva=X[90:], Yva=Y[90:], grid=16, lim=1.6)

def test_health():
    j = c.get("/api/health").json()
    assert j["status"] == "ok" and j["torch"]

def test_train_learns():
    j = c.post("/api/train", json=payload()).json()
    assert len(j["tl"]) == 60 and len(j["map"]) == 256
    assert j["tl"][-1] < j["tl"][0]
    assert j["ta"][-1] > 0.85
    assert j["params"] == 2*8+8 + 8*8+8 + 8+1
    assert all(0 <= v <= 1 for v in j["map"])

@pytest.mark.parametrize("opt", ["sgd", "momentum", "adam"])
@pytest.mark.parametrize("loss", ["bce", "mse"])
def test_all_optimisers_losses(opt, loss):
    j = c.post("/api/train", json=payload(opt=opt, loss=loss, epochs=5)).json()
    assert all(math.isfinite(v) for v in j["tl"])

def test_deterministic():
    a = c.post("/api/train", json=payload(epochs=10)).json()
    b = c.post("/api/train", json=payload(epochs=10)).json()
    assert a["tl"] == b["tl"]

def test_validation_errors():
    p = payload(); p["Ytr"] = p["Ytr"][:-1]
    assert c.post("/api/train", json=p).status_code == 422
    assert c.post("/api/train", json=payload(layers=0)).status_code == 422

def test_sklearn():
    X, Y = moons()
    body = dict(Xtr=X[:90], Ytr=Y[:90], Xva=X[90:], Yva=Y[90:], k=5, depth=4)
    assert c.post("/api/sklearn/knn", json=body).json()["val_acc"] > 0.8
    t = c.post("/api/sklearn/tree", json=body).json(); assert t["depth"] <= 4
    k = c.post("/api/sklearn/kmeans", json=dict(body, k=2)).json(); assert len(k["centers"]) == 2

def img(fmt="PNG"):
    b = io.BytesIO(); Image.new("RGB", (64, 64), "gray").save(b, fmt); return b.getvalue()

def test_yolo_bad_inputs():
    assert c.post("/api/yolo/detect", files={"file": ("a.png", b"notimage")}).status_code == 400
    assert c.post("/api/yolo/detect", files={"file": ("a.png", img())}, data={"model": "evil"}).status_code == 400
    assert c.post("/api/yolo/detect", files={"file": ("a.png", img())}, data={"conf": "5"}).status_code == 400

def test_yolo_real():
    r = c.post("/api/yolo/detect", files={"file": ("a.png", img())}, data={"conf": "0.25"})
    assert r.status_code == 200, r.text
    j = r.json(); assert j["width"] == 64 and isinstance(j["detections"], list)


def test_model_list_and_untrained_letters():
    ids = [m["id"] for m in c.get("/api/yolo/models").json()]
    assert "yolov8n" in ids and "yolov8n-oiv7" in ids
    if not __import__("os").path.exists("weights/letters.pt"):
        assert "letters" not in ids
        r = c.post("/api/yolo/detect", files={"file": ("a.png", img())}, data={"model": "letters"})
        assert r.status_code == 400


def test_yolo_600_class_model():
    r = c.post("/api/yolo/detect", files={"file": ("a.png", img())}, data={"model": "yolov8n-oiv7", "conf": "0.25"})
    assert r.status_code == 200, r.text
