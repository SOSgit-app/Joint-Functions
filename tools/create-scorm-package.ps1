# Builds a SCORM 1.2 upload package (zip with imsmanifest.xml at the archive root).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "Joint Functions Activity.zip"
$staging = Join-Path $env:TEMP ("joint-functions-activity-scorm-" + [guid]::NewGuid().ToString("n"))

function Copy-Tree {
    param([string]$RelativePath)
    $src = Join-Path $root $RelativePath
    if (-not (Test-Path $src)) {
        Write-Warning "Skipping missing path: $RelativePath"
        return
    }
    $dest = Join-Path $staging $RelativePath
    $parent = Split-Path $dest -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -Path $src -Destination $dest -Recurse -Force
}

try {
    if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
    New-Item -ItemType Directory -Path $staging -Force | Out-Null

  # SCORM entry + schema files
    foreach ($file in @(
            "imsmanifest.xml",
            "index.html",
            "imscp_rootv1p1p2.xsd",
            "imsmd_rootv1p2p1.xsd",
            "adlcp_rootv1p2.xsd"
        )) {
        Copy-Item (Join-Path $root $file) (Join-Path $staging $file) -Force
    }

  # Course runtime (no dev server, editor, tests, or node_modules)
    foreach ($dir in @("content", "components", "scripts", "css", "client", "assets")) {
        Copy-Tree $dir
    }

  # Drop stale/minified duplicates not used by index.html
    $jf504Min = Join-Path $staging "content\jf504.min.js"
    if (Test-Path $jf504Min) { Remove-Item $jf504Min -Force }

    if (Test-Path $out) { Remove-Item $out -Force }
    Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $out -CompressionLevel Optimal

    $sizeMb = [math]::Round((Get-Item $out).Length / 1MB, 2)
    Write-Host ""
    Write-Host "SCORM package created:"
    Write-Host "  $out"
    Write-Host "  Size: $sizeMb MB"
    Write-Host ""
    Write-Host "Upload this zip to your LMS as a SCORM 1.2 package."
    Write-Host "Entry point: index.html (listed in imsmanifest.xml)"
    Write-Host ""
}
finally {
    if (Test-Path $staging) {
        Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
    }
}
