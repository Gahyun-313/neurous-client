import { SocialLoginProvider } from './socialLoginService';
import { getUserInfo, clearUserInfo } from './authService';

export interface RecentLoginInfo {
  provider: SocialLoginProvider;
  userId: number;
  name?: string;
  userEmail?: string;
  profileImage?: string;
  loginTime: number; // timestamp
}

/**
 * 최근 로그인 정보를 로컬에서 불러오기
 */
export const getRecentLogin = async (): Promise<RecentLoginInfo | null> => {
  try {
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.provider || !userInfo.loginTime) {
      return null;
    }
    return {
      provider: userInfo.provider as SocialLoginProvider,
      userId: userInfo.userId,
      name: userInfo.name,
      userEmail: userInfo.email,
      profileImage: userInfo.profileImage,
      loginTime: userInfo.loginTime,
    };
  } catch (error) {
    console.error('최근 로그인 정보 불러오기 실패:', error);
    return null;
  }
};

/**
 * 최근 로그인 정보 삭제 (로그아웃 시)
 */
export const clearRecentLogin = async (): Promise<void> => {
  try {
    await clearUserInfo();
  } catch (error) {
    console.error('최근 로그인 정보 삭제 실패:', error);
  }
};
