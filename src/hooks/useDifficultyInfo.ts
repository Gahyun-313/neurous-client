import { useState, useEffect } from 'react';
import { fetchDifficultyInfo, DifficultyInfo } from '../api/userApi';
import { LevelCategory } from '../types/interests';

export const useDifficultyInfo = (level: LevelCategory | null) => {
  const [difficultyInfo, setDifficultyInfo] = useState<DifficultyInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, [level]);

  return { difficultyInfo, isLoading, error };
};
