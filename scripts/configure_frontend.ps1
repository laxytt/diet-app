param(
  [Parameter(Mandatory = $true)]
  [string]$SupabaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$SupabaseAnonKey,

  [string]$NativeRedirectUrl = "nouria://auth-callback",

  [string]$AIEndpoint = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

@"
window.DIET_APP_CONFIG = {
  supabaseUrl: '$SupabaseUrl',
  supabaseAnonKey: '$SupabaseAnonKey',
  nativeRedirectUrl: '$NativeRedirectUrl',
  aiEndpoint: '$AIEndpoint'
};
"@ | Set-Content -Path config.js -Encoding UTF8

Write-Host "config-js-written"
