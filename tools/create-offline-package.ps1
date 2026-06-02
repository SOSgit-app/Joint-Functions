# Zip for coworkers on locked-down machines (no Node.js).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "jnt601b-content-editor-OFFLINE.zip"

$files = @(
  (Join-Path $PSScriptRoot "Scenario-Content-Editor-OFFLINE.html"),
  (Join-Path $PSScriptRoot "README-OFFLINE.txt")
)

if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path $files -DestinationPath $out

Write-Host "Created: $out"
Write-Host ""
Write-Host "Also email your handoff JSON (Export handoff from the editor)."
