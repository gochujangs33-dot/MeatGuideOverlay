# Automated Local Release Keystore Generator
$ErrorActionPreference = "Stop"

$signingDir = Join-Path $PSScriptRoot "..\local-signing"
if (-not (Test-Path $signingDir)) {
    New-Item -ItemType Directory -Path $signingDir -Force | Out-Null
}

$keystorePath = Join-Path $signingDir "meatguide-release.jks"
$privateInfoPath = Join-Path $signingDir "PRIVATE_SIGNING_INFO.txt"
$keystorePropertiesPath = Join-Path $PSScriptRoot "..\keystore.properties"

if (Test-Path $keystorePath) {
    Write-Host "Keystore already exists at $keystorePath"
    exit 0
}

# Generate strong random password (PKCS12 uses the same password for store & key)
$storePass = [System.Guid]::NewGuid().ToString("N") + "MeatGuide!9#"
$keyPass = $storePass
$alias = "meatguide"

# Find keytool
$keytoolPath = "keytool"
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) {
    $keytoolPath = "$env:JAVA_HOME\bin\keytool.exe"
} elseif (Test-Path "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe") {
    $keytoolPath = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
}

Write-Host "Generating release keystore using $keytoolPath..."

$keytoolArgs = @(
    "-genkeypair",
    "-v",
    "-keystore", $keystorePath,
    "-alias", $alias,
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-storepass", $storePass,
    "-keypass", $storePass,
    "-dname", "CN=MeatGuideOverlay, OU=StoreOps, O=Antigravity, L=Seoul, ST=Seoul, C=KR"
)

& $keytoolPath @keytoolArgs

# Save private credentials to local-signing/PRIVATE_SIGNING_INFO.txt
$privateInfo = @"
=============================================================================
MEATGUIDE OVERLAY RELEASE SIGNING CREDENTIALS
=============================================================================
WARNING: This file contains private production keystore credentials.
DO NOT COMMIT THIS FILE OR KEYSTORE TO VERSION CONTROL!
LOST KEY WARNING: If you lose this keystore file or password, you will not be
able to update the installed app on existing devices without reinstalling.

Created Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Keystore File: meatguide-release.jks
Key Alias: $alias
Store Password: $storePass
Key Password: $keyPass
=============================================================================
"@

Set-Content -Path $privateInfoPath -Value $privateInfo -Encoding UTF8

# Create root keystore.properties for Gradle build
$propContent = @"
storeFile=../local-signing/meatguide-release.jks
storePassword=$storePass
keyAlias=$alias
keyPassword=$keyPass
"@
Set-Content -Path $keystorePropertiesPath -Value $propContent -Encoding UTF8

Write-Host "Release keystore generated successfully!"
Write-Host "Keystore saved to: $keystorePath"
Write-Host "Private info saved to: $privateInfoPath"
