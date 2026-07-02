param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,

  [string]$OpenAIModel = "gpt-5.4-mini"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$supabase = ".\.tools\supabase\supabase.exe"
if (!(Test-Path $supabase)) {
  throw "Supabase CLI not found at $supabase"
}

if ([string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) {
  throw "Set OPENAI_API_KEY in this shell first, e.g. `$env:OPENAI_API_KEY='sk-...'"
}

& $supabase link --project-ref $ProjectRef
& $supabase db push
& $supabase functions deploy analyze-meal
& $supabase functions deploy admin-api
& $supabase functions deploy billing-api
& $supabase functions deploy recommend-recipes

$secrets = @("OPENAI_API_KEY=$env:OPENAI_API_KEY", "OPENAI_MODEL=$OpenAIModel")
if (![string]::IsNullOrWhiteSpace($env:REVENUECAT_WEBHOOK_SECRET)) {
  $secrets += "REVENUECAT_WEBHOOK_SECRET=$env:REVENUECAT_WEBHOOK_SECRET"
}
& $supabase secrets set @secrets

Write-Host "supabase-deploy-ok"
