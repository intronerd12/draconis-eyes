param(
  [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

$py = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) {
  Write-Host "[dev_ai] Python venv not found at '$py'."
  Write-Host "[dev_ai] Create the venv at repo root and install backend requirements first."
  exit 1
}

if (-not $env:DRAGON_AUTO_TRAIN) { $env:DRAGON_AUTO_TRAIN = '1' }
if ($CheckOnly) { $env:DRAGON_AUTO_TRAIN = '0' }

Write-Host "[dev_ai] Checking ML requirements (ultralytics)..."
& $py -c "import ultralytics" *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev_ai] Installing ML requirements..."
  & $py -m pip install -r requirements-ml.txt
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$weights = Join-Path $PSScriptRoot 'ml_models\yolo_best.pt'
if (-not (Test-Path $weights)) {
  if ($env:DRAGON_AUTO_TRAIN -eq '1') {
    $epochs = 40
    if ($env:DRAGON_BOOTSTRAP_EPOCHS) {
      try { $epochs = [int]$env:DRAGON_BOOTSTRAP_EPOCHS } catch {}
    }
    Write-Host "[dev_ai] yolo_best.pt not found. Training from full dataset (epochs=$epochs)..."
    & $py train_full.py --device cpu --cache --cos-lr --epochs $epochs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host "[dev_ai] yolo_best.pt not found and DRAGON_AUTO_TRAIN=0. Scanning will fall back to heuristics."
  }
}

$env:DRAGON_YOLO_WEIGHTS = 'ml_models\yolo_best.pt'
$env:DRAGON_SELFTRAIN_ENABLED = '1'

if ($CheckOnly) {
  Write-Host "[dev_ai] CheckOnly complete."
  exit 0
}

Write-Host "[dev_ai] Starting AI service (FastAPI)..."
& $py -m uvicorn main:app --reload --port 8000
