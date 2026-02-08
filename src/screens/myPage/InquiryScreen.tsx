import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
//import { useNavigation } from '@react-navigation/native';

import Header from '../../components/Header';
// import Input from '../../components/Input';
// import Button from '../../components/Button';

import { COLORS, scaleWidth } from '../../styles/global';
import {
  Heading_16B,
  Heading_20EB_Round,
  Caption_14R,
  Heading_18SB,
} from '../../styles/typography';

// import { useShowToast } from '../../store/toastStore';
// import { getUserInfo } from '../../services/authService';

/**
 * 문의하기 화면 (현재 버전)
 * - 앱 내 문의 폼 대신 "공식 문의 메일"만 안내 화면으로 노출
 * - (기존 폼/버튼/토스트/이메일 자동채우기 로직은 아래에 전부 주석 처리해 둠)
 */
const InquiryScreen = () => {
  //const navigation = useNavigation<any>();

  // 화면에 노출할 공식 메일
  const NEUROUS_EMAIL = 'neurous2@gmail.com';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ===== 헤더 영역 ===== */}
      <View style={styles.headerWrap}>
        {/* 공통 헤더는 그대로 사용 (title은 비워서 기본 Text 출력 방지) */}
        <Header title="" />

        {/* 중앙 타이틀 오버레이 */}
        <View pointerEvents="none" style={styles.headerCenterTitleWrap}>
          <Text style={styles.headerCenterTitle}>문의하기</Text>
        </View>
      </View>

      {/* ===== 본문 영역 ===== */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 안내 문구 */}
        <Text style={styles.title}>
          뉴로스 이용 중 불편한 점이나{'\n'}
          궁금한 점이 있다면 말씀해주세요.
        </Text>

        <View style={styles.mailContainer}>
          {/* 뉴로스 메일 라벨 */}
          <Text style={styles.mailLabel}>뉴로스 메일</Text>

          {/* 메일 주소 */}
          <Text style={styles.mailValue}>{NEUROUS_EMAIL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InquiryScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  /** ===== 헤더 ===== */
  headerWrap: {
    position: 'relative',
  },
  headerCenterTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: scaleWidth(8),
    height: scaleWidth(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterTitle: {
    ...Heading_16B,
    color: COLORS.black,
  },

  /** ===== 스크롤 ===== */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(25),
    paddingBottom: scaleWidth(24),
  },

  /** ===== 타이틀/메일 ===== */
  title: {
    ...Heading_20EB_Round,
    color: COLORS.black,
    lineHeight: scaleWidth(33),
    marginBottom: scaleWidth(52),
  },
  mailContainer: {
    gap: scaleWidth(8),
  },
  mailLabel: {
    ...Caption_14R,
    color: COLORS.gray800,
  },
  mailValue: {
    ...Heading_18SB,
    color: COLORS.black,
  },
});

/* =============================================================================
✅ (기존 구현) 전부 주석 처리한 레거시 코드
- 문의 내용 입력 / 답변 받을 이메일 입력 / 전달하기 버튼 / 토스트 / getUserInfo 이메일 자동 채우기
- 나중에 API 연동으로 다시 살릴 때 참고용
============================================================================= */

// import React, { useMemo, useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';

// import Header from '../../components/Header';
// import Input from '../../components/Input';
// import Button from '../../components/Button';

// import {
//   COLORS,
//   scaleWidth,
//   BORDER_RADIUS,
//   Heading_16B,
//   Heading_20EB_Round,
//   Body_16M,
//   Heading_18SB,
// } from '../../styles/global';

// import { useShowToast } from '../../store/toastStore';
// import { getUserInfo } from '../../services/authService';

// const InquiryScreen = () => {
//   const navigation = useNavigation<any>();
//   const showToast = useShowToast();

//   const [content, setContent] = useState('');
//   const [email, setEmail] = useState('');

//   useEffect(() => {
//     const fetchEmail = async () => {
//       const userInfo = await getUserInfo();
//       console.log('저장된 유저 정보:', userInfo);
//       if (userInfo?.email) {
//         setEmail(userInfo.email);
//       }
//     };
//     fetchEmail();
//   }, []);

//   const isSubmitEnabled = useMemo(() => {
//     return content.trim().length >= 10;
//   }, [content]);

//   const onPressSubmit = () => {
//     console.log('[Inquiry] submit', { content, email });
//     showToast('전달이 완료되었어요');
//     navigation.goBack();
//   };

//   return (
//     <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
//       <KeyboardAvoidingView
//         style={styles.kav}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <View style={styles.headerWrap}>
//           <Header title="" />
//           <View pointerEvents="none" style={styles.headerCenterTitleWrap}>
//             <Text style={styles.headerCenterTitle}>문의하기</Text>
//           </View>
//         </View>

//         <ScrollView
//           style={styles.scroll}
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           <Text style={styles.title}>
//             뉴로스 이용 중 불편한 점이나{'\n'}
//             궁금한 점이 있다면 말씀해주세요.
//           </Text>

//           <Text style={styles.sectionLabel}>문의 내용</Text>

//           <Input
//             placeholder="문의 사항을 입력해주세요"
//             value={content}
//             onChangeText={setContent}
//             variant="outline"
//             multiline
//             textAlignVertical="top"
//             containerStyle={styles.textareaContainer}
//             style={styles.textareaInput}
//           />

//           <Text style={[styles.sectionLabel, styles.sectionLabelWithTop]}>
//             답변 받을 이메일
//           </Text>

//           <Input
//             placeholder="abcd@naver.com"
//             value={email}
//             onChangeText={setEmail}
//             variant="outline"
//             keyboardType="email-address"
//             autoCapitalize="none"
//             containerStyle={styles.emailContainer}
//             style={styles.textareaInput}
//           />
//         </ScrollView>

//         <View style={styles.bottom}>
//           <Button
//             title="전달하기"
//             onPress={onPressSubmit}
//             disabled={!isSubmitEnabled}
//             variant="primary"
//             style={styles.submitButton}
//           />
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default InquiryScreen;

// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//     paddingBottom: scaleWidth(20),
//   },
//   headerWrap: {
//     position: 'relative',
//   },
//   headerCenterTitleWrap: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: scaleWidth(8),
//     height: scaleWidth(52),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerCenterTitle: {
//     ...Heading_16B,
//     color: COLORS.black,
//   },
//   kav: {
//     flex: 1,
//   },
//   scroll: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: scaleWidth(20),
//     paddingTop: scaleWidth(25),
//     paddingBottom: scaleWidth(10),
//   },
//   title: {
//     ...Heading_20EB_Round,
//     color: COLORS.black,
//     lineHeight: scaleWidth(35),
//     marginBottom: scaleWidth(52),
//   },
//   sectionLabel: {
//     ...Heading_18SB,
//     color: COLORS.black,
//     marginBottom: scaleWidth(12),
//   },
//   textareaContainer: {
//     height: scaleWidth(207),
//     alignItems: 'flex-start',
//     padding: scaleWidth(18),
//     borderRadius: BORDER_RADIUS[16],
//     borderColor: COLORS.gray300,
//   },
//   emailContainer: {
//     height: scaleWidth(60),
//     borderColor: COLORS.gray300,
//   },
//   textareaInput: {
//     ...Body_16M,
//     color: COLORS.gray600,
//   },
//   sectionLabelWithTop: {
//     marginTop: scaleWidth(32),
//   },
//   bottom: {
//     height: scaleWidth(63),
//     paddingHorizontal: scaleWidth(20),
//     backgroundColor: COLORS.white,
//   },
//   submitButton: {
//     width: '100%',
//     borderRadius: scaleWidth(12),
//   },
// });
