$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

python -m json.tool manifest.webmanifest | Out-Null

@'
from html.parser import HTMLParser
from pathlib import Path

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "link"):
            ref = attrs.get("src") or attrs.get("href")
            if ref and not ref.startswith(("http://", "https://", "data:")):
                self.refs.append(ref)

parser = Parser()
parser.feed(Path("index.html").read_text(encoding="utf-8"))
missing = [ref for ref in parser.refs if not Path(ref).exists()]
if missing:
    raise SystemExit("Missing local references: " + ", ".join(missing))
print("html-local-refs-ok")
'@ | python -

if (Test-Path ".\.tools\deno\deno.exe") {
  .\.tools\deno\deno.exe check supabase\functions\analyze-meal\index.ts
} else {
  Write-Warning "Deno portable not found; skipping Edge Function check."
}

Write-Host "checks-ok"
