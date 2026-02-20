$source = "Own Dataset\not healthy dragon"
$target = "own_not_healthy_dragon_v2.zip"

if (!(Test-Path $source)) {
  throw "Source folder not found: $source"
}

Write-Host "Creating zip from '$source'..."
Compress-Archive -Path "$source\*" -DestinationPath $target -Force
Write-Host "Done: $target"
