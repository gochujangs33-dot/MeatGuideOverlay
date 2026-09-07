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

New-Item -ItemType Directory -Force -Path $hostingUpdateDir | Out-Null
$apkPath = Join-Path $repoRoot "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path -LiteralPath $apkPath)) {
    throw "릴리즈 APK가 없습니다. 먼저 :app:assembleRelease를 실행해 주세요."
}
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

Write-Output "Prepared Firebase Hosting update manifest: $VersionName ($VersionCode)"
Write-Output "Manifest: $manifestPath"
