# Creates a zip your coworker can use to run the content editor only.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "jnt601b-content-editor-package.zip"
$staging = Join-Path $env:TEMP ("jnt601b-editor-" + [guid]::NewGuid().ToString())

New-Item -ItemType Directory -Path $staging | Out-Null
Copy-Item (Join-Path $root "server.js") $staging
New-Item -ItemType Directory -Path (Join-Path $staging "tools") | Out-Null
Copy-Item (Join-Path $root "tools\scenario-io.js") (Join-Path $staging "tools\")
Copy-Item (Join-Path $root "tools\CONTENT-EDITOR-HANDOFF.md") (Join-Path $staging "tools\")
Copy-Item (Join-Path $root "tools\content-editor") (Join-Path $staging "tools\content-editor") -Recurse

if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $out
Remove-Item $staging -Recurse -Force

Write-Host "Created: $out"
Write-Host "Also export a handoff JSON from the editor and include it in the email."
Write-Host ""
Write-Host "For gov machines without Node.js, run instead:"
Write-Host "  .\tools\create-offline-package.ps1"
