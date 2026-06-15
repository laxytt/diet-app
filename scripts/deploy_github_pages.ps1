param(
  [Parameter(Mandatory = $true)]
  [string]$RepoName,

  [switch]$Private
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$gh = ".\.tools\gh\bin\gh.exe"
if (!(Test-Path $gh)) {
  throw "GitHub CLI not found at $gh"
}

& $gh auth status

if (!(Test-Path ".git")) {
  git init
  git branch -M main
}

git add index.html styles.css app.js config.js manifest.webmanifest sw.js icon.svg README.md supabase scripts .gitignore
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Prepare diet app deployment"
}

$visibility = if ($Private) { "--private" } else { "--public" }
if (!(git remote get-url origin 2>$null)) {
  & $gh repo create $RepoName $visibility --source . --remote origin --push
} else {
  git push -u origin main
}

$repoFullName = (& $gh repo view --json nameWithOwner --jq ".nameWithOwner").Trim()
$body = @{ source = @{ branch = "main"; path = "/" } } | ConvertTo-Json -Depth 4
$body | & $gh api --method POST "repos/$repoFullName/pages" --input -

Write-Host "github-pages-requested"
Write-Host "URL will appear in GitHub repo Settings -> Pages."
