<#
    Disposable production diagnostic. Answers one question the repo cannot:
    what the *server* actually puts on the wire, which is invisible from the
    build output. Compression, cache lifetimes and the negotiated protocol
    are all decided after `next build` has finished, so they can only be
    read from a live response.

    Everything here is a GET with the URL written out literally. That is
    deliberate: the first attempt at this ran as pasted variables in a
    PowerShell 5.1 console, the assignments were swallowed by the paste, and
    curl ran against an empty URL and reported a cheerful zero bytes.

    Labels are ASCII on purpose — the Windows console renders Georgian as
    question marks unless the code page is changed first, and a diagnostic
    that needs its own diagnostic is no use.

    Usage:  powershell -ExecutionPolicy Bypass -File scripts\check-headers.ps1
            powershell -ExecutionPolicy Bypass -File scripts\check-headers.ps1 -Base http://localhost:3000
#>

param(
    # Note the dots. PageSpeed renders the host as `react-testd-cloud` in its
    # own report slug, which reads as a hyphenated domain and is not one.
    [string]$Base = "https://react.testd.cloud",
    [string]$Path = "/ka"
)

$page = "$Base$Path"

if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
    Write-Host "curl.exe not found. Windows 10 1803+ ships it; otherwise install curl." -ForegroundColor Red
    exit 1
}

function Get-Size {
    param([string]$Url, [string]$Encoding)
    # -sS: quiet, but still surface connection errors instead of a silent 0.
    $out = curl.exe -sS -o NUL -w "%{size_download}" -H "Accept-Encoding: $Encoding" $Url 2>$null
    if ([string]::IsNullOrWhiteSpace($out)) { return -1 }
    return [int]$out
}

function Show-Bytes {
    param([int]$N)
    if ($N -lt 0) { return "  n/a" }
    if ($N -ge 1024) { return "{0,7:N0} KB" -f ($N / 1024) }
    return "{0,7:N0} B " -f $N
}

Write-Host ""
Write-Host "=== 1. Reachability =========================================" -ForegroundColor Cyan
curl.exe -sS -o NUL -w "  status=%{response_code}  http=%{http_version}  ip=%{remote_ip}  ttfb=%{time_starttransfer}s  total=%{time_total}s\n" $page
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Could not reach $page - nothing below will be meaningful." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 2. Document response headers ============================" -ForegroundColor Cyan
curl.exe -sS -o NUL -D - -H "Accept-Encoding: br, gzip" $page |
    Select-String -Pattern "^HTTP/|content-encoding|content-length|cache-control|^server|content-type|^vary" |
    ForEach-Object { "  " + $_.Line.Trim() }

Write-Host ""
Write-Host "=== 3. Is the HTML compressed? ==============================" -ForegroundColor Cyan
$rawDoc = Get-Size $page "identity"
$cmpDoc = Get-Size $page "br, gzip"
"  Accept-Encoding: identity   {0}" -f (Show-Bytes $rawDoc)
"  Accept-Encoding: br, gzip   {0}" -f (Show-Bytes $cmpDoc)
if ($rawDoc -gt 0 -and $cmpDoc -gt 0) {
    if ($cmpDoc -ge ($rawDoc * 0.9)) {
        Write-Host "  -> NOT COMPRESSED. This is the single biggest fix available." -ForegroundColor Red
    } else {
        $saved = [math]::Round((1 - ($cmpDoc / $rawDoc)) * 100)
        Write-Host ("  -> compressed, {0}% smaller. Good." -f $saved) -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== 4. Static chunks (CSS / JS) =============================" -ForegroundColor Cyan
# woff2 is skipped throughout: it is already compressed, and a proxy that
# gzips it again only wastes CPU for a rounding error.
$tmp = Join-Path $env:TEMP "dentv2-check.html"
curl.exe -sS -o $tmp $page 2>$null
if (-not (Test-Path $tmp)) {
    Write-Host "  Could not download the page body." -ForegroundColor Yellow
} else {
    $html = Get-Content $tmp -Raw
    $assets = [regex]::Matches($html, '/_next/static/[^"''\s]+\.(?:css|js)') |
        ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 5

    if (-not $assets) {
        Write-Host "  No /_next/static assets found in the HTML." -ForegroundColor Yellow
    }
    foreach ($a in $assets) {
        $url = "$Base$a"
        $raw = Get-Size $url "identity"
        $cmp = Get-Size $url "br, gzip"
        $encLine = curl.exe -sS -o NUL -D - -H "Accept-Encoding: br, gzip" $url 2>$null |
            Select-String -Pattern "content-encoding"
        $enc = if ($encLine) { ($encLine.Line -split ":")[1].Trim() } else { "NONE" }
        $name = $a.Substring($a.LastIndexOf("/") + 1)
        $colour = if ($enc -eq "NONE") { "Red" } else { "Green" }
        Write-Host ("  {0,-34} raw={1}  sent={2}  encoding={3}" -f $name, (Show-Bytes $raw), (Show-Bytes $cmp), $enc) -ForegroundColor $colour
    }
    Remove-Item $tmp -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== 5. Static media caching =================================" -ForegroundColor Cyan
# Next serves /public with `cache-control: public, max-age=0` by default,
# so every repeat visit re-downloads the hero poster and every photo.
foreach ($asset in @("/media/hero-poster.webp", "/brand/logo.svg")) {
    Write-Host "  $asset"
    curl.exe -sS -o NUL -D - "$Base$asset" 2>$null |
        Select-String -Pattern "^HTTP/|cache-control|content-length|etag|content-encoding" |
        ForEach-Object { "      " + $_.Line.Trim() }
}

Write-Host ""
Write-Host "=== 6. Is the hero poster preloaded? ========================" -ForegroundColor Cyan
# Only meaningful after the layout change has been built and deployed.
# Expect exactly 2 font preloads (the Georgian pair) and one image preload
# for the poster; /brand/logo.svg should no longer be preloaded at all.
$body = curl.exe -sS $page 2>$null
if ($body) {
    $fonts = ([regex]::Matches($body, 'rel="preload"[^>]*as="font"')).Count
    $poster = if ($body -match 'rel="preload"[^>]*hero-poster') { "yes" } else { "NO" }
    $logo = if ($body -match 'rel="preload"[^>]*logo\.svg') { "yes (should be no)" } else { "no" }
    "  font preloads in <head> : $fonts   (target: 2)"
    "  hero poster preloaded   : $poster (target: yes)"
    "  logo preloaded          : $logo"
}

Write-Host ""
