# 콘텐츠 실시간 업데이트 및 앱 버전 관리 가이드 (한국어)

## 1. 개요
`MeatGuideOverlay`는 **콘텐츠 업데이트**(관리자 웹 → Firestore)와 **앱 업데이트**(새 APK)의 두 가지로 나뉩니다.

| 구분 | 콘텐츠 업데이트 | 앱 업데이트 (APK) |
| :--- | :--- | :--- |
| **대상** | 포스터 이미지(한/영/일), 말풍선 문구(한/영/일), 팝업 무터치 자동 닫힘 시간 | 앱 기능·화면 변경, 오류 감지 문구, 권한·서비스 동작 |
| **적용 방법** | 관리자 웹에서 [일괄 적용] | 직원용 대시보드의 [앱 업데이트 확인] |
| **앱 재시작** | 필요 없음 | 설치 시 자동 재시작 |
| **오프라인** | 마지막으로 받은 포스터로 동작 | 설치된 버전으로 동작 |

---

## 2. 콘텐츠 업데이트 동작

```text
[관리자 웹] ──(적용)──> [Firestore active_popup/current]
                               │ 실시간 리스너
                               ▼
                 [PopupImageRepository]
                               │ 포스터 주소가 바뀐 언어만 다운로드
                               │ (실패 시 30초 → 최대 10분 간격 재시도)
                               ▼
         [모든 포스터 준비 완료 후 새 버전 적용 → 화면 반영]
```

* 태블릿은 언어별로 "어느 주소에서 받은 포스터인지"를 기록합니다. 문구만 바꾼 경우에는 포스터를 다시 받지 않습니다.
* 포스터 다운로드가 끝나기 전에는 이전 버전을 유지하고, 관리자 웹에도 이전 콘텐츠 버전으로 보고합니다.
* 포스터 파일과 설정 파일은 임시 파일에 먼저 쓴 뒤 교체합니다. 받은 파일이 올바른 이미지가 아니면 교체하지 않습니다.
* 직원용 대시보드의 **[수동 콘텐츠 동기화]**는 서버에서 최신 설정을 직접 읽고 포스터를 받습니다. 서버에 연결되지 않거나 포스터를 받지 못하면 "동기화 실패"로 표시됩니다.

---

## 3. 앱 업데이트 게시 절차 (개발자)

1. `android/app/build.gradle.kts`의 `versionCode`와 `versionName`을 올립니다.
2. 릴리즈 APK를 빌드합니다: `cd android && ./gradlew :app:assembleRelease`
3. 매니페스트와 배포 파일을 만듭니다:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\publish-app-update.ps1 -VersionCode 20 -VersionName 1.0.19 -DownloadUrl https://meatguideoverlay.web.app/updates/meatguide-overlay-20.bin -Notes "변경 내용"
   ```
   APK는 Spark 요금제 제한 때문에 `.bin` 확장자로 올립니다.
4. 관리자 웹을 빌드하고 배포합니다: `cd admin-web && npm run build`, 이후 루트에서 `firebase deploy --only hosting`
5. 태블릿에서 직원용 대시보드 → **[앱 업데이트 확인]** → **[다운로드 및 설치]** → Android 설치 화면에서 승인합니다.

앱은 SHA-256 검증을 통과한 파일만 설치하며, 무단 백그라운드 설치는 하지 않습니다.
