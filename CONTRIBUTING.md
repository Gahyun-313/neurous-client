# Contributing Guide

이 레포는 **main + develop** 브랜치 전략으로 운영합니다.  

---

## 1) Branch Strategy

### 기본 브랜치

- **main**: 배포 가능한 상태 (릴리즈 브랜치만 merge)
- **develop**: 다음 릴리즈 준비용 통합 브랜치 (일반 작업 PR이 모이는 곳)

### 작업 브랜치 생성 기준

- 항상 **develop**에서 분기합니다.

### 브랜치 네이밍

```
feat/<scope>-<short>
fix/<scope>-<short>
refactor/<scope>-<short>
chore/<scope>-<short>
docs/<scope>-<short>
release/<version>
```

#### 예시

- `feat/ui-overseas-toggle`
- `fix/auth-kakao-token-refresh`
- `refactor/api-client`
- `chore/config-ignore-secrets`
- `docs/readme-update`
- `release/1.0.2`

---

## 2) Workflow

### 일반 개발 플로우

1. `develop`에서 작업 브랜치 생성
2. 작업 완료 후 PR 생성 → **develop** 대상으로 merge
3. 기능 단위로 PR을 작게 유지 (1 PR = 1 목적)

### 릴리즈 플로우

1. `develop`에서 `release/<version>` 생성
2. QA 진행 (수정이 필요하면 `fix/*` 브랜치를 `release/*`에 merge)
3. QA 완료 후 `release/<version>` → **main** merge
4. `main`에 태그 `v<version>` 생성
5. **main 변경사항을 develop에도 반드시 반영** (동기화 PR: main → develop)

### Merge 방식 (권장)

- **develop**: Squash merge 권장 (히스토리 깔끔하게)
- **main**: Merge commit 또는 Squash 중 하나로 통일 (팀 기준에 맞춰 선택)

---

## 3) Commit Message Convention

### 형식

```
type(scope): 한글 요약
```

### Type

| Type | 설명 |
|------|------|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 리팩터링 (기능 변화 없음) |
| `chore` | 설정/빌드/의존성/정리 |
| `docs` | 문서 |
| `test` | 테스트 |

### Scope 추천

```
auth, api, ui, nav, build, config, release, analytics, ads, 
lottie, mission, content, notification
```

### 예시

```
feat(auth): 애플 로그인 토큰 교환 추가
fix(api): QA 서버 baseURL 적용 누락 수정
refactor(ui): 해외 뉴스 리스트 컴포넌트 분리
chore(config): 시크릿 파일 gitignore 및 example 추가
docs(readme): 로컬 세팅 가이드 업데이트
```

### 권장 규칙

- 한 커밋 = 한 가지 의도
- 의미 없는 커밋 메시지 금지 (예: "수정", "test", "asd")
- 가능한 한 "무엇을/왜"를 드러내기

---

## 4) Pull Request Rules

### PR 대상 브랜치

- **일반 작업 PR**: `develop`
- **릴리즈 PR**: `release/*` → `main`
- **릴리즈 후 동기화 PR**: `main` → `develop`

### PR 제목 형식

커밋과 동일하게 작성:

```
feat(ui): 해외 뉴스 토글 추가
fix(auth): 카카오 토큰 최신화 누락 수정
```

### PR 최소 체크리스트

- [ ] 변경사항 요약 작성
- [ ] 테스트/확인 항목 체크
- [ ] 스크린샷/영상 첨부 (UI 변경 시)

---

## 5) Secrets / Config Policy

### 민감정보는 레포에 커밋하지 않습니다

다음 파일들은 **절대 커밋하지 않습니다**:

#### Firebase 설정
- `android/app/google-services.json`
- `ios/**/GoogleService-Info.plist`

#### 서버 URL/환경값
- `src/config/api.ts`
- `.env`

#### 키/인증서
- `*.keystore`
- `*.jks`
- `*.p12`
- `*.pem`
- `*.mobileprovision`

### 템플릿 파일을 커밋합니다

대신 다음 템플릿 파일들을 레포에 포함합니다:

```
android/app/google-services.json.example
ios/GoogleService-Info.plist.example
src/config/api.example.ts
.env.example (필요 시)
```

### 로컬 설정 방법

1. 템플릿 파일(`.example`)을 복사하여 실제 파일 생성
2. 실제 값으로 채워넣기
3. 로컬에서만 사용 (git에는 추적되지 않음)

---

## 6) 기타 권장사항

### 코드 리뷰

- PR 리뷰 시 건설적인 피드백 제공
- 변경사항이 크면 사전에 팀과 논의
- 리뷰어는 24시간 이내 응답 권장

### 테스트

- 주요 기능에 대한 테스트 코드 작성 권장
- PR 전 로컬에서 충분히 테스트

### 문서화

- 복잡한 로직은 주석으로 설명
- API 변경 시 README 업데이트
- 새로운 환경 설정 추가 시 문서화
