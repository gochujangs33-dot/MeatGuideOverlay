# Installs MeatGuideOverlay on a USB-connected tablet and turns on the
# permissions staff would otherwise enable by hand in Android settings.
#
#   powershell -ExecutionPolicy Bypass -File scripts\install-tablet.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-tablet.ps1 -Serial R52N10ABCDE
param(
    [string]$Apk = (Join-Path (Split-Path -Parent $PSScriptRoot) "MeatGuideOverlay-latest-release.apk"),
    [string]$Serial = ""
)

$ErrorActionPreference = "Stop"
$package = "com.antigravity.meatguideoverlay"
$accessibilityService = "$package/$package.service.KioskErrorAccessibilityService"

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path -LiteralPath $adb)) { $adb = "adb" }

function Invoke-Adb {
    $deviceArgs = @()
    if ($Serial) { $deviceArgs = @("-s", $Serial) }
    $output = & $adb @deviceArgs @args 2>&1
    if ($LASTEXITCODE -ne 0) { throw "adb $($args -join ' ') 실패: $output" }
    return ($output | Out-String).Trim()
}

if (-not (Test-Path -LiteralPath $Apk)) { throw "APK 파일이 없습니다: $Apk" }

Write-Output "1/5 앱 설치: $Apk"
Invoke-Adb install -r $Apk | Out-Null

Write-Output "2/5 다른 앱 위에 표시 권한 허용"
Invoke-Adb shell appops set $package SYSTEM_ALERT_WINDOW allow | Out-Null

Write-Output "3/5 접근성 오류 감지 서비스 켜기"
$enabled = Invoke-Adb shell settings get secure enabled_accessibility_services
if (-not $enabled -or $enabled -eq "null") {
    $enabled = $accessibilityService
} elseif ($enabled -notlike "*$accessibilityService*") {
    $enabled = "${enabled}:$accessibilityService"
}
Invoke-Adb shell settings put secure enabled_accessibility_services $enabled | Out-Null
Invoke-Adb shell settings put secure accessibility_enabled 1 | Out-Null

Write-Output "4/5 시스템 설정 변경(영업 중 화면 켜짐 유지) 허용"
Invoke-Adb shell appops set $package WRITE_SETTINGS allow | Out-Null

Write-Output "5/5 배터리 최적화 예외 등록(자동 실행 유지)"
Invoke-Adb shell dumpsys deviceidle whitelist "+$package" | Out-Null

Write-Output ""
Write-Output "확인 결과"
Write-Output ("  다른 앱 위에 표시: " + (Invoke-Adb shell appops get $package SYSTEM_ALERT_WINDOW))
Write-Output ("  시스템 설정 변경:   " + (Invoke-Adb shell appops get $package WRITE_SETTINGS))
$services = Invoke-Adb shell settings get secure enabled_accessibility_services
$accessibilityOn = $services -like "*$accessibilityService*"
Write-Output ("  접근성 서비스:     " + $(if ($accessibilityOn) { "켜짐" } else { "꺼짐 - 설정에서 직접 켜 주세요" }))
Write-Output ""
Write-Output "태블릿에서 앱을 실행해 설정 마법사의 키오스크 앱(erum 이오더)과 태블릿 이름을 저장하면 완료됩니다."
