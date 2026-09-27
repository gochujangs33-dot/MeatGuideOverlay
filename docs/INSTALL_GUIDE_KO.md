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

### 3.2 ADB를 통한 설치 (권장)
```bash
adb install -r MeatGuideOverlay-latest-release.apk
```

### 3.3 USB 또는 파일 전송
1. APK 파일을 태블릿의 `Download` 폴더로 복사합니다.
2. `내 파일` 앱에서 APK를 눌러 `설치`합니다.

설치 후에는 [태블릿 권한 및 기기 설정 가이드](DEVICE_SETUP_GUIDE_KO.md)에 따라 설정 마법사를 완료합니다.

---

## 4. 대상 기기
* **최소 지원**: Android 6.0 (API 23) 이상
* **권장**: Android 9.0 (API 28) ~ Android 14 (API 34)
* **화면**: 가로 화면 우선
