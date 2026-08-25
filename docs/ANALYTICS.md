# 📈 Analytics

## 🎯 목적

Firebase Analytics와 Mixpanel을 이용해 사용자가 어떤 화면을 거쳐 학습하고 어디에서 이탈하거나 보상을 얻는지 확인할 수 있도록 이벤트를 구성했습니다. Firebase Analytics 이벤트는 화면·행동 단위로 직접 설계했고, Mixpanel의 이벤트는 디자인팀이 정의한 이벤트 명세를 기준으로 구현·연동했습니다.

## 🧩 이벤트 영역

| Area | Examples |
| --- | --- |
| Screen View | 화면 진입과 Modal·Popup 노출 |
| Onboarding | Intro 이동, 난이도·관심 분야 선택 |
| Article | 기사 진입, 읽기와 접근 방식 |
| Quiz | 문제 확인, 답안 선택, 결과와 보상 |
| Search | 검색어 입력, 결과 선택, 최근 검색어 |
| Character | 캐릭터 확인과 성장 관련 행동 |
| My Page | 프로필, 관심 분야, 읽은 글 이동 |
| Authentication | 제공자별 로그인 성공·실패 |
| Reward | 출석·기사·퀴즈·광고 등 보상 출처 |

## 🧭 설계 원칙

- 이벤트 이름과 속성 Key의 규칙을 통일합니다.
- 화면 이름은 Navigation Route와 매핑해 자동 기록을 우선합니다.
- Modal처럼 Navigation Route가 없는 UI는 수동 Screen View로 기록합니다.
- 보상 이벤트에는 `reward_source`를 포함해 획득 경로를 구분합니다.
- 개인정보나 인증 Token은 이벤트 속성에 포함하지 않습니다.

## ⚙️ 운영 고려

개발 중 Debug 이벤트로 전송 여부를 확인하고 Production에서는 동일한 이름과 속성을 유지합니다. 이벤트를 추가하거나 화면 이름을 변경할 때 문서와 분석 도구의 정의도 함께 갱신합니다.
