import {
  InterestCategory,
  InterestCategoryNames,
  LevelCategory,
} from '../types/interests';
import dayjs from 'dayjs';
import { MyPageContent, ReadArticlesByDate } from '../api/userApi';

/**
 * 난이도 -> 레벨 표시 텍스트 변환
 */
export const getLevelText = (difficulty: LevelCategory | null): string => {
  switch (difficulty) {
    case LevelCategory.BEGINNER:
      return '초급';
    case LevelCategory.INTERMEDIATE:
      return '중급';
    case LevelCategory.ADVANCED:
      return '고급';
    default:
      return '초급';
  }
};

/**
 * 카테고리 ID -> 한글 이름 매핑
 */
export const categoryNameMap: Record<string, string> = {
  [InterestCategory.POLITICS]: InterestCategoryNames[InterestCategory.POLITICS],
  [InterestCategory.ECONOMY]: InterestCategoryNames[InterestCategory.ECONOMY],
  [InterestCategory.SOCIETY]: InterestCategoryNames[InterestCategory.SOCIETY],
  [InterestCategory.LIFE_CULTURE]:
    InterestCategoryNames[InterestCategory.LIFE_CULTURE],
  [InterestCategory.IT_SCIENCE]:
    InterestCategoryNames[InterestCategory.IT_SCIENCE],
  [InterestCategory.WORLD]: InterestCategoryNames[InterestCategory.WORLD],
};

/**
 * 한글 이름 -> ENUM 값 매핑 (역변환)
 */
export const nameToCategoryMap: Record<string, InterestCategory> = {
  [InterestCategoryNames[InterestCategory.POLITICS]]: InterestCategory.POLITICS,
  [InterestCategoryNames[InterestCategory.ECONOMY]]: InterestCategory.ECONOMY,
  [InterestCategoryNames[InterestCategory.SOCIETY]]: InterestCategory.SOCIETY,
  [InterestCategoryNames[InterestCategory.LIFE_CULTURE]]:
    InterestCategory.LIFE_CULTURE,
  [InterestCategoryNames[InterestCategory.IT_SCIENCE]]:
    InterestCategory.IT_SCIENCE,
  [InterestCategoryNames[InterestCategory.WORLD]]: InterestCategory.WORLD,
};

/**
 * 날짜 포맷팅 (YYYY-MM-DD -> MM.DD 요일)
 */
export const formatArticleDate = (
  dateStr: string,
  dayOfWeek: string,
): string => {
  const [_year, month, day] = dateStr.split('-');
  return `${month}.${day} ${dayOfWeek}`;
};

/**
 * 주간 날짜 범위 계산
 */
export const calculateWeekRange = (selectedWeek: number): string => {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + selectedWeek * 7);

  const dayOfWeek = targetDate.getDay();
  const startDate = new Date(targetDate);
  startDate.setDate(targetDate.getDate() - dayOfWeek);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month.toString().padStart(2, '0')}.${day
      .toString()
      .padStart(2, '0')}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * 다음 주에 데이터가 있는지 확인
 * @param selectedWeek 선택된 주 (0 = 현재 주)
 * @param readArticles 읽은 글 목록 (ReadArticlesByDate[])
 */
export const hasNextWeekData = (
  selectedWeek: number,
  readArticles: ReadArticlesByDate[],
): boolean => {
  if (!readArticles || readArticles.length === 0) {
    return false;
  }

  const today = new Date();
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + (selectedWeek + 1) * 7);

  const dayOfWeek = nextWeekDate.getDay();
  const startDate = new Date(nextWeekDate);
  startDate.setDate(nextWeekDate.getDate() - dayOfWeek);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return readArticles.some(dateGroup => {
    const articleDate = new Date(dateGroup.date);
    return articleDate >= startDate && articleDate <= endDate;
  });
};

/**
 * MM.DD 형태의 날짜를 YYYY-MM-DD 형태로 변환
 * @param dateStr "12.28" 형태의 문자열
 * @returns "YYYY-MM-DD" 형태의 문자열
 */
export const convertToYYYYMMDD = (dateStr: string): string => {
  const [month, day] = dateStr.split('.');
  const currentYear = dayjs().year();
  // 현재 날짜를 기준으로 연도 결정 (12월이면 내년일 수도 있음)
  const date = dayjs(`${currentYear}-${month}-${day}`);
  // 만약 날짜가 미래라면 올해, 과거라면 내년으로 간주
  const year = date.isAfter(dayjs()) ? currentYear - 1 : currentYear;
  return dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD');
};

/**
 * 요일 이름을 한글로 변환
 */
const getDayOfWeek = (date: Date): string => {
  const days = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ];
  return days[date.getDay()];
};

/**
 * MyPageContent[]를 ReadArticlesByDate[] 형태로 변환
아마 수정 필요...
 */
export const convertMyPageContentsToReadArticles = (
  contents: MyPageContent[],
): ReadArticlesByDate[] => {
  if (!contents || contents.length === 0) {
    return [];
  }

  // 날짜별로 그룹화
  const groupedByDate = contents.reduce((acc, content) => {
    const readDate = dayjs(content.readAt).format('YYYY-MM-DD');
    if (!acc[readDate]) {
      acc[readDate] = [];
    }
    acc[readDate].push(content);
    return acc;
  }, {} as Record<string, MyPageContent[]>);

  // ReadArticlesByDate 형태로 변환
  return Object.entries(groupedByDate)
    .map(([date, articles]) => {
      const dateObj = new Date(date);
      return {
        date,
        dayOfWeek: getDayOfWeek(dateObj),
        count: articles.length,
        articles, // MyPageContent[] 그대로 사용
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신순 정렬
};
