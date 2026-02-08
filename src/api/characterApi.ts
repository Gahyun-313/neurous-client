/**
 * 캐릭터 관련 API 함수
 */

import { useExperienceStore } from '../store/experienceStore';
import client from './client';
import { getUserInfo } from '../services/authService';

/**
 * 레벨 기준 정보 타입
 */
export interface LevelStandard {
  characterLevel: string;
  characterName: string;
  characterImgUrl: string;
  exp: number;
  lv1Message: string;
}

/**
 * 캐릭터 레벨 API 응답 타입
 */
export interface CharacterLevelResponse {
  currentUserExp: number;
  characterLevel: string; // "LEVEL_1", "LEVEL_2", etc.
  levelStandard: LevelStandard[];
}

/**
 * 캐릭터 정보 타입 (화면에서 사용)
 */
export interface CharacterData {
  currentLevel: number;
  currentExp: number;
  nextLevelExp: number;
  levelStandard?: LevelStandard[];
}

/**
 * 출석 기록 타입
 */
export interface AttendanceData {
  day: string;
  attended: boolean;
}

/**
 * 유저 성장 정보 타입
 */
export interface UserGrowthInfo {
  levelName: string;
  levelEnum: string;
  characterVideoUrl: string;
  progressPercent: number;
  currentExp: number;
  currentPoint: number;
  showLevelUpModal: boolean;
}

/**
 * 주간 출석 현황 타입
 */
export interface WeeklyAttendance {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

/**
 * 미션 정보 타입 (통합 API용)
 */
export interface CharacterMission {
  missionType: string;
  title: string;
  currentProgress: number;
  targetGoal: number;
  isCompleted: boolean;
  isLocked: boolean;
}

/**
 * 캐릭터 통합 정보 API 응답 타입
 */
export interface CharacterMeResponse {
  status: number;
  message?: string;
  data: {
    userGrowthInfo: UserGrowthInfo;
    attendance: WeeklyAttendance;
    missions: CharacterMission[];
  };
}

/**
 * 포인트/경험치 정보 타입
 */
export interface AboutPointExpInformation {
  rewardType: string;
  description: string;
}

/**
 * 리워드 데이터 응답 타입
 */
export interface RewardDataResponse {
  rewardItem: string;
  exp: number;
  point: number;
}

/**
 * 캐릭터 리워드 정보 응답 타입
 */
export interface CharacterRewardResponse {
  aboutPointExpInformation: AboutPointExpInformation;
  rewardDataResponse: RewardDataResponse;
}

/**
 * 레벨 문자열을 숫자로 변환 (예: "LEVEL_1" -> 1)
 */
const parseLevelNumber = (levelString: string | undefined): number => {
  if (!levelString) {
    return 1;
  }
  const match = levelString.match(/LEVEL_(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * 캐릭터 레벨 정보 조회
 * @returns Promise<CharacterLevelResponse>
 */
export const fetchCharacterLevel =
  async (): Promise<CharacterLevelResponse> => {
    try {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('사용자 정보가 없습니다');
      }

      const response = await client.get<any>(
        `/api/characters/standards/level?userId=${userInfo.userId}`,
      );

      // data 래퍼가 있는 경우 처리
      const responseData = response.data?.data || response.data;

      if (!responseData) {
        throw new Error('응답 데이터가 없습니다');
      }

      return responseData as CharacterLevelResponse;
    } catch (error) {
      throw error;
    }
  };

/**
 * 캐릭터 정보 조회 (레벨 API 응답을 CharacterData로 변환)
 * @returns Promise<CharacterData>
 */
export const fetchCharacterData = async (): Promise<CharacterData> => {
  try {
    const levelResponse = await fetchCharacterLevel();

    if (!levelResponse.characterLevel) {
      throw new Error('레벨 정보가 없습니다');
    }

    const currentLevel = parseLevelNumber(levelResponse.characterLevel);
    const currentExp = levelResponse.currentUserExp ?? 0;

    // levelStandard 배열을 역순으로 순회하여 currentUserExp를 포함하는 레벨 찾기
    const levelStandardArray = levelResponse.levelStandard || [];
    let currentLevelStandard: LevelStandard | null = null;

    // 역순으로 순회 (높은 레벨부터)
    for (let i = levelStandardArray.length - 1; i >= 0; i--) {
      const standard = levelStandardArray[i];
      if (currentExp >= standard.exp) {
        currentLevelStandard = standard;
        break;
      }
    }

    // 다음 레벨 찾기
    const currentLevelIndex = currentLevelStandard
      ? levelStandardArray.findIndex(
          std => std.characterLevel === currentLevelStandard!.characterLevel,
        )
      : -1;

    const nextLevelStandard =
      currentLevelIndex >= 0 &&
      currentLevelIndex < levelStandardArray.length - 1
        ? levelStandardArray[currentLevelIndex + 1]
        : null;

    const nextLevelExp =
      nextLevelStandard?.exp ?? currentLevelStandard?.exp ?? 100;

    return {
      currentLevel,
      currentExp,
      nextLevelExp,
      levelStandard: levelResponse.levelStandard,
    };
  } catch (error) {
    console.error('[캐릭터 정보 조회] 에러:', error);
    const { experience } = useExperienceStore.getState();
    return {
      currentLevel: 1,
      currentExp: experience ?? 0,
      nextLevelExp: 100,
    };
  }
};

/**
 * 캐릭터 리워드 정보 조회
 * @returns Promise<CharacterRewardResponse>
 */
export const fetchCharacterReward =
  async (): Promise<CharacterRewardResponse> => {
    try {
      const response = await client.get<CharacterRewardResponse>(
        '/api/characters/standards/reward',
      );
      return response.data;
    } catch (error) {
      console.error('[캐릭터 리워드 API] 에러:', error);
      throw error;
    }
  };

/**
 * 캐릭터 통합 정보 조회 (성장 정보, 출석, 미션)
 * @returns Promise<CharacterMeResponse>
 */
export const fetchCharacterMe = async (): Promise<CharacterMeResponse> => {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.userId) {
      throw new Error('사용자 정보가 없습니다');
    }

    const response = await client.get<CharacterMeResponse>(
      `/api/characters/me?userId=${userInfo.userId}`,
    );
    return response.data;
  } catch (error) {
    console.error('[캐릭터 통합 정보 API] 에러:', error);
    throw error;
  }
};

/**
 * CharacterMeResponse의 data를 추출하는 헬퍼 타입
 */
export type CharacterMeData = CharacterMeResponse['data'];

/**
 * WeeklyAttendance를 AttendanceData[]로 변환
 */
export const convertWeeklyAttendanceToAttendanceData = (
  weeklyAttendance: WeeklyAttendance,
): AttendanceData[] => {
  const days = [
    { key: 'monday', label: '월' },
    { key: 'tuesday', label: '화' },
    { key: 'wednesday', label: '수' },
    { key: 'thursday', label: '목' },
    { key: 'friday', label: '금' },
    { key: 'saturday', label: '토' },
    { key: 'sunday', label: '일' },
  ] as const;

  return days.map(day => ({
    day: day.label,
    attended: weeklyAttendance[day.key],
  }));
};

/**
 * CharacterMission을 Mission 형식으로 변환
 */
export const convertCharacterMissionToMission = (
  mission: CharacterMission,
  index: number,
): any => {
  return {
    id: index + 1,
    title: mission.title,
    current: mission.currentProgress,
    total: mission.targetGoal,
    status: mission.isCompleted ? '완료' : mission.isLocked ? null : '진행 중',
  };
};
