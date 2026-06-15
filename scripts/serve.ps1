$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$port = if ($args.Count -gt 0) { [int]$args[0] } else { 5173 }
Write-Host "Serving http://localhost:$port"
python -m http.server $port
