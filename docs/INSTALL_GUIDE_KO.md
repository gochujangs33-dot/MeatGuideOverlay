# MeatGuideOverlay 설치 및 배포 가이드 (한국어)

## 1. 개요
`MeatGuideOverlay`(고기 부위 안내)는 기존 매장 키오스크 주문 앱을 일체 수정하거나 조작하지 않고, 화면 위에 귀여운 캐릭터와 말풍선을 띄워 고객에게 고기 부위 설명 및 키오스크 서버 연결 오류 발생 시 직원용 재부팅 안내를 제공하는 보조 앱입니다.

---

## 2. 필수 구성 요소
* **MeatGuideOverlay-release.apk** (또는 debug.apk): 보조 오버레이 메인 앱
* **TestKiosk-debug.apk**: 가상 주문 키오스크 테스트 앱 (검증 및 시연용)
* **admin-web-build.zip**: 관리자 웹 콘솔 배포 번들

---

## 3. 태블릿 직접 설치 방법 (APK Sideloading)

### 3.1 사전 설정
1. 태블릿의 `설정` -> `보안` (또는 `생체 인식 및 보안`)으로 이동합니다.
2. `출처를 알 수 없는 앱 설치`를 허용합니다. (파일 관리자 또는 브라우저 선택 후 허용)

### 3.2 ADB를 통한 설치 (권장)
PC와 태블릿을 USB로 연결한 후 다음 명령을 실행합니다.

```bash
# 1. 메인 오버레이 앱 설치
adb install -r dist/MeatGuideOverlay-release.apk

# 2. 가상 테스트 키오스크 앱 설치 (테스트용)
adb install -r dist/TestKiosk-debug.apk
```

### 3.3 USB 드라이브 또는 파일 전송을 통한 설치
1. `dist/MeatGuideOverlay-release.apk` 파일을 USB 또는 내부 저장소의 `Download` 폴더로 복사합니다.
2. 태블릿 내 `내 파일` 앱을 열어 APK를 터치하고 `설치`를 누릅니다.

---

## 4. 버전 및 대상 기기 호환성
* **최소 지원 사양**: Android 6.0 (API 23, Marshmallow) 이상
* **권장 사양**: Android 9.0 (API 28) ~ Android 14 (API 34)
* **지원 아키텍처**: ARM 32비트 (`armeabi-v7a`), ARM 64비트 (`arm64-v8a`), x86/x86_64
* **화면 모드**: 가로 화면(Landscape) 최우선 최적화, 세로 화면(Portrait) 반응형 지원

> [!NOTE]
> 본 앱은 구형 저사양 태블릿에서도 버벅임 없이 실행되도록 XML 기반 경량 UI 및 바운디드 텍스트 탐색 엔진으로 설계되었습니다.
