# 성능 메모 (Performance Notes)

> 이전 버전의 측정표(APK 14.8MB, 메모리 38.5MB 등)는 고해상도 포스터를 넣기 전 값이라 삭제했습니다. 아래는 코드와 빌드 파일로 확인한 값이며, 메모리·배터리는 실제 기기에서 다시 측정해야 합니다.

## 1. 확인된 값

| 항목 | 값 | 근거 |
| :--- | :--- | :--- |
| 릴리즈 APK 크기 | 약 29MB | v1.0.18 `app-release.apk` (29,017,697바이트) |
| APK 크기의 주요 원인 | 고해상도 PNG 포스터 3장, 약 17MB | `assets/pork_guide_poster_*_hq.png` (3072×2046) |
| 포스터 1장 메모리 | 약 25MB | 3072×2046 × 4바이트(ARGB_8888) |
| 포스터 디코딩 상한 | 10MP (약 40MB) | `PosterSampling.MAX_DECODED_PIXELS` |
| 접근성 탐색 제한 | 깊이 12, 텍스트 노드 60개 | `KioskErrorAccessibilityService` |
| 접근성 검사 주기 | 400ms마다 최대 1회 (마지막 화면은 반드시 검사) | `KioskErrorMonitor` |
| 기기 상태 보고 | 5분 주기 | `OverlayForegroundService` |

## 2. 적용된 최적화
1. **XML View 기반 UI** (Jetpack Compose 미사용)
2. **포스터 디코딩을 백그라운드에서 처리**하고, 큰 이미지는 10MP 이하로 줄여서 메모리 부족을 막습니다.
3. **포스터 주소가 바뀐 언어만 다운로드**하므로, 문구만 바꿀 때는 이미지를 다시 받지 않습니다.
4. **접근성 이벤트를 모아서 처리**하고, 선택한 키오스크 앱만 검사합니다.

## 3. 개선 여지
* 포스터를 WebP로 바꾸면 APK 크기를 크게 줄일 수 있습니다.
* `assets/`의 예전 JPG 포스터 4장(약 1.7MB)과 `default_content.json`은 현재 사용하지 않습니다.
