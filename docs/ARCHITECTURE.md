# 🏗️ Architecture

## 🧭 전체 구조

```mermaid
graph TB
    App[App Entry] --> Screens

    subgraph Screens["Screens · 화면 계층"]
        Auth["인증<br/>LoginScreen"]
        Main["메인 탭<br/>Mission · Search · Character · MyPage"]
        Content["콘텐츠<br/>ArticleDetail · Quiz · AdLoading"]
    end

    subgraph Logic["Hooks · 비즈니스 로직"]
        ContentHook["콘텐츠<br/>useArticleNavigation · useExploreContents"]
        MissionHook["미션·퀴즈<br/>useMissions · useQuizButton"]
        UserHook["사용자·캐릭터<br/>useCharacter · useMyPage"]
        NotificationHook["알림·권한<br/>useNotifications · useNotificationPermission"]
    end

    subgraph State["상태 관리"]
        Query["TanStack Query<br/>서버 상태 · Cache"]
        Store["Zustand<br/>Modal · Toast · 알림 · 보상 표시"]
    end

    subgraph Data["서비스 · 데이터 접근"]
        Service["Domain Service<br/>인증 · 소셜 로그인 · 분석"]
        API["API Modules<br/>auth · content · mission · character · notification"]
        Client["Axios Client<br/>JWT 첨부 · Refresh Queue · 공통 오류 처리"]
    end

    subgraph External["외부 연동"]
        Storage["AsyncStorage<br/>Token · User · Onboarding"]
        Backend["Spring Boot Backend<br/>REST · SSE"]
        ThirdParty["Firebase · FCM · AdMob · Mixpanel<br/>Google · Kakao · Naver · Apple"]
    end

    Screens --> Logic
    Logic --> Query
    Logic --> Store
    Logic --> Service
    Query --> API
    Service --> API
    API --> Client
    Client --> Storage
    Client --> Backend
    Service --> ThirdParty
```

화면은 렌더링과 사용자 입력에 집중하고, 비즈니스 흐름은 Custom Hook과 Service로 분리했습니다. 서버에서 받은 데이터와 앱 내부 UI 상태는 서로 다른 도구로 관리합니다.

## 🧱 계층별 책임

| Layer | Responsibility |
| --- | --- |
| Screen | React Native UI와 Navigation |
| Hook | 화면 기능과 비즈니스 흐름 캡슐화 |
| TanStack Query | API 요청, Cache, 재시도와 무효화 |
| Zustand | Modal, Toast, 알림, 로컬 표시 상태 |
| Service | 인증, 소셜 SDK, 분석과 Storage 조합 |
| API | 도메인별 HTTP 요청 정의 |
| Axios Client | JWT 첨부, Refresh, 공통 오류 처리 |

### 주요 요청 처리 흐름

```mermaid
flowchart TD
    Start([사용자 요청]) --> AuthCheck{인증 필요?}
    AuthCheck -- No --> SendRequest[API 요청 전송]
    AuthCheck -- Yes --> TokenCheck{Token 존재?}
    TokenCheck -- No --> Login[소셜 로그인 진행]
    Login --> BackendLogin[Backend 로그인 API]
    BackendLogin --> SaveToken[Token 저장]
    TokenCheck -- Yes --> AddBearer[Bearer Token 추가]
    SaveToken --> AddBearer
    AddBearer --> SendRequest
    SendRequest --> Backend[Spring Boot API]
    Backend --> Status{응답 상태}
    Status -- 200 --> Return[데이터 반환]
    Status -- 401/403 --> Refresh[Refresh API 호출]
    Status -- Network/500 --> Error[공통 오류 처리]
    Refresh --> RefreshResult{갱신 성공?}
    RefreshResult -- Yes --> Retry[새 Token 저장 후 원 요청 재시도]
    Retry --> Return
    RefreshResult -- No --> Clear[인증 정보 삭제]
    Clear --> LoginScreen[로그인 화면 이동]
    Return --> Update{상태 갱신 필요?}
    Update -- Server State --> QueryUpdate[TanStack Query Cache 갱신]
    Update -- UI State --> StoreUpdate[Zustand Store 갱신]
    QueryUpdate --> Render[UI 렌더링]
    StoreUpdate --> Render
    Render --> Analytics[Firebase · Mixpanel 이벤트 기록]
    Error --> Done([완료])
    LoginScreen --> Done
    Analytics --> Done
```

## 🔄 서버 상태와 클라이언트 상태

TanStack Query는 미션, 기사, 캐릭터, 사용자 정보처럼 서버가 원본인 데이터를 관리합니다. Zustand는 서버 Cache를 복제하지 않고 다음과 같은 앱 내부 상태에 사용합니다.

- 전역 Modal·Bottom Sheet·Toast
- 알림 표시 상태
- 온보딩 입력 상태
- 포인트·경험치의 즉각적인 UI 피드백

로그아웃·탈퇴 시 `queryClient.clear()`를 호출해 계정 간 Cache가 섞이지 않도록 합니다.

## 👤 주요 사용자 흐름

### 콘텐츠 접근

```mermaid
sequenceDiagram
    actor User
    participant Screen
    participant Hook as useArticleNavigation
    participant Store as modalStore / pointStore
    participant API
    participant Backend
    participant AdMob

    User->>Screen: 기사 선택
    Screen->>Hook: handleArticlePress
    Hook->>API: 접근 권한 조회
    API->>Backend: GET /api/content/access
    Backend-->>Hook: ContentAccess

    alt 무료 열람
        Hook->>Screen: 기사 상세 이동
    else 포인트 충분
        Hook->>Store: 포인트 사용 확인 Modal
        User->>Store: 사용 확인
        Hook->>API: purchaseContentWithPoint
        API->>Backend: 포인트 차감 요청
        Backend-->>Hook: 성공
        Hook->>Store: 로컬 표시값 반영
        Hook->>Screen: 기사 상세 이동
    else 포인트 부족
        Hook->>Store: 광고 시청 Modal
        User->>AdMob: Reward 광고 시청
        AdMob-->>Screen: 시청 완료
        Screen->>API: purchaseContentWithAd
        API->>Backend: 광고 기반 접근 요청
        Backend-->>Screen: 성공
        Screen->>Screen: 기사 상세 이동
    end
```

### 기사와 퀴즈

기사 상세, 퀴즈, 결과와 보상을 독립된 화면과 Hook으로 나누고 Navigation Parameter로 필요한 식별자만 전달합니다. 보상 이후에는 관련 Query를 무효화하거나 Character 데이터를 미리 조회합니다.

```mermaid
sequenceDiagram
    actor User
    participant Article as ArticleDetailScreen
    participant Quiz as QuizScreen
    participant API
    participant Backend
    participant Storage as AsyncStorage
    participant Store as pointStore / experienceStore

    User->>Article: 기사 상세 진입
    Article->>API: fetchContentDetail
    API->>Backend: 콘텐츠 조회
    Backend-->>Article: 기사 본문
    User->>Article: 퀴즈 풀기 선택
    Article->>Storage: 글 읽기 보상 중복 확인
    Storage-->>Article: 미지급
    Article->>Store: 로컬 글 읽기 경험치 반영
    Article->>Quiz: QuizScreen 이동
    Quiz->>API: fetchQuiz
    API->>Backend: 퀴즈 조회
    Backend-->>Quiz: 문항과 선택지
    User->>Quiz: 답안 제출
    Quiz->>API: submitQuiz
    API->>Backend: 정답 제출과 보상 계산
    Backend-->>Quiz: earnedPoint · earnedExp
    Quiz->>Store: 서버 보상값 반영
    Quiz-->>User: 결과 Popup 표시
```

### 출석 보상 흐름

```mermaid
flowchart TD
    Start([MissionScreen 진입]) --> Read[AsyncStorage에서 마지막 출석일 조회]
    Read --> Today{오늘 이미 출석?}
    Today -- Yes --> Skip[보상 없음]
    Today -- No --> Save[오늘 날짜 저장]
    Save --> Sunday{일요일?}
    Sunday -- No --> Daily[로컬 데일리 포인트·경험치 지급]
    Sunday -- Yes --> Fetch[GET /api/characters/me]
    Fetch --> Complete{월~토 출석 완료?}
    Complete -- Yes --> Weekly[로컬 데일리·위클리 보상 합산 지급]
    Complete -- No/조회 실패 --> Daily
    Daily --> Popup[보상 Popup · Analytics]
    Weekly --> Popup
    Fetch -. read-only .-> ServerRecord[서버 주간 출석 기록]
    Save -. 출석 사실을 서버로 전송하지 않음 .-> NoWrite[출석 Write API 없음]
```

### 전역 UI

Modal과 Toast를 화면 내부가 아닌 Root 수준에서 렌더링합니다. 화면 이동 이후에도 필요한 알림을 유지하고, Toast는 Native Modal 대신 View Overlay를 사용해 본문 Scroll을 막지 않도록 개선했습니다.

### 보상 출처와 화면 반영

```mermaid
flowchart TD
    Quiz([퀴즈 제출]) --> QuizAPI[submitQuiz API]
    QuizAPI --> ServerReward[서버 응답의 earnedPoint · earnedExp]

    Daily([일일 첫 진입]) --> DailyCheck{오늘 이미 지급?}
    DailyCheck -- No --> DailyLocal[로컬 데일리 보상]
    DailyCheck -- Yes --> Skip[중복 지급 없음]

    Ad([Reward 광고 완료]) --> AdAccess[광고 기반 콘텐츠 접근 API]
    AdAccess --> AdLocal[로컬 광고 보상 표시]

    Article([기사 읽기]) --> ArticleCheck{글별 보상 지급 이력?}
    ArticleCheck -- 미지급 --> ArticleLocal[로컬 글 읽기 경험치]
    ArticleCheck -- 지급 완료 --> Skip

    Purchase([포인트로 기사 구매]) --> PurchaseAPI[서버 포인트 차감 API]

    ServerReward --> Store[pointStore · experienceStore]
    DailyLocal --> Store
    AdLocal --> Store
    ArticleLocal --> Store
    Store --> Invalidate[Character Query 전체 무효화]
    Store --> Prefetch[즉시 + 1.5초 지연 Prefetch]
    Invalidate --> CharacterAPI[GET /api/characters/me]
    Prefetch --> CharacterAPI
    PurchaseAPI --> CharacterAPI
    CharacterAPI --> Character[CharacterScreen 최신 값 표시]

    style ServerReward fill:#e8f5e9
    style PurchaseAPI fill:#e8f5e9
    style DailyLocal fill:#fff3e0
    style AdLocal fill:#fff3e0
    style ArticleLocal fill:#fff3e0
    style Prefetch fill:#e1f5fe
```

## ⚡ Cache 정책

- 화면이 사용하는 Query Key Factory로 Cache Key를 일관되게 관리
- 보상 후 관련 Character Query 전체 무효화
- 화면 Mount 시 최신 정보가 중요한 데이터는 항상 재조회
- 서버 반영 지연을 고려해 보상 직후 즉시 및 지연 Prefetch
- 로그아웃·탈퇴 시 전체 Query Cache 초기화

## ⚠️ 구조적 한계

보상 경로 중 서버 응답값을 실제 지급액으로 사용하는 것은 퀴즈뿐이며, 출석·광고 시청·글 읽기 보상은 서버 API 호출 없이(또는 호출해도 지급액과는 무관하게) 클라이언트에서 로컬 상수를 지급하는 구조입니다. 이 때문에 사용자가 즉시 보는 값과 서버에서 다시 조회한 값의 반영 시점과 출처가 다를 수 있습니다. 장기적으로는 모든 보상 결과를 서버 응답을 기준으로 통일하는 것이 필요합니다.
