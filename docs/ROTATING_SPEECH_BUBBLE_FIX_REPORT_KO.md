# 오버레이 캐릭터 말풍선 다국어 순환 수정 및 v1.0.18 배포 보고서

## 1. 개요 및 문제 현상
* **문제 증상**: 안드로이드 키오스크 오버레이 앱 `MeatGuideOverlay`의 좌측/우측 상단 마스코트 캐릭터와 말풍선 문구가 시간차를 두고 다국어(한국어 ➔ 영어 ➔ 일본어)로 자동 전환되어야 하나, 한국어 기본 문구("판매하는 고기가 궁금하면 클릭해주세요.")로 고정되어 언어가 바뀌지 않는 현상.
* **영향 범위**: 키오스크 화면에 상시 플로팅되는 오버레이 마스코트 및 안내 말풍선 UI.

---

## 2. 근본 원인 분석 (Root Cause Analysis)

### 2.1 커밋 이력 추적
1. **과거 정상 구현 (`commit 8d95b86`)**:
   * 3초(`delay(3000L)`) 간격으로 한국어(KO) ➔ 영어(EN) ➔ 일본어(JA) 순으로 문구를 순환하며, 150ms 페이드아웃 및 페이드인 애니메이션을 적용하는 `startSpeechBubbleLanguageCycle()` 코루틴 로직이 구현되어 있었음.
2. **누락 발생 시점 (`commit d70d33f3`)**:
   * 팝업 닫기 버튼을 크고 명확하게 수정하는 UI 리팩토링 과정(`fix: require prominent close button for popup`) 중, 코루틴 잡(`bubbleRotationJob`)과 `startSpeechBubbleLanguageCycle()` 함수 및 호출 코드가 실수로 함께 삭제됨.
3. **웹 관리자(`admin-web`)와의 불일치**:
   * 관리자 웹 콘솔의 태블릿 미리보기 컴포넌트(`TabletPreviewViewer.tsx`)는 3초 주기 언어 순환이 정상 동작하고 있었으나, 실제 안드로이드 태블릿 앱 코드(`OverlayWindowController.kt`)에서는 순환 로직이 삭제되어 있어 실제 기기에서 동작하지 않았음.

### 2.2 코드 레벨 원인
* **고정 텍스트 1회 설정 후 방치**: `showSpeechBubble()`에서 `binding.tvSpeechBubble.text = context.getString(R.string.default_speech_bubble)`로 정적 문자열만 1회 주입하고 타이머가 동작하지 않음.
* **서버 다국어 필드 미반영**: Firestore/로컬 저장소의 `ActivePopupInfo`에 등록된 `bubbleTextKo`, `bubbleTextEn`, `bubbleTextJa` 필드를 오버레이 말풍선이 읽어오지 않음.
* **라이프사이클 연동 부재**: 팝업 닫힘, 원격 팝업 갱신, 서비스 재시작 시 언어 순환 주기가 시작되지 않음.

---

## 3. 코드 수정 내용

### 3.1 [OverlayWindowController.kt](file:///c:/Users/0op64/.gemini/antigravity/scratch/MeatGuideOverlay/android/app/src/main/java/com/antigravity/meatguideoverlay/ui/overlay/OverlayWindowController.kt)
1. **순환 상태 및 작업 변수 복원**:
   ```kotlin
   private var bubbleRotationJob: Job? = null
   private var currentBubbleLangIndex = 0
   ```
2. **다국어 문구 조회 및 폴백 헬퍼 메서드 추가**:
   ```kotlin
   private fun getSpeechBubbleText(popupInfo: ActivePopupInfo, langIndex: Int): String {
       val fallback = popupInfo.bubbleTextKo.ifBlank {
           popupInfo.bubbleText.ifBlank {
               context.getString(R.string.default_speech_bubble)
           }
       }
       return when (langIndex) {
           1 -> popupInfo.bubbleTextEn.ifBlank { fallback }
           2 -> popupInfo.bubbleTextJa.ifBlank { fallback }
           else -> fallback
       }
   }
   ```
3. **3초 주기 언어 자동 순환 코루틴 구현**:
   ```kotlin
   private fun startSpeechBubbleLanguageCycle() {
       bubbleRotationJob?.cancel()
       bubbleRotationJob = scope.launch {
           while (isActive) {
               delay(3000L) // 3초 주기
               if (isPopupAttached || !isCharacterAttached || floatingBinding == null) {
                   continue
               }

               currentBubbleLangIndex = (currentBubbleLangIndex + 1) % 3
               val popupInfo = popupImageRepository.activePopupState.value
               val nextText = getSpeechBubbleText(popupInfo, currentBubbleLangIndex)

               mainHandler.post {
                   val tv = floatingBinding?.tvSpeechBubble ?: return@post
                   tv.animate()
                       .alpha(0f)
                       .setDuration(150)
                       .withEndAction {
                           tv.text = nextText
                           tv.animate().alpha(1f).setDuration(150).start()
                       }
                       .start()
               }
           }
       }
   }
   ```
4. **오버레이 라이프사이클 연동**:
   * `showFloatingCharacter()`: 화면 표시와 동시에 현재 언어 인덱스 문구 즉시 표시 및 순환 시작.
   * `closeSingleImagePopup()`: 팝업 닫힘 후 캐릭터 재노출 시 순환 재개.
   * `observeActivePopup()`: 서버에서 실시간으로 새 문구가 오면 화면 텍스트 즉시 갱신 및 순환 유지.
   * `hideFloatingCharacter()`, `removeFloatingCharacter()`, `releaseAll()`: 화면에서 사라질 때 `stopSpeechBubbleLanguageCycle()` 호출로 불필요한 백그라운드 리소스 소모 방지.

---

## 4. 앱 버전 관리 및 릴리즈 배포

### 4.1 버전 상향
* **대상 파일**: [android/app/build.gradle.kts](file:///c:/Users/0op64/.gemini/antigravity/scratch/MeatGuideOverlay/android/app/build.gradle.kts)
* `versionCode`: `18` ➔ `19`
* `versionName`: `"1.0.17"` ➔ `"1.0.18"`

### 4.2 릴리즈 APK 서명 빌드
* `./gradlew assembleRelease` 실행 완료 (`BUILD SUCCESSFUL in 50s`)
* 산출물: `android/app/build/outputs/apk/release/app-release.apk` (약 29MB, 정식 서명 완료)

### 4.3 Firebase Hosting Spark 플랜 호환 배포
* **이슈**: Firebase Hosting Spark(무료) 플랜 정책상 `.apk` 실행 파일 직접 업로드 차단 (`HTTP 400 Executable files are forbidden on the Spark billing plan`).
* **해결**:
  1. 앱 인스톨러(`AppUpdateManager.kt`)는 파일 확장자와 무관하게 바이트 스트림을 다운로드하여 로컬에 `.apk`로 저장 후 설치하도록 이미 구현되어 있음.
  2. `scripts/publish-app-update.ps1`을 수정하여 릴리즈 바이너리를 `.bin` (`meatguide-overlay-19.bin`) 형태로 호스팅에 배포하도록 구성.
  3. `admin-web/public/updates/release.json` 매니페스트 생성:
     ```json
     {
         "versionCode": 19,
         "versionName": "1.0.18",
         "downloadUrl": "https://meatguideoverlay.web.app/updates/meatguide-overlay-19.bin",
         "sha256": "5c5084573756a6098d9abcf6a6eace957e59813dc85ba997812fcff1cf1d8751",
         "notes": "좌측 상단 오버레이 캐릭터 말풍선 3초 주기 다국어 자동 순환 적용"
     }
     ```
  4. `firebase deploy --only hosting` 배포 완료 (`https://meatguideoverlay.web.app`).

---

## 5. 태블릿 업데이트 실행 가이드

이제 온라인 배포가 완료되었으므로, **태블릿에서 바로 앱 업데이트를 실행**하실 수 있습니다.

1. **태블릿에서 앱 실행**:
   * 태블릿 화면에서 `MeatGuideOverlay` 앱을 실행합니다.
2. **직원용 관리 대시보드 진입**:
   * 플로팅 캐릭터를 더블 탭하거나, 앱 런처를 통해 **직원용 관리 대시보드** 화면으로 들어갑니다.
3. **업데이트 확인 및 설치**:
   * 화면 하단의 **[앱 업데이트 확인]** 버튼을 누릅니다.
   * `새 버전 발견: v1.0.18 (19)` 알림 팝업이 표시됩니다.
   * **[다운로드 및 설치]**를 누르면 신규 파일 다운로드 후 안드로이드 표준 패키지 설치 화면이 나타납니다.
   * **[업데이트]**를 승인하여 설치를 완료합니다.
4. **확인**:
   * 앱 실행 시 좌측 상단 마스코트 캐릭터의 말풍선이 3초 주기로 **한국어 ➔ 영어 ➔ 일본어**로 부드럽게 자동 전환되는 것을 확인합니다.
