# NeuralScope

An interactive virtual laboratory for learning artificial intelligence, machine learning and deep learning. NeuralScope pairs a long-form course with hands-on labs where every number is computed for real: a 3D neural network you can click into, a training lab, a machine learning playground, and a real YOLO object detector. Every control, button and readout has a plain-language "?" explanation.

> "I read what a learning rate is. What does it actually do when I change it?"

| | |
|---|---|
| **Run it** | Local app: `setup.bat` once, then `run.bat`, then open http://localhost:8000 (steps below) |
| **API docs** | http://localhost:8000/docs while the app is running |
| **Author** | Sameehan Divekar (BSC24DS174, Div D) |
| **Stack** | React 18 + TypeScript + Vite + Three.js · FastAPI · PyTorch · scikit-learn · Ultralytics YOLOv8 |

## The problem

Most AI learning is passive: text, videos and static diagrams. Beginners also struggle to set up the professional tools. NeuralScope is designed around four failures:

| Failure | What NeuralScope does about it |
|---|---|
| Theory is separated from practice | Change a setting (learning rate, layers, optimizer, noise) and watch the result recompute live |
| Concepts stay abstract | A 3D network shows signals, weights and biases flowing; click any neuron to see its arithmetic |
| Tools feel out of reach | The same experiment can be re-run on real PyTorch, scikit-learn and YOLO with one button |
| Jargon blocks understanding | A "?" on every control explains what it is, what changing it does, and what to try; labs can be limited to what the learner has already studied |

Design rule: if something is simulated, the app says so on screen. Everything else is a real calculation.

## What is in it

| Part | What it is | Where the computation happens |
|---|---|---|
| **Learning Academy** | 37 long-form lessons with tap-to-define terms, visuals, practice, flashcards, notes, Ask | Browser |
| **3D Neural Network Explorer** | A real small network drawn in Three.js; click neurons, edit weights, fire a signal, train XOR | Browser (real math) |
| **Training Lab** | Backprop with SGD / Momentum / Adam, live boundary and loss curves, save-and-compare. **Run on Python (PyTorch)** button re-runs the same data and settings on PyTorch | Browser, or PyTorch on the server |
| **ML Playground** | KNN, K-Means, Decision Tree. **Check with scikit-learn** button compares with scikit-learn | Browser, or scikit-learn on the server |
| **Vision Lab** | **Real YOLOv8** detection on your own photos, plus a teaching lab on a drawn sample scene | YOLO: server. Concept lab: browser (simulated, labelled as such) |
| **Quizzes & Progress, Dashboard** | Scores, lesson progress, experiment log (stored in your browser) | Browser |

Every control, button and readout has a **?** that explains it in plain language. The **Show me** bar on each lab lets you show only what you have learnt, chosen topics, or everything.

Honesty rule: things labelled "simulated" are teaching sketches. Everything else is a real calculation.

## Windows: first-time setup

1. Install **Python 3.12** from python.org (tick "Add python.exe to PATH") and **Node.js LTS** from nodejs.org.
2. Unzip this folder somewhere (for example `C:\neuralscope`).
3. Double-click **setup.bat**. It creates a Python environment, installs PyTorch (NVIDIA CUDA build first, CPU build as fallback), installs the other packages, and builds the website. This takes a while the first time (PyTorch is a large download).
4. Double-click **run.bat**. Your browser opens at http://localhost:8000.

The coloured badge at the top shows whether the Python server is online and whether PyTorch is using your GPU. The browser labs work even when it is offline.

The first YOLO detection with a given model downloads its weights (YOLOv8 nano and the Open Images nano model are already included in `backend/weights`).

## Detecting more objects, and letters

A detector can only name what it was trained on, so the Vision Lab offers several models:

| Model | Knows |
|---|---|
| YOLOv8 n / s / m | 80 everyday objects (COCO) |
| Open Images n / s / m | about 600 object types (animals, fruit, clothing, instruments, vehicles...) |
| Letters and digits | A-Z, a-z, 0-9 (62 classes). **You train this once**: double-click `train-letters.bat` |
| Everything | the Open Images small model plus the letters model, results merged |

`train-letters.bat` generates 6000 synthetic images from the fonts installed on your computer (random fonts, sizes, colours, rotations, backgrounds, blur, noise, with exact boxes), then fine-tunes YOLOv8 nano on your GPU and saves `backend/weights/letters.pt`. Restart `run.bat` afterwards. To tune it, run `python tools/train_letters.py --n 10000 --epochs 60 --base yolov8s.pt` from `backend`.

Limits: no model detects "everything". Printed or typed letters work best; handwriting needs handwriting training data. Capital I, lowercase l and digit 1, and O, o and 0, look alike in many fonts and can be confused.

## Developing

- `dev.bat` starts the API with auto-reload and the Vite dev server (http://localhost:5173, proxies `/api` to port 8000).
- `cd frontend && npm run typecheck` type-checks the React code. `npm run build` makes the production build in `frontend/dist`.
- `cd backend && python -m pytest -q` runs the API tests (training, scikit-learn, YOLO, input validation).

## Layout

```
frontend/            React 18 + TypeScript + Vite
  src/App.tsx          shell: header, navigation, backend status
  src/lib/legacy.ts    loads and starts the lab modules
  src/components/      StatusBadge, VisionView (YOLO upload panel)
  public/legacy/       the lab modules (plain JS, one shared NS object) and the lesson content
  public/vendor/       three.js r128 (copied from node_modules at build time)
backend/             FastAPI
  app/train.py         PyTorch MLP training
  app/ml.py            scikit-learn KNN / K-Means / Decision Tree
  app/vision.py        Ultralytics YOLO
  tools/               make_letters_dataset.py, train_letters.py (custom letters model)
  tests/               pytest suite
```

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | versions, GPU availability |
| `POST /api/train` | train an MLP on the supplied train/validation split; returns curves, gradient size, decision map |
| `POST /api/sklearn/{knn,tree,kmeans}` | scikit-learn reference results |
| `POST /api/yolo/detect` | multipart image upload; returns boxes, classes, scores |

## What is not built yet

NLP / Generative AI lab, Data Science lab, Coding Studio, AI assistant, more ML algorithms, reinforcement learning, Model Zoo, and the unwritten Academy topics (Generative AI, Responsible AI, Building with AI, AI in Your Work). They are listed under "Coming next" in the app rather than faked.

## Known limits

- The lab modules are ported as-is: they are still plain JavaScript inside the React shell. Rewriting them as typed React components is a later step.
- Progress, notes and experiment history are stored in the browser's localStorage, per browser.
- The server is meant to run on your own computer (it listens on 127.0.0.1 only).
