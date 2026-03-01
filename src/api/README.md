# 📡 api/ — 백엔드 통신 레이어

> 서버와 직접 통신 담당 (HTTP 요청 보내고 응답 받기)

---

## 📁 파일 구성

| 파일                 | 역할                                             |
| -------------------- | ------------------------------------------------ |
| `client.ts`          | Axios 인스턴스 + 인터셉터 설정 (모든 API의 기반) |
| `authApi.ts`         | 로그인 / 토큰 갱신 / 로그아웃                    |
| `characterApi.ts`    | 캐릭터 정보 조회 및 리워드                       |
| `contentApi.ts`      | 아티클/콘텐츠 목록·상세 조회                     |
| `missionApi.ts`      | 미션 목록 및 완료 처리                           |
| `notificationApi.ts` | 알림 조회 및 SSE 구독                            |
| `pointHistoryApi.ts` | 포인트 내역 조회                                 |
| `userApi.ts`         | 유저 정보 조회·수정                              |
| `withdrawApi.ts`     | 회원 탈퇴                                        |

---

## 🔧 client.ts — Axios 인스턴스

앱 전체에서 사용하는 **공용 HTTP 클라이언트**  
모든 API 파일은 이 `client`를 import해 사용함

```ts
const client = axios.create({
  baseURL: IS_PRODUCTION ? PROD_URL : DEV_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

### 인터셉터 구성

| 구분          | 📬 Request Interceptor (요청 인터셉터)                            | 📨 Response Interceptor (응답 인터셉터)                                                                                     |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **실행 시점** | 요청을 서버로 보내기 **직전**                                     | 서버 응답이 **돌아왔을 때**                                                                                                 |
| **주요 역할** | AsyncStorage에서 Access Token 꺼내 Authorization 헤더에 자동 첨부 | 성공 응답은 그대로 반환, 실패 응답은 토큰 갱신 로직 실행                                                                    |
| **예외 처리** | `/api/auth/refresh` 요청은 헤더 첨부 생략                         | `_retry` 플래그로 무한루프 방지, `isRefreshing` 플래그로 중복 요청 방지                                                     |
| **성공 시**   | 헤더가 추가된 요청을 서버로 전송                                  | 응답 그대로 반환                                                                                                            |
| **실패 시**   | —                                                                 | Refresh Token으로 새 Access Token 재발급 후 원래 요청 재시도, 재발급 실패 시 AsyncStorage 전체 삭제 후 로그인 화면으로 이동 |
| **DEV 로그**  | 요청 URL, 파라미터, 데이터 출력                                   | 응답 데이터 출력                                                                                                            |

```
요청 흐름:
화면에서 API 호출
    ↓
Request Interceptor 실행
    ↓ AsyncStorage에서 토큰 꺼냄
    ↓ Authorization: Bearer <token> 헤더 추가
    ↓
서버로 전송
    ↓
Response Interceptor 실행
    ↓ 성공(2xx) → 응답 그대로 반환
    ↓ 실패(401/403) → 토큰 갱신 시도 → 원래 요청 재시도
```

### ⚠️ 무한루프 방지 메커니즘

```ts
let isRefreshing = false;    // 이미 재발급 중이면 추가 시도 안 함
_retry?: boolean             // 같은 요청이 두 번 재시도 안 하도록
```

---

## 🔑 authApi.ts — 인증 API

### `loginWithProvider(provider, loginData)`

- 소셜 로그인 API 호출 (`POST /api/auth/login/{provider}`)
- provider: `google` | `kakao` | `naver` | `apple`
- 응답으로 `accessToken`, `refreshToken`, `userInfo` 받음

### `refreshToken(refreshTokenValue)`

- 만료된 Access Token 갱신 (`POST /api/auth/refresh`)
- `client.ts` 인터셉터에서 자동 호출됨 (수동 호출 거의 없음)

### `logoutFromServer(userId)`

- 서버 측 세션/토큰 무효화 (`POST /api/auth/logout`)
- 클라이언트 로컬 데이터 삭제는 `authService.logout()`에서 처리

---

## 📌 핵심 원칙

> **api/ 폴더는 HTTP 통신만 담당함**  
> 비즈니스 로직(토큰 저장, 상태 업데이트 등)은 `services/`나 `hooks/`에서 처리

```
❌ 잘못된 예: api 파일 안에서 AsyncStorage 직접 저장
✅ 올바른 예: api 파일은 응답 데이터만 return, 저장은 service에서
```

---

## 🔗 의존 관계

```
screens / hooks
    ↓
hooks (React Query)
    ↓
api/ ← 여기
    ↓
서버 (백엔드)
```
