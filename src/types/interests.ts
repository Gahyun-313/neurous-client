/**
 * 관심분야 ENUM
 */
export enum InterestCategory {
  POLITICS = 'POLITICS',
  ECONOMY = 'ECONOMY',
  SOCIETY = 'SOCIETY',
  LIFE_CULTURE = 'LIFE_CULTURE',
  IT_SCIENCE = 'IT_SCIENCE',
  WORLD = 'WORLD',
}
export enum LevelCategory {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

/**
 * 관심분야 한글 이름 매핑
 */
export const InterestCategoryNames: Record<InterestCategory, string> = {
  [InterestCategory.POLITICS]: '정치',
  [InterestCategory.ECONOMY]: '경제',
  [InterestCategory.SOCIETY]: '사회',
  [InterestCategory.LIFE_CULTURE]: '생활/문화',
  [InterestCategory.IT_SCIENCE]: 'IT/과학',
  [InterestCategory.WORLD]: '세계',
};
export const LevelCategoryNames: Record<LevelCategory, string> = {
  [LevelCategory.BEGINNER]: '초급',
  [LevelCategory.INTERMEDIATE]: '중급',
  [LevelCategory.ADVANCED]: '고급',
};

/**
 * 관심분야 인터페이스
 */
export interface Interest {
  id: InterestCategory;
  name: string;
}

/**
 * 관심분야 목록
 */
export const INTERESTS: Interest[] = [
  {
    id: InterestCategory.POLITICS,
    name: InterestCategoryNames[InterestCategory.POLITICS],
  },
  {
    id: InterestCategory.ECONOMY,
    name: InterestCategoryNames[InterestCategory.ECONOMY],
  },
  {
    id: InterestCategory.SOCIETY,
    name: InterestCategoryNames[InterestCategory.SOCIETY],
  },
  {
    id: InterestCategory.LIFE_CULTURE,
    name: InterestCategoryNames[InterestCategory.LIFE_CULTURE],
  },
  {
    id: InterestCategory.IT_SCIENCE,
    name: InterestCategoryNames[InterestCategory.IT_SCIENCE],
  },
  {
    id: InterestCategory.WORLD,
    name: InterestCategoryNames[InterestCategory.WORLD],
  },
];
