"""Fine-tunes YOLOv8 to detect letters and digits, then saves backend/weights/letters.pt.

Usage (from the backend folder, with the virtual environment active):
    python tools/train_letters.py --n 6000 --epochs 40
The NVIDIA GPU is used automatically when PyTorch can see it.
"""
import argparse
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=6000, help="images to generate")
    ap.add_argument("--epochs", type=int, default=40)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--base", default="yolov8n.pt", help="starting weights (yolov8n.pt is fastest, yolov8s.pt more accurate)")
    ap.add_argument("--device", default=None)
    ap.add_argument("--skip-data", action="store_true", help="reuse the dataset already on disk")
    a = ap.parse_args()

    ds = os.path.join(BACKEND, "datasets", "letters")
    if not a.skip_data or not os.path.exists(os.path.join(ds, "letters.yaml")):
        subprocess.check_call([sys.executable, os.path.join(HERE, "make_letters_dataset.py"), "--n", str(a.n), "--size", str(a.imgsz), "--out", ds])

    import torch
    from ultralytics import YOLO
    device = a.device if a.device is not None else (0 if torch.cuda.is_available() else "cpu")
    print("Training on:", "GPU " + torch.cuda.get_device_name(0) if device != "cpu" and torch.cuda.is_available() else "CPU (slow)")
    weights = os.path.join(BACKEND, "weights")
    os.makedirs(weights, exist_ok=True)
    base = os.path.join(weights, a.base)
    model = YOLO(base if os.path.exists(base) else a.base)
    runs = os.path.join(BACKEND, "runs")
    res = model.train(data=os.path.join(ds, "letters.yaml"), epochs=a.epochs, imgsz=a.imgsz, batch=a.batch, device=device,
                      project=runs, name="letters", exist_ok=True, workers=2, patience=15, plots=False, amp=device != "cpu")
    best = os.path.join(str(res.save_dir), "weights", "best.pt")
    shutil.copy(best, os.path.join(weights, "letters.pt"))
    print("\nDone. Saved", os.path.join(weights, "letters.pt"), "- restart run.bat and pick 'Letters and digits' in the Vision Lab.")


if __name__ == "__main__":
    main()
