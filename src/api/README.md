# 📡 api/ — 백엔드 통신 레이어

> 이 폴더는 **서버와 직접 통신하는 함수들**만 모아둔 곳이에요.
> 화면이나 비즈니스 로직은 여기서 관심 없고, 오직 "HTTP 요청 보내고 응답 받기"만 담당합니다.

---

## 📁 파일 구성

| 파일 | 역할 |
|------|------|
| `client.ts` | Axios 인스턴스 + 인터셉터 설정 (모든 API의 기반) |
| `authApi.ts` | 로그인 / 토큰 갱신 / 로그아웃 |
| `characterApi.ts` | 캐릭터 정보 조회 및 리워드 |
| `contentApi.ts` | 아티클/콘텐츠 목록·상세 조회 |
| `missionApi.ts` | 미션 목록 및 완료 처리 |
| `notificationApi.ts` | 알림 조회 및 SSE 구독 |
| `pointHistoryApi.ts` | 포인트 내역 조회 |
| `userApi.ts` | 유저 정보 조회·수정 |
| `withdrawApi.ts` | 회원 탈퇴 |

---

## 🔧 client.ts — Axios 인스턴스

앱 전체에서 사용하는 **공용 HTTP 클라이언트**예요. 모든 API 파일은 이 `client`를 import해서 씁니다.

```ts
const client = axios.create({
  baseURL: IS_PRODUCTION ? PROD_URL : DEV_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

### 📬 Request Interceptor (요청 인터셉터)

> **요청을 서버로 보내기 직전에** 자동으로 실행되는 코드

- `AsyncStorage`에서 Access Token 꺼내서 **Authorization 헤더에 자동으로 첨부**
- `/api/auth/refresh` 요청일 때는 헤더 첨부 안 함 (토큰 없이 보내야 하니까)
- `__DEV__` 환경에서 요청 URL, 파라미터, 데이터 콘솔 로그 출력

```
요청 흐름:
화면에서 API 호출
    ↓
Request Interceptor 실행
    ↓ AsyncStorage에서 토큰 꺼냄
    ↓ Authorization: Bearer <token> 헤더 추가
    ↓
서버로 전송
```

### 📨 Response Interceptor (응답 인터셉터)

> **서버 응답이 돌아왔을 때** 자동으로 실행되는 코드

**✅ 성공 (2xx):** 그냥 응답 반환 + DEV 모드에서 로그 출력

**❌ 실패 (401/403):** Access Token 만료 → 자동 갱신 로직 실행

```
401/403 에러 발생
    ↓
_retry 플래그 확인 (무한루프 방지)
    ↓
isRefreshing 플래그 확인 (중복 요청 방지)
    ↓
Refresh Token으로 새 Access Token 발급 요청
    ↓
성공 → 새 토큰 저장 → 원래 요청 재시도
실패 → AsyncStorage 전체 삭제 → 로그인 화면으로
```

### ⚠️ 무한루프 방지 메커니즘

```ts
let isRefreshing = false;    // 이미 재발급 중이면 추가 시도 안 함
_retry?: boolean             // 같은 요청이 두 번 재시도 안 하도록
```

> 💡 **비유:** 편의점 카드 결제 실패 → 직원이 단말기 재시작(토큰 갱신) → 다시 결제 시도.
> 그런데 재시작 중에 다른 손님도 결제 시도하면? → "잠깐만요" 하고 대기시킴 (isRefreshing)

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

> **api/ 폴더는 HTTP 통신만 담당한다.**
> 비즈니스 로직(토큰 저장, 상태 업데이트 등)은 `services/`나 `hooks/`에서 처리.

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
