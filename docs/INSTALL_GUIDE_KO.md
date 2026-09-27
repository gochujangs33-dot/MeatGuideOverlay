# MeatGuideOverlay 설치 및 배포 가이드 (한국어)

## 1. 개요
`MeatGuideOverlay`(고기 부위 안내)는 기존 매장 키오스크 주문 앱을 수정하지 않고, 화면 위에 캐릭터와 말풍선을 띄워 고기 부위 안내 포스터와 키오스크 서버 연결 오류 안내를 제공하는 보조 앱입니다.

---

## 2. 설치 파일
* **최신 릴리즈 APK**: 프로젝트 루트의 `MeatGuideOverlay-latest-release.apk`
  (`scripts/publish-app-update.ps1` 실행 시 자동으로 갱신됩니다.)
* **가상 테스트 키오스크**: `android/test-kiosk`를 빌드한 debug APK (검증 및 시연용)

> [!WARNING]
> `dist/` 폴더의 APK는 2026-08-18에 빌드한 초기 버전(v1.0.0)입니다. 앱 내 업데이트 기능이 없는 버전이므로 설치하지 마세요.

이미 앱이 설치된 태블릿은 APK를 다시 설치할 필요 없이 직원용 관리 대시보드의 **[앱 업데이트 확인]**으로 업데이트합니다. ([태블릿 업데이트 안내](TABLET_UPDATE_GUIDE_KO.md) 참고)

---

## 3. 새 태블릿에 직접 설치 (APK Sideloading)

### 3.1 사전 설정
1. 태블릿의 `설정` -> `보안` (또는 `생체 인식 및 보안`)으로 이동합니다.
2. `출처를 알 수 없는 앱 설치`를 허용합니다.

### 3.2 ADB로 설치하면서 권한 미리 켜기 (권장)
태블릿을 USB로 연결하고 `USB 디버깅`을 켠 뒤, PC에서 아래 스크립트를 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-tablet.ps1
```

스크립트가 하는 일:
1. 최신 APK 설치 (`MeatGuideOverlay-latest-release.apk`)
2. **다른 앱 위에 표시** 권한 허용
3. **접근성 오류 감지 서비스** 켜기
4. **시스템 설정 변경** 허용 (영업 중 화면 켜짐 유지)
5. 배터리 최적화 예외 등록 (재부팅 후 자동 실행 유지)

태블릿이 여러 대 연결되어 있으면 `-Serial <기기 시리얼>`을 붙입니다(`adb devices`로 확인). 끝나면 태블릿에서 앱을 실행해 설정 마법사에서 키오스크 앱(erum 이오더)과 태블릿 이름만 저장하면 됩니다.

직접 명령어로 할 때:
```bash
adb install -r MeatGuideOverlay-latest-release.apk
adb shell appops set com.antigravity.meatguideoverlay SYSTEM_ALERT_WINDOW allow
adb shell appops set com.antigravity.meatguideoverlay WRITE_SETTINGS allow
adb shell settings put secure enabled_accessibility_services com.antigravity.meatguideoverlay/com.antigravity.meatguideoverlay.service.KioskErrorAccessibilityService
adb shell settings put secure accessibility_enabled 1
```
(마지막 두 줄은 다른 접근성 서비스를 쓰고 있다면 목록을 덮어쓰므로 스크립트 사용을 권장합니다.)

### 3.3 USB 또는 파일 전송
1. APK 파일을 태블릿의 `Download` 폴더로 복사합니다.
2. `내 파일` 앱에서 APK를 눌러 `설치`합니다.

설치 후에는 [태블릿 권한 및 기기 설정 가이드](DEVICE_SETUP_GUIDE_KO.md)에 따라 설정 마법사를 완료합니다.

---

## 4. 대상 기기
* **최소 지원**: Android 6.0 (API 23) 이상
* **권장**: Android 9.0 (API 28) ~ Android 14 (API 34)
* **화면**: 가로 화면 우선
