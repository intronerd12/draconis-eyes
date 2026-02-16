@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set "PY=..\.\.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo [dev_ai] Python venv not found at "%PY%".
  echo [dev_ai] Create the venv at repo root and install backend requirements first.
  exit /b 1
)

if "%DRAGON_AUTO_TRAIN%"=="" set "DRAGON_AUTO_TRAIN=1"

echo [dev_ai] Checking ML requirements (ultralytics)...
"%PY%" -c "import ultralytics" >NUL 2>&1
if errorlevel 1 (
  echo [dev_ai] Installing ML requirements...
  "%PY%" -m pip install -r requirements-ml.txt
  if errorlevel 1 exit /b 1
)

if not exist "ml_models\yolo_best.pt" (
  if "%DRAGON_AUTO_TRAIN%"=="1" (
    echo [dev_ai] yolo_best.pt not found. Training from full dataset (this may take a while)...
    "%PY%" train_full.py --device cpu --cache --cos-lr
    if errorlevel 1 exit /b 1
  ) else (
    echo [dev_ai] yolo_best.pt not found and DRAGON_AUTO_TRAIN=0. Scanning will fall back to heuristics.
  )
)

set "DRAGON_YOLO_WEIGHTS=ml_models\yolo_best.pt"
set "DRAGON_SELFTRAIN_ENABLED=1"

echo [dev_ai] Starting AI service (FastAPI)...
"%PY%" -m uvicorn main:app --reload --port 8000

