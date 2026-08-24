import {
  GOOGLE_WEB_CLIENT_ID,
  NAVER_CONSUMER_KEY,
  NAVER_CONSUMER_SECRET,
} from '../config/api';

// 구글 로그인 설정
export const GOOGLE_CONFIG = {
  webClientId: GOOGLE_WEB_CLIENT_ID,
};

// 네이버 로그인 설정
export const NAVER_CONFIG = {
  consumerKey: NAVER_CONSUMER_KEY,
  consumerSecret: NAVER_CONSUMER_SECRET,
  appName: '뉴로스',
  serviceUrlScheme: 'neurousnaver',
};
