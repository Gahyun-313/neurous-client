# ⚙️ services/ — 비즈니스 로직 레이어

> 이 폴더는 **API 호출 결과를 받아서 실제 처리하는 로직**을 담당해요.
> "데이터를 어디에 저장할지, 어떤 순서로 처리할지"를 결정하는 곳이에요.

---

## 📁 파일 구성

| 파일 | 역할 |
|------|------|
| `authService.ts` | 인증 상태 확인, 토큰 저장/조회, 로그아웃, 회원탈퇴 |
| `authStorageService.ts` | 최근 로그인 정보 AsyncStorage 저장/조회 |
| `socialLoginService.ts` | Google/Kakao/Naver/Apple 소셜 로그인 SDK 연동 |
| `onboardingService.ts` | 온보딩 상태 AsyncStorage 저장/조회 |
| `analyticsService.ts` | 앱 분석 이벤트 트래킹 |

---

## 🔐 authService.ts — 인증 서비스 (핵심)

### 책임
- AsyncStorage에 토큰/유저 정보 저장·조회·삭제
- 로그아웃 시 서버 로그아웃 → 소셜 로그아웃 → 로컬 삭제 순서 처리
- 회원 탈퇴 시 소셜 unlink + 서버 탈퇴 + 로컬 삭제

### AsyncStorage 키 구조

```
@auth_token       ← Access Token (JWT)
@refresh_token    ← Refresh Token
@user_info        ← { userId, name, email, profileImage, provider, ... }
```

### `logout()` 흐름

```
1. getUserInfo()로 userId, provider 파악
     ↓
2. logoutFromServer(userId) — 서버에 로그아웃 요청
   (실패해도 계속 진행 — 서버 문제로 앱이 막히면 안 됨)
     ↓
3. signOutSocial(provider) — 소셜 SDK 로그아웃
     ↓
4. AsyncStorage.multiRemove([토큰들]) — 로컬 데이터 삭제
```

> 💡 **핵심 설계:** 서버 로그아웃이 실패해도 로컬 로그아웃은 반드시 진행됨
> 사용자가 앱에 갇히는 상황을 방지!

### `withdraw()` 흐름 (회원탈퇴)

```
1. getUserInfo()로 userId, provider, providerAccessToken 파악
     ↓
2. 소셜별로 최신 token 재획득 시도 (Google: signInSilently → getTokens)
     ↓
3. withdrawUser(userId, { unlinkSocial: true, providerAccessToken }) — 서버 탈퇴
     ↓
4. signOutSocial(provider) — 소셜 SDK 로그아웃
     ↓
5. AsyncStorage.multiRemove([토큰들])
```

---

## 📱 socialLoginService.ts — 소셜 로그인

각 소셜 플랫폼의 SDK를 래핑해서 **통일된 인터페이스**로 제공해요.

```ts
type SocialLoginProvider = 'GOOGLE' | 'KAKAO' | 'NAVER' | 'APPLE';
```

| 제공자 | SDK | 특이사항 |
|--------|-----|---------|
| Google | `@react-native-google-signin/google-signin` | iOS ATT 권한 필요 |
| Kakao | `@react-native-seoul/kakao-login` | 카카오 앱 연동 |
| Naver | `@react-native-seoul/naver-login` | 네이버 앱 연동 |
| Apple | `@invertase/react-native-apple-authentication` | iOS 전용, authorizationCode 필요 |

### 로그인 흐름

```
socialLoginService.signIn(provider)
    ↓  소셜 SDK로 소셜 액세스 토큰 획득
authApi.loginWithProvider(provider, { accessToken })
    ↓  서버에 소셜 토큰 전달 → 우리 서버 JWT 발급
authService.saveAuthToken(accessToken)
authService.saveRefreshToken(refreshToken)
authService.saveUserInfo(userInfo)
    ↓
onboardingStore.completeOnboarding() or setStep()
```

---

## 📋 onboardingService.ts — 온보딩 서비스

> AsyncStorage에 온보딩 진행 상태를 저장하는 서비스

```
@onboarding_completed   ← 'true' / 'false'
@onboarding_step        ← 'login' | 'interests' | 'difficulty' | 'completed'
@user_interests         ← JSON (관심사 데이터)
@user_difficulty        ← 'EASY' | 'MEDIUM' | 'HARD'
```

### Store-Service 분리 패턴

```ts
// ✅ Store는 Service에 위임만 하고, 결과를 state에 반영
completeOnboarding: async () => {
  await completeOnboardingService();  // ← Service가 AsyncStorage 처리
  set({ isOnboardingCompleted: true }); // ← Store는 메모리 상태만 관리
}
```

> 💡 **왜 분리하나요?**
> 나중에 저장 방식이 바뀌어도 (AsyncStorage → 서버 API)
> `onboardingService.ts`만 수정하면 Store와 화면은 손댈 필요 없어요!

---

## 🔗 의존 관계

```
screens / hooks
    ↓
store (Zustand)
    ↓ 비즈니스 로직 위임
services/ ← 여기
    ↓ HTTP 통신 필요 시
api/
    ↓
서버
```

---

## 📌 핵심 원칙

> `services/`는 **"어떻게 처리할지"**를 담당
> `api/`는 **"서버와 통신하기"**만 담당
> `store/`는 **"결과를 메모리에 보관"**만 담당

각 레이어의 책임을 명확히 분리해야 나중에 수정할 때 파급 효과가 최소화돼요.
