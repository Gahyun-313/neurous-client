/**
 * 미션 관련 React Query 커스텀 훅 모음
 *
 * 오늘의 미션 목록 조회(useQuery)와
 * 미션 진행도 업데이트(useMutation)를 제공함.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMissionToday,
  convertMissionTodayToMission,
  updateMissionProgress,
  MissionContent,
} from '../api/missionApi';
import { getUserInfo } from '../services/authService';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

/**
 * 미션 관련 React Query 키 팩토리
 *
 * 계층 구조로 관리해 특정 범위만 선택적으로 무효화 가능.
 *
 * @example
 * // 미션 전체 쿼리 무효화
 * queryClient.invalidateQueries({ queryKey: missionKeys.all })
 *
 * // 미션 목록만 무효화
 * queryClient.invalidateQueries({ queryKey: missionKeys.lists() })
 *
 * // 특정 미션만 무효화
 * queryClient.invalidateQueries({ queryKey: missionKeys.detail(1) })
 */
export const missionKeys = {
  all: ['missions'] as const,
  lists: () => [...missionKeys.all, 'list'] as const,
  list: (filters: string) => [...missionKeys.lists(), { filters }] as const,
  details: () => [...missionKeys.all, 'detail'] as const,
  detail: (id: number) => [...missionKeys.details(), id] as const,
};

// ─────────────────────────────────────────────────────────────
// 훅
// ─────────────────────────────────────────────────────────────

/**
 * 오늘의 미션 목록 조회 훅
 *
 * fetchMissionToday 응답을 화면용 형태로 가공해 반환함.
 * - missions: convertMissionTodayToMission으로 변환된 화면용 미션 배열
 * - contents: 오늘의 추천 콘텐츠 배열 (MissionContent[])
 *
 * [캐시 설정]
 * staleTime: 5분 — 5분 이내 재요청 시 캐시 데이터 반환
 * gcTime:   10분 — 마지막 구독 해제 후 10분간 캐시 유지
 *
 * [refetch 설정]
 * refetchOnMount: true — 화면 진입 시마다 최신 미션 상태 반영
 */
export const useMissions = () => {
  return useQuery<{ missions: any[]; contents: MissionContent[] }, Error>({
    queryKey: missionKeys.lists(),
    queryFn: async () => {
      const userInfo = await getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error('사용자 정보가 없음');
      }

      const response = await fetchMissionToday(userInfo.userId);

      // 서버 응답의 missions 배열을 화면용 형태로 변환
      const missions = response.data.missions
        ? response.data.missions.map((mission, index) =>
            convertMissionTodayToMission(mission, index),
          )
        : [];

      const contents = response.data.contents || [];

      return { missions, contents };
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    enabled: true, // 항상 활성화
    refetchOnMount: true, // 마운트 시 항상 refetch (미션 진행 상태 최신화)
  });
};

/**
 * 미션 진행도 업데이트 Mutation 훅
 *
 * [처리 순서]
 * 1. updateMissionProgress API 호출
 * 2. 성공 시 관련 캐시 즉시 업데이트 (낙관적 업데이트는 아님)
 *    - 미션 목록 캐시: 해당 미션 항목 교체
 *    - 특정 미션 캐시: 최신 데이터로 교체
 * 3. 미션 목록 쿼리 무효화 → 서버에서 최신 데이터 재조회
 *
 * ⚠️ updateMissionProgress는 현재 미구현(Not implemented) 상태.
 *    API 구현 완료 후 정상 동작 예정.
 */
export const useUpdateMissionProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      missionId,
      current,
    }: {
      missionId: number;
      current: number;
    }) => updateMissionProgress(missionId, current),

    onSuccess: (data, variables) => {
      // 미션 목록 캐시에서 해당 미션 항목을 업데이트된 데이터로 교체
      queryClient.setQueryData<any[]>(missionKeys.lists(), old => {
        if (!old) {
          return [data];
        }
        return old.map(mission =>
          mission.id === variables.missionId ? data : mission,
        );
      });

      // 특정 미션 캐시도 최신 데이터로 교체
      queryClient.setQueryData(missionKeys.detail(variables.missionId), data);

      // 캐시 업데이트 후 서버에서 최신 목록 재조회 (정합성 보장)
      queryClient.invalidateQueries({ queryKey: missionKeys.lists() });
    },
  });
};
