# MeatGuideOverlay (고기 부위 안내) - 고깃집 키오스크 보조 시스템

기존 고깃집 주문 키오스크 앱을 일체 수정하거나 역공학하지 않고, 화면 위에 귀여운 캐릭터와 말풍선 오버레이를 띄워 고기 부위 설명 및 키오스크 서버 오류 안내를 제공하는 통합 보조 시스템입니다.

---

## 🚀 주요 특징

1. **무간섭(Non-intrusive) 오버레이 아키텍처**:
   - 기존 키오스크 APK 역공학 및 결제/주문 데이터 조작 0%
   - 화면 가장자리 자석 스냅 캐릭터 및 60초 자동 닫기 모달 팝업
2. **소고기 단일 품목 (소생갈비살) 정책**:
   - 첫 화면: **돼지고기 특수부위** / **소생갈비살** 정확히 2개 카드만 노출
   - 육회, 뿌리살, 업진살 등 기타 소고기 품목 원천 배제
3. **키오스크 서버 연결 단절 자동 감지**:
   - "서버에 접속이 끊겼습니다" 화면 텍스트 실시간 감지
   - 지정된 키오스크 패키지만 감시 + 5분 쿨다운으로 무한 루프 방지
   - 직원용 재부팅 안내 및 전원 메뉴 팝업 제공
4. **무중단 실시간 콘텐츠 업데이트 (OTA)**:
   - 관리자 웹에서 수정 후 [게시] 시 앱 재시작 없이 모든 태블릿에 즉시 반영
   - 스키마 검증 및 원자적(Atomic) 임시 파일 교체로 데이터 무결성 보장
   - 오프라인에서도 마지막 캐시 버전으로 100% 정상 작동
5. **초경량 저사양 태블릿 최적화**:
   - 대기 상태 메모리 PSS ~38MB, CPU 사용률 0%에 수렴
   - 릴리즈 APK 15MB 미만

---

## 📂 프로젝트 구조

```text
MeatGuideOverlay/
├─ AGENTS.md                  # 16대 프로젝트 자동 진행 규칙
├─ README.md                  # 프로젝트 안내서
├─ .gitignore                 # 보안 키스토어 및 자격증명 제외 설정
├─ android/                   # 안드로이드 프로젝트 (Kotlin DSL, MinSdk 23, TargetSdk 34)
│  ├─ app/                    # 고기 부위 안내 오버레이 메인 앱
│  ├─ test-kiosk/             # 가상 주문 키오스크 테스트 앱
│  ├─ build.gradle.kts
│  ├─ settings.gradle.kts
│  └─ gradlew.bat
├─ admin-web/                 # 관리자 웹 콘솔 (React + TypeScript + Vite)
│  ├─ src/
│  ├─ tests/                  # Vitest 유효성 검증 단위 테스트
│  ├─ package.json
│  └─ vite.config.ts
├─ firebase/                  # Firebase 보안 규칙 및 에뮬레이터 테스트
│  ├─ firestore.rules
│  ├─ storage.rules
│  ├─ firebase.json
│  └─ emulator-tests/
├─ sample-content/            # 초기 배포용 데이터 및 벡터 에셋
│  ├─ published-content.json
│  └─ placeholder-assets/
├─ scripts/                   # 빌드, 시드, 서명 자동화 스크립트
│  ├─ build-all.ps1
│  ├─ generate-keystore.ps1
│  ├─ seed-emulator.js
│  └─ bootstrap-admin.js
├─ local-signing/             # 로컬 릴리즈 서명 키스토어 (Git 제외)
├─ docs/                      # 9종 상세 기술 및 운영 문서
└─ dist/                      # 최종 빌드 산출물
   ├─ MeatGuideOverlay-release.apk
   ├─ MeatGuideOverlay-debug.apk
   ├─ TestKiosk-debug.apk
   └─ admin-web-build.zip
```

---

## 🛠 빌드 및 실행 방법

### 1. 원클릭 전체 빌드 (APKs + Admin Web -> dist/)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-all.ps1
```

### 2. Android 개별 빌드 & 테스트
```bash
cd android
./gradlew test
./gradlew :app:assembleRelease
./gradlew :app:assembleDebug
./gradlew :test-kiosk:assembleDebug
```

### 3. 관리자 웹 실행 및 테스트
```bash
cd admin-web
npm install
npm test
npm run build
npm run dev
```

### 4. Firebase 보안 규칙 테스트
```bash
node firebase/emulator-tests/rules.test.js
```

---

## 📚 상세 문서 목록 (`docs/`)

* [설치 및 배포 가이드](file:///docs/INSTALL_GUIDE_KO.md)
* [태블릿 권한 및 기기 설정 가이드](file:///docs/DEVICE_SETUP_GUIDE_KO.md)
* [Firebase 설정 및 보안 가이드](file:///docs/FIREBASE_SETUP_KO.md)
* [관리자 웹 콘솔 가이드](file:///docs/ADMIN_WEB_GUIDE_KO.md)
* [실시간 콘텐츠 업데이트 가이드](file:///docs/CONTENT_UPDATE_GUIDE_KO.md)
* [문제 해결 및 트러블슈팅 가이드](file:///docs/TROUBLESHOOTING_KO.md)
* [시스템 아키텍처 명세서](file:///docs/ARCHITECTURE.md)
* [보안 및 개인정보 보호 명세서](file:///docs/SECURITY.md)
* [저사양 태블릿 성능 측정 보고서](file:///docs/PERFORMANCE_REPORT.md)
