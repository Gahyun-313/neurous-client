# Release Checklist

이 문서는 `release/<version>` 브랜치를 만들고 **QA → main 배포**까지 진행할 때 체크하는 목록입니다.

---

## 1) 릴리즈 브랜치 생성
- [ ] 현재 `develop`이 최신 상태인지 확인
- [ ] `release/<version>` 브랜치 생성 (예: `release/1.0.2`)
- [ ] 버전 업데이트
  - [ ] Android: `android/app/build.gradle`의 `versionCode`, `versionName`
  - [ ] iOS: Xcode Target의 Version / Build (또는 설정 파일)

---

## 2) 환경/설정 확인
- [ ] Firebase 설정 파일이 로컬에 존재하는지 확인
  - [ ] `android/app/google-services.json`
  - [ ] `ios/GoogleService-Info.plist`
- [ ] 서버 URL 설정 확인
  - [ ] `src/config/api.ts` (또는 env)
- [ ] 로그/디버그 코드 정리
  - [ ] 불필요한 console.log 제거(가능한 범위)
  - [ ] 개발용 토글/임시 코드 제거

---

## 3) 테스트 (스모크 + 핵심 플로우)
- [ ] Android (Release 빌드) 실행/동작 확인
- [ ] iOS (Release 빌드) 실행/동작 확인
- [ ] 핵심 플로우 테스트
  - [ ] 로그인/재로그인
  - [ ] 메인 리스트/상세 진입
  - [ ] 주요 API 호출(에러 처리 포함)
  - [ ] 알림/권한(해당 시)
- [ ] Crashlytics/Analytics 이벤트(해당 시) 정상 수집 확인

---

## 4) QA 이슈 처리
- [ ] QA 이슈는 `fix/*` 브랜치를 `release/<version>`에 반영
- [ ] 수정 후 Android/iOS 재검증
- [ ] QA 완료 체크

---

## 5) main 배포
- [ ] `release/<version>` → `main` PR 생성 및 merge
- [ ] `main`에 태그 생성: `v<version>` (예: `v1.0.2`)
- [ ] `main` → `develop` 동기화 PR 생성 및 merge

---

## 6) 릴리즈 노트(간단)
- [ ] 이번 릴리즈 변경사항 요약
  - Added:
  - Fixed:
  - Changed:
  - Notes:
