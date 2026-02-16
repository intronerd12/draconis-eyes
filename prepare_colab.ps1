# Prepare for Colab Training
$zipName = "colab_upload.zip"
$exclude = @("node_modules", "venv", "__pycache__", ".git", "ml_models")

Write-Host "Compressing files for Google Colab..."

# Create a temporary directory to organize files
$tempDir = "colab_temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy Backend (excluding heavy/unnecessary folders)
$backendDest = "$tempDir\backend"
New-Item -ItemType Directory -Path $backendDest | Out-Null
Get-ChildItem "backend" -Exclude $exclude | Copy-Item -Destination $backendDest -Recurse

# Copy Datasets
Copy-Item -Path "Dragon Fruit Vignan.v2i.yolov8" -Destination $tempDir -Recurse
Copy-Item -Path "Dragon Fruit Vignan.v2i.yolov11" -Destination $tempDir -Recurse

# Create Zip
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host "Done! Upload '$zipName' to your Google Colab session."
