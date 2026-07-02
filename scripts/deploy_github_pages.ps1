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

git add .
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "Prepare diet app deployment"
}

$visibility = if ($Private) { "--private" } else { "--public" }
$remotes = @(git remote)
if ($remotes -notcontains "origin") {
  & $gh repo create $RepoName $visibility --source . --remote origin --push
} else {
  git push -u origin main
}

$repoFullName = (& $gh repo view --json nameWithOwner --jq ".nameWithOwner").Trim()
try {
  $body = @{ build_type = "workflow" } | ConvertTo-Json -Depth 4
  $body | & $gh api --method PUT "repos/$repoFullName/pages" --input -
} catch {
  Write-Warning "Could not switch Pages to GitHub Actions automatically. In GitHub Settings -> Pages choose Source: GitHub Actions."
}

Write-Host "github-pages-requested"
Write-Host "GitHub Actions will build dist/ and publish it to Pages."
