# Firebase 연동 및 보안 설정 가이드 (한국어)

## 1. 개요
본 시스템은 **Cloud Firestore**, **Firebase Authentication**, **Firebase Storage**, **Firebase Hosting**을 백엔드로 활용합니다.

---

## 2. Firebase 프로젝트 생성 및 설정

1. [Firebase Console](https://console.firebase.google.com/)에 접속하여 새 프로젝트를 생성합니다. (예: `meat-guide-overlay`)
2. **Authentication 활성화**:
   * `익명(Anonymous) 로그인`: 활성화 (키오스크 태블릿이 별도 계정 입력 없이 보안 토큰 발급)
   * `이메일/비밀번호(Email/Password) 로그인`: 활성화 (관리자 로그인용)
3. **Cloud Firestore 활성화**:
   * 기본 모드로 데이터베이스 생성
4. **Firebase Storage 활성화**:
   * 기본 버킷 생성

---

## 3. 컬렉션 구조 명세

```text
published/current               # 현재 배포 중인 전체 콘텐츠 단일 문서
drafts/current                  # 관리자가 수정 중인 초안 문서
content_history/{contentVersion} # 과거 게시된 콘텐츠 스냅샷 이력
admins/{adminUid}               # 관리자 권한을 가진 UID 목록
devices/{deviceUid}             # 연결된 각 태블릿 기기 상태 모니터링 문서
```

---

## 4. 보안 규칙 (Security Rules)

* **Firestore 보안 규칙 (`firebase/firestore.rules`)**:
  * 익명 인증된 태블릿: `published/current` 읽기 허용, 자신의 `devices/{deviceUid}` 문서만 쓰기 허용.
  * 관리자 (`admins/{uid}` 등록 계정): `drafts/*`, `published/*`, `content_history/*`, Storage 업로드 등 전권 허용.
* **Storage 보안 규칙 (`firebase/storage.rules`)**:
  * 태블릿: 에셋 읽기 허용.
  * 관리자: 3MB 이하 유효 이미지 MIME 타입만 업로드 허용.

---

## 5. 로컬 Firebase Emulator Suite 실행

실제 Firebase 연결 없이도 로컬에서 모든 백엔드 기능을 완벽하게 시뮬레이션할 수 있습니다.

```bash
cd firebase
npx firebase emulators:start
```

* Firestore Emulator: `http://localhost:8080`
* Auth Emulator: `http://localhost:9099`
* Storage Emulator: `http://localhost:9199`
* Emulator UI 대시보드: `http://localhost:4000`
