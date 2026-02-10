param(
  [switch]$CheckOnly,
  [switch]$NoTrain
)

$ErrorActionPreference = 'Stop'

Set-Location -Path $PSScriptRoot

$py = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) {
  Write-Host "[dev_ai] Python venv not found at '$py'."
  Write-Host "[dev_ai] Create the venv at repo root and install backend requirements first."
  exit 1
}

if ($NoTrain -or $CheckOnly) {
  $env:DRAGON_AUTO_TRAIN = '0'
} else {
  $env:DRAGON_AUTO_TRAIN = '1'
}

Write-Host "[dev_ai] Checking ML requirements (ultralytics)..."
& $py -c "import ultralytics" *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev_ai] Installing ML requirements..."
  & $py -m pip install -r requirements-ml.txt
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$weights = Join-Path $PSScriptRoot 'ml_models\yolo_best.pt'
$env:DRAGON_YOLO_WEIGHTS = 'ml_models\yolo_best.pt'
$needsBootstrap = -not (Test-Path $weights)
if ($needsBootstrap) {
  if ($env:DRAGON_AUTO_TRAIN -eq '1') {
    $epochs = 40
    if ($env:DRAGON_BOOTSTRAP_EPOCHS) {
      try { $epochs = [int]$env:DRAGON_BOOTSTRAP_EPOCHS } catch {}
    }

    Write-Host "[dev_ai] yolo_best.pt not found. Starting bootstrap training in background (epochs=$epochs)..."
    $env:DRAGON_MODEL_BOOTSTRAP = '1'

    $token = $env:DRAGON_ADMIN_TOKEN
    Start-Job -ScriptBlock {
      param($repoDir, $pyPath, $epochsArg, $adminToken)
      Set-Location -Path $repoDir
      & $pyPath train_full.py --device cpu --cache --cos-lr --epochs $epochsArg
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

      for ($i = 0; $i -lt 60; $i++) {
        try {
          $h = Invoke-RestMethod -Method GET -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
          if ($h -and $h.status -eq 'healthy') { break }
        } catch {}
        Start-Sleep -Seconds 2
      }

      $headers = @{}
      if ($adminToken) { $headers['X-Admin-Token'] = $adminToken }
      try {
        Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:8000/admin/reload-yolo" -Headers $headers -TimeoutSec 5 | Out-Null
      } catch {}
    } -ArgumentList $PSScriptRoot, $py, $epochs, $token | Out-Null
  } else {
    Write-Host "[dev_ai] yolo_best.pt not found and DRAGON_AUTO_TRAIN=0. Scanning will fall back to heuristics."
  }
}

$env:DRAGON_SELFTRAIN_ENABLED = '1'

if ($CheckOnly) {
  Write-Host "[dev_ai] CheckOnly complete."
  exit 0
}

Write-Host "[dev_ai] Starting AI service (FastAPI)..."
& $py -m uvicorn main:app --reload --port 8000
