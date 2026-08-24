/**
 * 캐릭터 관련 API 모듈
 *
 * 캐릭터 레벨/경험치 조회, 리워드 정보, 출석 및 미션 통합 정보 등
 * 캐릭터 화면에 필요한 모든 서버 API 호출 함수 정의
 *
 * [포함된 기능]
 * - fetchCharacterLevel  : 레벨 기준 및 현재 경험치 조회
 * - fetchCharacterData   : 레벨 응답을 화면용 CharacterData로 변환
 * - fetchCharacterReward : 포인트/경험치 리워드 정보 조회
 * - fetchCharacterMe     : 성장 정보 + 출석 + 미션 통합 조회
 */

import { useExperienceStore } from '../store/experienceStore';
import client from './client';
import { getUserInfo } from '../services/authService';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 레벨 기준 정보 타입
 *
 * 서버에서 내려주는 각 레벨의 기준 데이터.
 * levelStandard 배열의 요소로 사용됨.
 *
 * @property characterLevel  레벨 식별자 (예: "LEVEL_1", "LEVEL_2")
 * @property characterName   해당 레벨의 캐릭터 이름
 * @property characterImgUrl 캐릭터 이미지 URL
 * @property exp             해당 레벨 도달에 필요한 최소 경험치
 * @property lv1Message      레벨 달성 시 표시되는 메시지
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
 *
 * GET /api/characters/standards/level 응답 구조
 *
 * @property currentUserExp  현재 유저의 누적 경험치
 * @property characterLevel  현재 레벨 식별자 (예: "LEVEL_1")
 * @property levelStandard   전체 레벨 기준 배열 (오름차순)
 */
export interface CharacterLevelResponse {
  currentUserExp: number;
  characterLevel: string;
  levelStandard: LevelStandard[];
}

/**
 * 캐릭터 정보 타입 (화면에서 사용)
 *
 * fetchCharacterLevel 응답을 가공해 화면에서 바로 쓸 수 있도록 변환한 타입.
 * fetchCharacterData 함수가 이 형태로 반환함.
 *
 * @property currentLevel   현재 레벨 숫자 (예: 1, 2, 3)
 * @property currentExp     현재 누적 경험치
 * @property nextLevelExp   다음 레벨까지 필요한 경험치 기준값
 * @property levelStandard  전체 레벨 기준 배열 (경험치 바 계산 등에 활용)
 */
export interface CharacterData {
  currentLevel: number;
  currentExp: number;
  nextLevelExp: number;
  levelStandard?: LevelStandard[];
}

/**
 * 출석 기록 타입
 *
 * WeeklyAttendance를 화면용으로 변환한 형태.
 * convertWeeklyAttendanceToAttendanceData 함수가 이 배열을 반환함.
 *
 * @property day      요일 한글 표기 (예: "월", "화")
 * @property attended 해당 요일 출석 여부
 */
export interface AttendanceData {
  day: string;
  attended: boolean;
}

/**
 * 유저 성장 정보 타입
 *
 * CharacterMeResponse.data.userGrowthInfo 의 구조.
 *
 * @property levelName        현재 레벨 이름 (예: "새싹")
 * @property levelEnum        레벨 식별자 (예: "LEVEL_1")
 * @property characterVideoUrl 캐릭터 애니메이션 영상 URL
 * @property progressPercent  현재 레벨 내 경험치 진행률 (0~100)
 * @property currentExp       현재 누적 경험치
 * @property currentPoint     현재 보유 포인트
 * @property showLevelUpModal 레벨업 모달 표시 여부
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
 *
 * CharacterMeResponse.data.attendance 의 구조.
 * 각 필드는 해당 요일의 출석 여부를 나타냄.
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
 *
 * CharacterMeResponse.data.missions 배열의 요소 구조.
 *
 * @property missionType     미션 식별 타입 (예: "READ_ARTICLE")
 * @property title           미션 제목
 * @property currentProgress 현재 진행 수치
 * @property targetGoal      목표 수치
 * @property isCompleted     완료 여부
 * @property isLocked        잠김 여부 (전 단계 미션 미완료 시 true)
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
 *
 * GET /api/characters/me 응답 구조.
 * 성장 정보, 주간 출석, 미션 목록을 한 번에 반환함.
 *
 * @property status           HTTP 상태 코드
 * @property message          에러 메시지 (선택)
 * @property data.userGrowthInfo 유저 성장 정보
 * @property data.attendance     주간 출석 현황
 * @property data.missions       미션 목록
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
 *
 * @property rewardType   리워드 타입 식별자 (예: "READ_ARTICLE")
 * @property description  해당 리워드 설명 문구
 */
export interface AboutPointExpInformation {
  rewardType: string;
  description: string;
}

/**
 * 리워드 데이터 응답 타입
 *
 * @property rewardItem  리워드 아이템 식별자
 * @property exp         획득 경험치
 * @property point       획득 포인트
 */
export interface RewardDataResponse {
  rewardItem: string;
  exp: number;
  point: number;
}

/**
 * 캐릭터 리워드 정보 응답 타입
 *
 * GET /api/characters/standards/reward 응답 구조.
 *
 * @property aboutPointExpInformation 포인트/경험치 안내 정보
 * @property rewardDataResponse       실제 리워드 수치 데이터
 */
export interface CharacterRewardResponse {
  aboutPointExpInformation: AboutPointExpInformation;
  rewardDataResponse: RewardDataResponse;
}

// ─────────────────────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────────────────────

/**
 * 레벨 문자열을 숫자로 변환
 *
 * 서버에서 레벨을 "LEVEL_1", "LEVEL_2" 형태로 내려줌.
 * 화면에서 숫자로 사용해야 할 때 이 함수로 변환.
 *
 * @param levelString  변환할 레벨 문자열 (예: "LEVEL_3")
 * @returns            레벨 숫자 (예: 3), 파싱 실패 시 기본값 1 반환
 *
 * @example
 * parseLevelNumber("LEVEL_3") // → 3
 * parseLevelNumber(undefined) // → 1
 */
const parseLevelNumber = (levelString: string | undefined): number => {
  if (!levelString) {
    return 1; // 레벨 정보 없으면 최소 레벨(1)로 처리
  }
  const match = levelString.match(/LEVEL_(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

// ─────────────────────────────────────────────────────────────
// API 함수
// ─────────────────────────────────────────────────────────────

/**
 * 캐릭터 레벨 정보 조회
 *
 * [엔드포인트] GET /api/characters/standards/level?userId={userId}
 *
 * [처리 순서]
 * 1. AsyncStorage에서 유저 정보(userId) 조회
 * 2. userId를 query string으로 서버에 전송
 * 3. 서버 응답의 data 래퍼 유무에 따라 구조 분기 처리
 *
 * @returns 현재 경험치, 레벨 식별자, 전체 레벨 기준 배열
 * @throws  유저 정보 없음 / 응답 데이터 없음 / 네트워크 오류 시 에러
 */
export const fetchCharacterLevel =
  async (): Promise<CharacterLevelResponse> => {
    try {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('사용자 정보가 없음');
      }

      const response = await client.get<any>(
        `/api/characters/standards/level?userId=${userInfo.userId}`,
      );

      // 서버 응답이 { data: {...} } 래퍼 형태로 올 수도 있어 분기 처리
      const responseData = response.data?.data || response.data;

      if (!responseData) {
        throw new Error('응답 데이터가 없음');
      }

      return responseData as CharacterLevelResponse;
    } catch (error) {
      throw error;
    }
  };

/**
 * 캐릭터 정보 조회 (화면용 데이터로 가공)
 *
 * [엔드포인트] fetchCharacterLevel 내부 호출
 *
 * fetchCharacterLevel 응답을 화면에서 바로 쓸 수 있는
 * CharacterData 형태로 변환해 반환함.
 *
 * [처리 순서]
 * 1. fetchCharacterLevel로 서버 원본 데이터 조회
 * 2. levelStandard 배열을 역순 순회해 현재 경험치에 해당하는 레벨 탐색
 * 3. 다음 레벨 기준 경험치(nextLevelExp) 계산
 * 4. 에러 발생 시 experienceStore의 로컬 값으로 fallback 처리
 *
 * @returns 현재 레벨, 현재 경험치, 다음 레벨 기준 경험치, 레벨 기준 배열
 */
export const fetchCharacterData = async (): Promise<CharacterData> => {
  try {
    const levelResponse = await fetchCharacterLevel();

    if (!levelResponse.characterLevel) {
      throw new Error('레벨 정보가 없음');
    }

    const currentLevel = parseLevelNumber(levelResponse.characterLevel);
    const currentExp = levelResponse.currentUserExp ?? 0;

    const levelStandardArray = levelResponse.levelStandard || [];
    let currentLevelStandard: LevelStandard | null = null;

    // 역순 순회(높은 레벨부터): currentExp가 처음으로 >= exp를 만족하는 레벨이 현재 레벨
    for (let i = levelStandardArray.length - 1; i >= 0; i--) {
      const standard = levelStandardArray[i];
      if (currentExp >= standard.exp) {
        currentLevelStandard = standard;
        break;
      }
    }

    // 현재 레벨의 index를 찾아 바로 다음 index가 다음 레벨 기준이 됨
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

    // 다음 레벨이 없으면(최고 레벨) 현재 기준값 유지, 그것도 없으면 기본값 100
    const nextLevelExp =
      nextLevelStandard?.exp ?? currentLevelStandard?.exp ?? 100;

    return {
      currentLevel,
      currentExp,
      nextLevelExp,
      levelStandard: levelResponse.levelStandard,
    };
  } catch (error) {
    // API 실패 시 experienceStore에 저장된 로컬 경험치로 fallback
    // (서버 오류 시에도 화면이 완전히 깨지지 않도록 방어 처리)
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
 *
 * [엔드포인트] GET /api/characters/standards/reward
 *
 * 각 행동(아티클 읽기 등)으로 획득하는 포인트/경험치 기준 정보를 조회함.
 *
 * @returns 리워드 안내 정보 및 수치 데이터
 * @throws  네트워크 오류 또는 서버 에러 시 에러
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
 * 캐릭터 통합 정보 조회 (성장 정보 + 출석 + 미션)
 *
 * [엔드포인트] GET /api/characters/me?userId={userId}
 *
 * 캐릭터 화면에 필요한 데이터를 단일 API로 한 번에 가져옴.
 * 개별 API를 여러 번 호출하는 대신 이 함수 하나로 처리.
 *
 * @returns 유저 성장 정보, 주간 출석 현황, 미션 목록
 * @throws  유저 정보 없음 / 네트워크 오류 시 에러
 */
export const fetchCharacterMe = async (): Promise<CharacterMeResponse> => {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.userId) {
      throw new Error('사용자 정보가 없음');
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

// ─────────────────────────────────────────────────────────────
// 유틸리티 타입 및 변환 함수
// ─────────────────────────────────────────────────────────────

/**
 * CharacterMeResponse의 data 필드 타입 단축 별칭
 *
 * hooks나 화면에서 타입을 간결하게 쓸 때 사용.
 *
 * @example
 * const data: CharacterMeData = response.data;
 */
export type CharacterMeData = CharacterMeResponse['data'];

/**
 * WeeklyAttendance → AttendanceData[] 변환
 *
 * 서버가 { monday: true, tuesday: false, ... } 형태로 내려주는 출석 데이터를
 * 화면에서 렌더링하기 편한 [{ day: "월", attended: true }, ...] 배열로 변환함.
 *
 * @param weeklyAttendance  서버 원본 주간 출석 데이터
 * @returns                 요일 한글 레이블 + 출석 여부 배열 (월~일 순서)
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
 * CharacterMission → Mission 형식 변환
 *
 * 통합 API에서 내려오는 CharacterMission을 미션 화면 컴포넌트가
 * 기대하는 형태로 변환함.
 *
 * @param mission  변환할 CharacterMission 객체
 * @param index    배열 내 인덱스 (id 생성에 사용됨: index + 1)
 * @returns        화면용 미션 객체
 *                 - status: "완료" | "진행 중" | null (잠김 상태)
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
    // isCompleted → "완료" / isLocked → null(잠김) / 그 외 → "진행 중"
    status: mission.isCompleted ? '완료' : mission.isLocked ? null : '진행 중',
  };
};
