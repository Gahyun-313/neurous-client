/**
 * 이미지 URL 처리 유틸리티
 */

const IMAGE_BASE_URL = 'https://storage.googleapis.com/neurous-bucket';

/**
 * 이미지 URL을 완전한 URL로 변환
 * @param imageUrl 이미지 URL (절대 경로 또는 상대 경로)
 * @returns 완전한 이미지 URL
 */
export const getImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return '';
  }

  // 이미 절대 경로인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 상대 경로인 경우 base URL과 결합
  // 상대 경로가 /로 시작하지 않으면 / 추가
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${IMAGE_BASE_URL}${path}`;
};
