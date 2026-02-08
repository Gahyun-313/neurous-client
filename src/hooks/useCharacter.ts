/**
 * 캐릭터 관련 React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchCharacterData,
  fetchCharacterReward,
  fetchCharacterMe,
  convertWeeklyAttendanceToAttendanceData,
  convertCharacterMissionToMission,
  CharacterData,
  CharacterRewardResponse,
  CharacterMeResponse,
} from '../api/characterApi';

// Query Keys
export const characterKeys = {
  all: ['character'] as const,
  data: () => [...characterKeys.all, 'data'] as const,
  attendance: () => [...characterKeys.all, 'attendance'] as const,
  reward: () => [...characterKeys.all, 'reward'] as const,
  me: () => [...characterKeys.all, 'me'] as const,
};

/**
 * 캐릭터 정보 조회
 */
export const useCharacterData = () => {
  return useQuery<CharacterData>({
    queryKey: characterKeys.data(),
    queryFn: fetchCharacterData,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });
};

/**
 * 캐릭터 리워드 정보 조회
 */
export const useCharacterReward = () => {
  return useQuery<CharacterRewardResponse>({
    queryKey: characterKeys.reward(),
    queryFn: fetchCharacterReward,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });
};

/**
 * 캐릭터 통합 정보 조회 (성장 정보, 출석, 미션)
 */
export const useCharacterMe = () => {
  return useQuery<CharacterMeResponse>({
    queryKey: characterKeys.me(),
    queryFn: fetchCharacterMe,
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
  });
};

// 변환 함수 export
export {
  convertWeeklyAttendanceToAttendanceData,
  convertCharacterMissionToMission,
};
