/**
 * 캐릭터 관련 화면(레벨/내역/알림)에서 공통으로 쓰는 Mock 데이터
 * - 날짜는 ISO 8601 문자열 사용 (서버 연동 기준)
 */

export type LevelCriteria = {
  id: number;
  title: string; // 화면에 보여줄 레벨 이름
  requiredExp: number; // 해당 레벨 기준 누적 경험치
  summary: string; // 한 줄 설명
};

export type LevelDetail = {
  levelId: number;
  title: string;
  requiredExp: number;
  rewards: { label: string; xp: number; pt: number }[];
  tips: string[];
};

/**
 * 포인트 / 경험치 히스토리 아이템
 * createdAt은 반드시 ISO 8601 문자열
 */
export type PointHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  xpDelta: number;
  ptDelta: number;

  /** 트랜잭션 기준 묶음 키 */
  transactionId: string;
};

/* ================= 레벨 목록 ================= */

export const levelList: LevelCriteria[] = [
  {
    id: 1,
    title: 'Lv.1 아메바',
    requiredExp: 0,
    summary: '기본 미션으로 적응해요',
  },
  {
    id: 2,
    title: 'Lv.2 꼬물 물고기',
    requiredExp: 100,
    summary: '미션 보상이 조금 증가해요',
  },
  {
    id: 3,
    title: 'Lv.3 리틀 몽키',
    requiredExp: 500,
    summary: '연속 달성 보너스가 유리해요',
  },
  {
    id: 4,
    title: 'Lv.4 꼬마 원시인',
    requiredExp: 2000,
    summary: '고급 미션이 해금돼요',
  },
  {
    id: 5,
    title: 'Lv.5 아인슈타인',
    requiredExp: 6000,
    summary: '고급 미션이 해금돼요',
  },
];

/* ================= 레벨 상세 ================= */

export const levelDetailMap: Record<number, LevelDetail> = {
  1: {
    levelId: 1,
    title: 'Lv.1 아메바',
    requiredExp: 0,
    rewards: [
      { label: '기사 읽기(10초+)', xp: 40, pt: 0 },
      { label: '미션 완료', xp: 30, pt: 10 },
      { label: '광고 시청', xp: 10, pt: 3 },
    ],
    tips: ['하루 1개 기사부터 꾸준히', '연속 달성 시 보너스가 붙을 수 있어요'],
  },
  2: {
    levelId: 2,
    title: 'Lv.2 꼬물 물고기',
    requiredExp: 100,
    rewards: [
      { label: '기사 읽기(10초+)', xp: 50, pt: 0 },
      { label: '미션 완료', xp: 40, pt: 12 },
      { label: '광고 시청', xp: 12, pt: 4 },
    ],
    tips: ['난이도 2 미션 도전 추천', '관심분야를 설정하면 피드가 더 좋아져요'],
  },
  3: {
    levelId: 3,
    title: 'Lv.3 리틀 몽키',
    requiredExp: 500,
    rewards: [
      { label: '기사 읽기(10초+)', xp: 60, pt: 0 },
      { label: '미션 완료', xp: 50, pt: 15 },
      { label: '광고 시청', xp: 15, pt: 5 },
    ],
    tips: ['요약 퀴즈에 집중하면 성장 빨라요', '연속 달성 유지가 중요해요'],
  },
  4: {
    levelId: 4,
    title: 'Lv.4 꼬마 원시인',
    requiredExp: 2000,
    rewards: [
      { label: '기사 읽기(10초+)', xp: 70, pt: 0 },
      { label: '미션 완료', xp: 60, pt: 20 },
      { label: '광고 시청', xp: 18, pt: 6 },
    ],
    tips: ['고급 미션 위주로 플레이', '스트릭 유지로 보너스를 챙기세요'],
  },
  5: {
    levelId: 5,
    title: 'Lv.5 아인슈타인',
    requiredExp: 6000,
    rewards: [
      { label: '기사 읽기(10초+)', xp: 80, pt: 0 },
      { label: '미션 완료', xp: 70, pt: 25 },
      { label: '광고 시청', xp: 20, pt: 7 },
    ],
    tips: ['고급 미션 위주로 플레이', '스트릭 유지로 보너스를 챙기세요'],
  },
};

/* ================= 포인트 / 경험치 히스토리 ================= */
/**
 * 같은 transactionId = 같은 트랜잭션
 * → 화면에서는 날짜가 아니라 "트랜잭션 기준"으로 묶을 수 있음
 */

export const pointHistoryMock: PointHistoryItem[] = [
  {
    id: 'h1',
    title: '글 읽기',
    createdAt: '2025-12-08T09:00:00Z',
    xpDelta: 5,
    ptDelta: 0,
    transactionId: 'tx-2025-12-08-001',
  },
  {
    id: 'h2',
    title: '퀴즈(정답)',
    createdAt: '2025-12-08T09:02:00Z',
    xpDelta: 20,
    ptDelta: 30,
    transactionId: 'tx-2025-12-08-001',
  },

  {
    id: 'h5',
    title: '글 읽기',
    createdAt: '2025-12-04T09:00:00Z',
    xpDelta: 5,
    ptDelta: 0,
    transactionId: 'tx-2025-12-04-001',
  },
  {
    id: 'h6',
    title: '퀴즈 오답',
    createdAt: '2025-12-04T09:20:00Z',
    xpDelta: 10,
    ptDelta: 10,
    transactionId: 'tx-2025-12-04-001',
  },
  {
    id: 'h7',
    title: '데일리 출석',
    createdAt: '2025-12-04T09:00:00Z',
    xpDelta: 5,
    ptDelta: 10,
    transactionId: 'tx-2025-12-04-002',
  },
  {
    id: 'h8',
    title: '위클리 출석',
    createdAt: '2025-12-04T09:20:00Z',
    xpDelta: 30,
    ptDelta: 30,
    transactionId: 'tx-2025-12-04-002',
  },
  {
    id: 'h9',
    title: '단일 테스트',
    createdAt: '2025-12-27T09:20:00Z',
    xpDelta: 100,
    ptDelta: 100,
    transactionId: 'tx-2025-12-27-001',
  },
];
