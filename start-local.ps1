# Start local HTTP server for JNT601B course testing
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required. Install from https://nodejs.org/ then run this script again."
}

Write-Host ""
Write-Host "  Editor:        http://localhost:3000/tools/content-editor/"
Write-Host ""
Write-Host "Starting server (Ctrl+C to stop)..."
Write-Host ""

node server.js
