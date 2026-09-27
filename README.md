# MeatGuideOverlay (고기 부위 안내) - 고깃집 키오스크 보조 시스템

기존 고깃집 주문 키오스크 앱을 일체 수정하거나 역공학하지 않고, 화면 위에 캐릭터와 말풍선 오버레이를 띄워 고기 부위 안내 포스터와 키오스크 서버 오류 안내를 제공하는 보조 시스템입니다.

---

## 🚀 주요 특징

1. **무간섭(Non-intrusive) 오버레이**
   - 기존 키오스크 APK 수정·역공학·주문 조작 없음
   - 좌측 상단에 고정된 캐릭터와 말풍선(한국어 → 영어 → 일본어 3초 순환)
   - 캐릭터를 누르면 전체 화면 포스터 팝업(한글/English/日本語 탭, 두 손가락 확대)
   - 팝업은 닫기 버튼 또는 무터치 자동 닫힘(기본 5분, 관리자 웹에서 조정, 0 = 사용 안 함)으로 닫힘
2. **소고기 단일 품목 (소생갈비살) 정책**
   - 소고기는 소생갈비살 1종류만 취급하며, 육회·뿌리살·업진살 등 기타 소고기 메뉴는 추가하지 않음
3. **키오스크 서버 연결 끊김 감지**
   - 선택한 키오스크 앱 화면에서 "서버에 접속이 끊겼습니다" 등 등록된 문구 4종 감지(문구는 앱에 고정)
   - 5분 쿨다운으로 반복 팝업 방지, 직원용 안내창에서 시스템 전원 메뉴 열기
4. **실시간 콘텐츠 업데이트**
   - 관리자 웹에서 [적용]하면 앱 재시작 없이 모든 태블릿에 반영
   - 포스터 다운로드가 실패하면 자동으로 다시 시도하고, 포스터를 받은 뒤에만 새 버전으로 표시
   - 오프라인에서도 마지막으로 받은 포스터로 동작
5. **앱 자체 업데이트**
   - 직원용 관리 대시보드의 [앱 업데이트 확인]으로 새 APK를 내려받아 설치(Firebase Hosting의 `release.json`)

---

## 📂 프로젝트 구조

```text
MeatGuideOverlay/
├─ AGENTS.md                  # 에이전트 작업 규칙
├─ README.md
├─ android/                   # 안드로이드 프로젝트 (Kotlin DSL, minSdk 23, targetSdk 34)
│  ├─ app/                    # 고기 부위 안내 오버레이 앱
│  └─ test-kiosk/             # 가상 주문 키오스크 테스트 앱
├─ admin-web/                 # 관리자 웹 (React 18 + TypeScript + Vite)
│  ├─ src/                    # PopupImageManager, TabletPreviewViewer, services, tests
│  └─ public/updates/         # 앱 업데이트 매니페스트(release.json)와 APK(.bin)
├─ firebase/                  # Firestore/Storage 보안 규칙, 에뮬레이터 설정
├─ firebase.json              # 배포용 Firebase 설정 (Hosting = admin-web/dist)
├─ sample-content/            # 예전 콘텐츠 샘플 (현재 앱에서는 사용하지 않음)
├─ scripts/                   # 빌드, 서명, 앱 업데이트 게시 스크립트
│  ├─ build-all.ps1
│  ├─ generate-keystore.ps1
│  └─ publish-app-update.ps1
├─ local-signing/             # 릴리즈 서명 키스토어 (Git 제외)
└─ docs/                      # 운영·기술 문서
```

---

## 🛠 빌드 및 실행 방법

### Android 빌드 & 테스트
```bash
cd android
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleRelease
```

### 관리자 웹
```bash
cd admin-web
npm install
npm test
npm run build
npm run dev
```

### 앱 업데이트 게시
릴리즈 APK를 빌드한 뒤 `scripts/publish-app-update.ps1`을 실행하고 `firebase deploy --only hosting`으로 배포합니다. 자세한 절차는 [실시간 콘텐츠 업데이트 가이드](docs/CONTENT_UPDATE_GUIDE_KO.md)를 참고하세요.

---

## 📚 상세 문서 목록 (`docs/`)

* [설치 및 배포 가이드](docs/INSTALL_GUIDE_KO.md)
* [태블릿 권한 및 기기 설정 가이드](docs/DEVICE_SETUP_GUIDE_KO.md)
* [태블릿 식별 및 업데이트 관리 안내](docs/TABLET_UPDATE_GUIDE_KO.md)
* [Firebase 설정 및 보안 가이드](docs/FIREBASE_SETUP_KO.md)
* [관리자 웹 콘솔 가이드](docs/ADMIN_WEB_GUIDE_KO.md)
* [실시간 콘텐츠 업데이트 가이드](docs/CONTENT_UPDATE_GUIDE_KO.md)
* [문제 해결 가이드](docs/TROUBLESHOOTING_KO.md)
* [시스템 아키텍처](docs/ARCHITECTURE.md)
* [보안 및 개인정보 보호](docs/SECURITY.md)
* [성능 메모](docs/PERFORMANCE_REPORT.md)
* [말풍선 다국어 순환 수정 보고서 (v1.0.18)](docs/ROTATING_SPEECH_BUBBLE_FIX_REPORT_KO.md)
