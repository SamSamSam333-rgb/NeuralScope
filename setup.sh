#!/usr/bin/env bash
# macOS / Linux setup. Windows users: use setup.bat
set -e
cd "$(dirname "$0")"
python3 -m venv backend/.venv
. backend/.venv/bin/activate
pip install --upgrade pip
pip install torch
pip install -r backend/requirements.txt
(cd frontend && npm install && npm run build)
echo "Done. Run ./run.sh"
