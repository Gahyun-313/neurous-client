/**
 * 알림 아이템 타입
 */
export type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string; // 날짜 >> "12월 25일"
  isRead: boolean; // 읽었는지 여부 >> 안 읽은 알림 false (연보라 하이라이트 처리)
};

/**
 * 알림 더미 데이터 (최신이 위로 오게 정렬)
 */
export const notificationMock: NotificationItem[] = [
  {
    id: 'n-001',
    title: '오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '경제 분야의 글을 추천드려요',
    createdAt: '12월 25일',
    isRead: false,
  },
  {
    id: 'n-002',
    title: '24 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '24경제 분야의 글을 추천드려요',
    createdAt: '12월 24일',
    isRead: true,
  },
  {
    id: 'n-003',
    title: '23 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '23경제 분야의 글을 추천드려요',
    createdAt: '12월 23일',
    isRead: false,
  },
  {
    id: 'n-004',
    title: '22 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '22경제 분야의 글을 추천드려요',
    createdAt: '12월 22일',
    isRead: true,
  },
  {
    id: 'n-005',
    title: '22 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '22경제 분야의 글을 추천드려요',
    createdAt: '12월 22일',
    isRead: true,
  },
  {
    id: 'n-006',
    title: '22 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '22경제 분야의 글을 추천드려요',
    createdAt: '12월 22일',
    isRead: true,
  },
  {
    id: 'n-007',
    title: '22 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '22경제 분야의 글을 추천드려요',
    createdAt: '12월 22일',
    isRead: true,
  },
  {
    id: 'n-008',
    title: '22 오늘의 첫 글, 3분이면 충분해요. 가볍게 시작해볼까요?',
    subtitle: '22경제 분야의 글을 추천드려요',
    createdAt: '12월 22일',
    isRead: true,
  },
];
