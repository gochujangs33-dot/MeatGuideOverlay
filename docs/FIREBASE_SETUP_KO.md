# Firebase 연동 및 보안 설정 가이드 (한국어)

## 1. 개요
**Cloud Firestore**, **Firebase Authentication(익명)**, **Firebase Storage**, **Firebase Hosting**을 사용합니다. 프로젝트 ID는 `meatguideoverlay`입니다.

---

## 2. 프로젝트 설정
1. **Authentication**: `익명(Anonymous)` 로그인을 켭니다. 태블릿과 관리자 웹 모두 익명 로그인으로 접속합니다.
2. **Cloud Firestore**: 기본 데이터베이스를 만듭니다.
3. **Storage**: 기본 버킷을 만듭니다.
4. **Hosting**: 관리자 웹(`admin-web/dist`)과 앱 업데이트 파일(`/updates/`)을 배포합니다. Spark(무료) 요금제는 `.apk` 업로드를 막으므로 APK는 `.bin`으로 올립니다.

---

## 3. 컬렉션 구조

```text
active_popup/current      # 태블릿에 표시할 포스터 주소(한/영/일), 말풍선 문구, 팝업 자동 닫힘 시간
devices/{deviceUid}       # 태블릿별 이름, 앱 버전, 콘텐츠 버전, 마지막 보고 시간
published/current         # 예전 방식의 콘텐츠 문서 (현재 앱은 사용하지 않음)
drafts/current            # 예전 방식 (사용하지 않음)
content_history/{version} # 예전 방식 (사용하지 않음)
admins/{adminUid}         # 관리자 UID 목록 (예전 방식 규칙에서만 사용)
```

---

## 4. 보안 규칙 요약
* `active_popup/*`: 로그인된 세션이면 누구나 읽기·쓰기 가능
* `devices/*`: 로그인된 세션이면 모두 읽기, 쓰기는 자기 문서만
* Storage `popups/**`, `assets/**`: 로그인된 세션이면 읽기, 25MB 이하 이미지 업로드 가능

관리자 웹에 비밀번호가 없기 때문에, 사이트 설정값을 가진 사람은 누구나 태블릿 포스터를 바꿀 수 있습니다. 주소를 숨기는 것으로는 막을 수 없습니다. 자세한 내용과 대안은 [보안 문서](SECURITY.md)를 참고하세요.

---

## 5. 로컬 Firebase Emulator

```bash
cd firebase
npx firebase emulators:start
```

* Firestore: `http://localhost:8080`
* Auth: `http://localhost:9099`
* Storage: `http://localhost:9199`
* Hosting: `http://localhost:5000`
* Emulator UI: `http://localhost:4000`

관리자 웹을 에뮬레이터에 연결하려면 `VITE_USE_FIREBASE_EMULATOR=true`로 실행합니다.

> `firebase/emulator-tests/rules.test.js`는 실제 규칙 파일을 실행하지 않고 흉내 낸 로직만 검사합니다. 규칙을 바꿀 때는 에뮬레이터에서 직접 확인하세요.
