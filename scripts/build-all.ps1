# MeatGuideOverlay Full Build Automation Script (PowerShell)
$ErrorActionPreference = "Stop"

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $rootDir "dist"

Write-Host "====================================================="
Write-Host " Starting MeatGuideOverlay Full Build Process"
Write-Host " Root: $rootDir"
Write-Host " Dist: $distDir"
Write-Host "====================================================="

# 1. Ensure dist directory exists
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

# 2. Ensure Keystore exists
Write-Host "`n[1/5] Checking Release Keystore..."
$generateKeystoreScript = Join-Path $rootDir "scripts\generate-keystore.ps1"
powershell.exe -ExecutionPolicy Bypass -File $generateKeystoreScript

# 3. Build Android APKs
Write-Host "`n[2/5] Building Android APKs (App Release, App Debug, Test-Kiosk Debug)..."
$androidDir = Join-Path $rootDir "android"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

Push-Location $androidDir
try {
    .\gradlew.bat clean :app:assembleRelease :app:assembleDebug :test-kiosk:assembleDebug --stacktrace
} finally {
    Pop-Location
}

# 4. Copy APKs to dist/
Write-Host "`n[3/5] Copying APKs to dist/..."
$appReleaseApk = Join-Path $rootDir "android\app\build\outputs\apk\release\app-release.apk"
$appDebugApk = Join-Path $rootDir "android\app\build\outputs\apk\debug\app-debug.apk"
$kioskDebugApk = Join-Path $rootDir "android\test-kiosk\build\outputs\apk\debug\test-kiosk-debug.apk"

if (Test-Path $appReleaseApk) {
    Copy-Item -Path $appReleaseApk -Destination (Join-Path $distDir "MeatGuideOverlay-release.apk") -Force
    Write-Host "  -> MeatGuideOverlay-release.apk copied"
} else {
    Write-Warning "App release APK not found at $appReleaseApk"
}

if (Test-Path $appDebugApk) {
    Copy-Item -Path $appDebugApk -Destination (Join-Path $distDir "MeatGuideOverlay-debug.apk") -Force
    Write-Host "  -> MeatGuideOverlay-debug.apk copied"
}

if (Test-Path $kioskDebugApk) {
    Copy-Item -Path $kioskDebugApk -Destination (Join-Path $distDir "TestKiosk-debug.apk") -Force
    Write-Host "  -> TestKiosk-debug.apk copied"
}

# 5. Build Admin Web Console
Write-Host "`n[4/5] Building Admin Web Console..."
$webDir = Join-Path $rootDir "admin-web"
Push-Location $webDir
try {
    cmd.exe /c "npm run build"
} finally {
    Pop-Location
}

# 6. Package admin-web dist into zip
Write-Host "`n[5/5] Packaging Admin Web bundle to dist/admin-web-build.zip..."
$webDistDir = Join-Path $webDir "dist"
$webZipPath = Join-Path $distDir "admin-web-build.zip"
if (Test-Path $webDistDir) {
    if (Test-Path $webZipPath) { Remove-Item -Path $webZipPath -Force }
    Compress-Archive -Path "$webDistDir\*" -DestinationPath $webZipPath -Force
    Write-Host "  -> admin-web-build.zip created"
}

Write-Host "`n====================================================="
Write-Host " BUILD COMPLETED SUCCESSFULLY!"
Write-Host " Output Files in ${distDir}:"
Get-ChildItem -Path $distDir | ForEach-Object { Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" }
Write-Host "====================================================="
