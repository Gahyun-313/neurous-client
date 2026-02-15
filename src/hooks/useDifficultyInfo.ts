/**
 * 난이도 정보 조회 커스텀 훅
 *
 * 선택된 레벨(LevelCategory)에 따라 난이도 설명과
 * 읽기 시간 가이드를 서버에서 가져옴.
 *
 * level이 null이면 요청하지 않고 상태를 초기화함.
 * level이 변경될 때마다 자동으로 재요청함.
 */
import { useState, useEffect } from 'react';
import { fetchDifficultyInfo, DifficultyInfo } from '../api/userApi';
import { LevelCategory } from '../types/interests';

/**
 * 난이도 정보 조회 훅
 *
 * [동작 방식]
 * - level이 null → difficultyInfo를 null로 초기화하고 요청 안 함
 * - level이 변경 → 자동으로 해당 레벨의 난이도 정보 재조회
 *
 * ⚠️ React Query 대신 useState + useEffect를 사용함.
 *    난이도 정보는 온보딩 레벨 선택 화면에서만 쓰이는 일회성 데이터라
 *    전역 캐싱이 필요하지 않기 때문.
 *
 * @param level  조회할 레벨 (null이면 조회 안 함)
 * @returns      difficultyInfo — 조회된 난이도 정보 (없으면 null)
 *               isLoading      — 로딩 상태
 *               error          — 에러 객체 (없으면 null)
 */
export const useDifficultyInfo = (level: LevelCategory | null) => {
  const [difficultyInfo, setDifficultyInfo] = useState<DifficultyInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // level이 없으면 초기화하고 종료
    if (!level) {
      setDifficultyInfo(null);
      return;
    }

    const loadDifficultyInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchDifficultyInfo(level);
        if (response.data) {
          setDifficultyInfo(response.data);
        }
      } catch (err) {
        console.error('[난이도 정보] 로드 실패:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDifficultyInfo();
  }, [level]); // level이 바뀔 때마다 재요청

  return { difficultyInfo, isLoading, error };
};
