param(
    [Parameter(Mandatory = $true)]
    [int]$VersionCode,
    [Parameter(Mandatory = $true)]
    [string]$VersionName,
    [Parameter(Mandatory = $true)]
    [string]$DownloadUrl,
    [string]$Notes = "기능 개선 및 안정성 업데이트"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$hostingUpdateDir = Join-Path $repoRoot "admin-web\dist\updates"
$publicUpdateDir = Join-Path $repoRoot "admin-web\public\updates"

New-Item -ItemType Directory -Force -Path $hostingUpdateDir | Out-Null
New-Item -ItemType Directory -Force -Path $publicUpdateDir | Out-Null

$apkPath = Join-Path $repoRoot "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path -LiteralPath $apkPath)) {
    throw "릴리즈 APK가 없습니다. 먼저 :app:assembleRelease를 실행해 주세요."
}

# Copy APK into public and dist updates directories as .bin to comply with Firebase Hosting Spark plan rules
Copy-Item -LiteralPath $apkPath -Destination (Join-Path $hostingUpdateDir "meatguide-overlay-$VersionCode.bin") -Force
Copy-Item -LiteralPath $apkPath -Destination (Join-Path $publicUpdateDir "meatguide-overlay-$VersionCode.bin") -Force

# Update root convenience APK
Copy-Item -LiteralPath $apkPath -Destination (Join-Path $repoRoot "MeatGuideOverlay-latest-release.apk") -Force

$sha256 = (Get-FileHash -LiteralPath $apkPath -Algorithm SHA256).Hash.ToLowerInvariant()
$releaseManifest = [ordered]@{
    versionCode = $VersionCode
    versionName = $VersionName
    downloadUrl = $DownloadUrl
    sha256 = $sha256
    notes = $Notes
}

$manifestPath = Join-Path $hostingUpdateDir "release.json"
$releaseManifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $publicUpdateDir "release.json") -Force

Write-Output "Prepared Firebase Hosting update manifest: $VersionName ($VersionCode)"
Write-Output "SHA256: $sha256"
Write-Output "Manifest: $manifestPath"
