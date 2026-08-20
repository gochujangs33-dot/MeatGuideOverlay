# 보안 및 개인정보 보호 명세서 (Security & Privacy)

## 1. 개인정보 및 주문 데이터 무수집 원칙
`MeatGuideOverlay`는 기존 키오스크 시스템과의 완벽한 격리를 보장하며 다음 행위를 절대 수행하지 않습니다:
* **고객 주문 데이터 수집 금지**: 메뉴 선택 내역, 수량, 결제 금액 등을 가로채거나 수집하지 않습니다.
* **결제 정보/카드 데이터 접근 금지**: 결제 모듈 및 IC카드/NFC 리더기와 일체 통신하지 않습니다.
* **화면 캡처/키로깅 일체 금지**: `MediaProjection`이나 전역 키로깅을 사용하지 않으며, 오직 접근성 이벤트 중 사전에 등록된 오류 텍스트 존재 여부만 검사합니다.
* **자동 버튼 클릭 금지**: 키오스크 화면 상의 버튼을 앱이 임의로 클릭하거나 조작하지 않습니다.

---

## 2. 인증 및 권한 모델 (Firebase Auth & Rules)

1. **태블릿 기기 (익명 인증)**:
   * Google Play 계정이나 매장 직원 로그인 없이도 Firebase Anonymous Auth를 통해 안전한 임시 인증 토큰을 발급받습니다.
   * `published/current` 문서를 읽을 수 있는 권한만 부여되며, 관리자 데이터(`drafts`, `admins`, `content_history`)에는 접근할 수 없습니다.
   * 기기 상태 보고 시 `devices/{deviceUid}` 문서만 쓰기 가능하며, 다른 기기의 상태 문서는 수정할 수 없습니다.
2. **관리자 웹 (자동 익명 세션)**:
   * 관리자 주소에 접속하면 Firebase Anonymous Auth 세션이 자동으로 발급되어 이메일/비밀번호 입력 없이 화면에 진입합니다.
   * 자동 세션은 `active_popup/current` 수정과 Storage 이미지 업로드에만 사용되며, 초안·관리자 목록·콘텐츠 이력은 계속 `isAdmin()`으로 보호됩니다.
   * 관리자 URL을 알고 있는 사용자는 팝업 설정을 수정할 수 있으므로, 외부 공개 주소로 사용하지 않아야 합니다.

---

## 3. 서명 키 및 비밀정보 관리 (Keystore & Secrets)

* **Git 커밋 제외 (`.gitignore`)**:
  * `local-signing/`: 로컬 릴리즈 키스토어(`*.jks`) 및 비밀번호 정보 파일
  * `keystore.properties`: 로컬 빌드용 서명 프로퍼티 파일
  * `google-services.json`: 실제 운영 Firebase 연결 파일 (대신 `google-services.json.example` 제공)
  * `.env`, `.env.local`: 웹 환경 변수 파일
* **로컬 서명 정보 보관**:
  * 자동 생성된 서명 비밀번호는 `local-signing/PRIVATE_SIGNING_INFO.txt`에만 암호화/기록되며 터미널이나 소스코드에 하드코딩되지 않습니다.
