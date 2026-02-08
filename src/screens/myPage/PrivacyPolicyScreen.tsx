import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Header from '../../components/Header';
import { scaleWidth, COLORS } from '../../styles/global';
import {
  Heading_24EB_Round,
  Heading_18B,
  Heading_16B,
  Body_16R,
} from '../../styles/typography';

/**
 * 개인정보 처리방침 화면
 */
const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<any>();

  /**
   * 리스트 아이템 렌더링 (Hanging Indent)
   * - label: 번호(1.) 또는 불릿(•)
   * - content: 내용 텍스트
   */
  const renderItem = useCallback((label: string, content: string) => {
    return (
      <View style={styles.row}>
        <Text style={styles.listLabel}>{label}</Text>
        <Text style={styles.listContent}>{content}</Text>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* 상단 헤더 */}
      <Header goBackAction={() => navigation.goBack()} />

      {/* 본문 */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 타이틀 & 서문 */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>뉴로스 개인정보 처리 방침</Text>
          <Text style={styles.text}>
            혹성탈출 (이하 “팀”)은 팀이 제공하는 서비스 “뉴로스(Neurous)”(이하
            “서비스”)를 이용하는 개인(이하 “이용자”)의 정보를 보호하기 위해,
            「개인정보 보호법」 등 관련 법령을 준수하고, 서비스 이용자의
            개인정보 보호 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기
            위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </Text>
        </View>

        {/* 1. 개인정보 수집 및 이용 목적 */}
        <View style={styles.section}>
          <Text style={styles.title}>1. 개인정보 수집 및 이용 목적</Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>가. 이용 목적</Text>
            <Text style={styles.text}>
              팀은 이용자의 개인정보를 다음의 목적으로만 활용합니다. 다음 목적
              외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
              별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </Text>

            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '회원 관리: 서비스 제공에 따른 본인 식별, 가입 의사 확인, 불량 회원의 부정 이용 방지, 각종 고지·통지, 고충 처리, 분쟁 조정을 위한 기록 보존',
              )}
              {renderItem(
                '2.',
                '서비스 제공: 콘텐츠(미션, 탐색, 퀴즈 등) 제공, 이용자 맞춤형 난이도 및 관심 분야 설정에 따른 서비스 로직 적용, 포인트/경험치 적립 및 사용 관리',
              )}
              {renderItem(
                '3.',
                '광고 및 리워드 제공: 보상형 광고(Google AdMob) 송출, 광고 시청 여부에 따른 포인트 지급 및 보상 확인, 광고 부정 이용 방지',
              )}
              {renderItem(
                '4.',
                '신규 서비스 개발 및 마케팅: 신규 서비스 개발 및 서비스 유효성 확인, 접속 빈도 파악, 이용 통계 분석을 통한 서비스 최적화',
              )}
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>나. 아동의 개인정보 보호</Text>
            <Text style={styles.text}>
              서비스는 가입 시 만 14세 이상임을 필수적으로 확인하며, 원칙적으로
              만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만약 만 14세
              미만 아동의 정보가 수집된 사실이 확인될 경우 즉시 파기합니다.
            </Text>
          </View>
        </View>

        {/* 2. 수집하는 개인정보의 항목 및 방법 */}
        <View style={styles.section}>
          <Text style={styles.title}>2. 수집하는 개인정보의 항목 및 방법</Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>가. 처리하는 개인정보의 항목</Text>
            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '회원 가입 (소셜 로그인 연동): (카카오, 네이버, 구글, 애플 중 택 1) 로그인 식별 값(CI/DI), 이메일, 이름',
              )}
              {renderItem(
                '2.',
                '서비스 이용 및 초기 설정: 관심 분야(카테고리), 설정 난이도',
              )}
              {renderItem(
                '3.',
                '서비스 이용 과정에서 생성되는 정보: 서비스 이용 기록(접속 로그, 콘텐츠 열람 시간, 퀴즈 정답 여부), 포인트/경험치 변동 내역, 이용 정지 기록, 단말기 정보(모델명, OS 버전), PUSH 수신 여부, 광고 식별(ADID/IDFA), 접속 IP',
              )}
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>나. 개인정보의 수집 방법</Text>
            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '회원가입 및 서비스 이용 과정에서 이용자가 개인정보 수집에 대해 동의하고 직접 입력',
              )}
              {renderItem('2.', '제휴사(소셜 로그인 제공 업체)로부터의 제공')}
              {renderItem(
                '3.',
                '서비스 이용 과정에서 자동 생성 정보 수집 툴(SDK 등)을 통한 수집',
              )}
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>
              다. 개인정보 자동 수집 장치의 설치·운영 및 거부
            </Text>

            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '서비스 이용 기록 자동 수집: 서비스의 안정적인 운영과 부정 이용 방지를 위해 앱 방문 기록, 접속 시간, 오류 로그 등의 세션 데이터가 자동으로 생성되어 수집될 수 있습니다.',
              )}
              {renderItem(
                '2.',
                '광고 식별자(ADID/IDFA)의 활용 및 거부: 서비스는 이용자의 활동을 추적하는 맞춤형 광고를 수행하지 않으며, 보상형 광고의 중복 시청 확인 등 기술적 목적으로만 광고 식별자를 활용합니다. 이용자는 언제든지 아래 경로를 통해 설정을 확인하거나 변경할 수 있습니다.',
              )}
            </View>

            <View style={[styles.bulletList, { marginLeft: scaleWidth(30) }]}>
              {renderItem(
                '•',
                'Android: 설정 > Google > 광고 > 광고 ID 삭제 또는 재설정',
              )}
              {renderItem(
                '•',
                'iOS: 설정 > 개인정보 보호 및 보안 > 추적 > 앱의 추적 허용 해제',
              )}
            </View>
          </View>
        </View>

        {/* 3. 개인정보의 제3자 제공 및 위탁 */}
        <View style={styles.section}>
          <Text style={styles.title}>3. 개인정보의 제3자 제공 및 위탁</Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>가. 개인정보 처리 위탁</Text>
            <Text style={styles.text}>
              팀은 원활한 서비스 이행을 위해 다음과 같이 개인정보 처리 업무를
              외부 전문 업체에 위탁하여 운영하고 있습니다.
            </Text>

            {/* 테이블 */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text
                  style={[styles.tableHeader, { flex: 1 }, styles.borderRight]}
                >
                  수탁 업체
                </Text>
                <Text
                  style={[styles.tableHeader, { flex: 1 }, styles.borderRight]}
                >
                  위탁 업무 내용
                </Text>
                <Text style={[styles.tableHeader, { flex: 1 }]}>이전 국가</Text>
              </View>

              <View style={styles.tableRow}>
                <Text
                  style={[styles.tableCell, { flex: 1 }, styles.borderRight]}
                >
                  NCP(Naver Cloud Platform)
                </Text>
                <Text
                  style={[styles.tableCell, { flex: 1 }, styles.borderRight]}
                >
                  서비스 데이터 저장, 시스템 및 서버 운영 관리
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>국내</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text
                  style={[styles.tableCell, { flex: 1 }, styles.borderRight]}
                >
                  Google AdMob
                </Text>
                <Text
                  style={[styles.tableCell, { flex: 1 }, styles.borderRight]}
                >
                  보상형 광고 송출, 광고 시청 여부 확인 및 리워드(포인트) 지급
                  관리
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>국외(미국)</Text>
              </View>
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>나. 개인정보의 국외 이전</Text>
            <Text style={styles.text}>
              팀은 광고 서비스 제공을 위해 아래와 같이 개인정보를 국외(미국)로
              이전합니다.
            </Text>
            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '이전 항목: 광고 식별자(ADID/IDFA), 단말기 정보(모델명, OS), 서비스 이용 기록, 접속 IP',
              )}
              {renderItem(
                '2.',
                '이전 목적: 리워드 광고 송출 및 보상(포인트) 지급 확인, 광고 부정 이용 방지',
              )}
              {renderItem(
                '3.',
                '이전 일시 및 방법: 광고 호출 및 시청 시점에 SDK를 통해 암호화 전송',
              )}
              {renderItem(
                '4.',
                '보유 및 이용 기간: 수집 목적 달성 시까지 (Google의 개인정보 처리방침에 따름)',
              )}
            </View>
          </View>
        </View>

        {/* 4. 개인정보 보유 기간 및 파기 */}
        <View style={styles.section}>
          <Text style={styles.title}>4. 개인정보 보유 기간 및 파기</Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>가. 개인정보 보유 및 이용 기간</Text>
            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '이용자의 개인정보는 수집 및 이용 목적이 달성되면 지체 없이 즉시 파기하는 것을 원칙으로 합니다.',
              )}
              {renderItem(
                '2.',
                '이용자가 회원 탈퇴를 요청하거나 개인정보 수집 동의를 철회하는 경우, 해당 이용자의 데이터는 복구할 수 없는 방법으로 즉시 삭제됩니다.',
              )}
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>나. 개인정보 파기</Text>
            <View style={styles.bulletList}>
              {renderItem(
                '1.',
                '파기 절차: 이용자가 입력한 정보 및 생성된 모든 데이터는 목적 달성 시(회원 탈퇴 등) 별도의 보관 기간 없이 데이터베이스(DB)에서 해당 이용자의 모든 내역을 즉시 삭제합니다.',
              )}
              {renderItem(
                '2.',
                '파기 방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제합니다.',
              )}
            </View>
          </View>
        </View>

        {/* 5. 이용자의 권리 및 행사 방법 */}
        <View style={styles.section}>
          <Text style={styles.title}>5. 이용자의 권리 및 행사 방법</Text>
          <Text style={styles.text}>
            이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며,
            수집 및 이용에 대한 동의 철회(회원 탈퇴)를 요청할 수 있습니다.
          </Text>
          <View style={styles.bulletList}>
            {renderItem(
              '1.',
              '권리 행사 방법: 앱 내 [마이페이지 > 설정 > 로그인 정보] 메뉴를 통해 직접 조회 및 수정이 가능하며, [회원 탈퇴] 기능을 통해 동의 철회가 가능합니다.',
            )}
            {renderItem(
              '2.',
              '이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정을 완료하기 전까지 당해 개인정보를 이용하거나 제공하지 않습니다.',
            )}
          </View>
        </View>

        {/* 6. 개인정보 보호 책임자 및 권익침해 구제방법 */}
        <View style={styles.section}>
          <Text style={styles.title}>
            6. 개인정보 보호 책임자 및 권익침해 구제방법
          </Text>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>가. 개인정보 보호 책임자</Text>
            <Text style={styles.text}>
              팀은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 이용자의 불만 처리 및 피해 구제 등을 위하여 아래와
              같이 개인정보 보호 책임자를 지정하고 있습니다.
            </Text>

            <View style={styles.bulletList}>
              {renderItem('•', '성명/직책: 이슬희 / PM')}
              {renderItem('•', '연락처: neurous2@gmail.com')}
              {renderItem('', '(※ 개인정보 보호 관련 문의만 처리됩니다.)')}
            </View>
          </View>

          <View style={styles.subSection}>
            <Text style={styles.subTitle}>
              나. 정보주체의 권익침해에 대한 구제방법
            </Text>
            <Text style={styles.text}>
              기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래
              기관에 문의하시기 바랍니다.
            </Text>
            <View style={styles.bulletList}>
              {renderItem(
                '•',
                '개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)',
              )}
              {renderItem(
                '•',
                '개인정보침해신고센터 (privacy.kisa.or.kr / 118)',
              )}
              {renderItem('•', '경찰청 사이버수사국 (ecrm.cyber.go.kr / 182)')}
            </View>
          </View>
        </View>

        {/* 7. 변경 고지 */}
        <View style={styles.section}>
          <Text style={styles.title}>7. 개인정보 처리방침의 변경</Text>
          <Text style={styles.text}>
            이 개인정보 처리방침은 시행일로부터 적용되며, 관련 법률 및 지침의
            변경과 내부 운영 방침의 변경에 따라 변경될 수 있습니다. 현
            개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 시에는 시행일 최소
            7일 전부터 서비스 알림을 통해 고지할 것입니다.
          </Text>

          <View style={styles.bulletList}>
            <Text style={styles.text}>• 공고 일자: 2026.01.03</Text>
            <Text style={styles.text}>• 시행 일자: 2026.01.04</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(20),
    paddingBottom: scaleWidth(48),
    gap: scaleWidth(32),
  },

  section: {
    gap: scaleWidth(16),
  },
  subSection: {
    gap: scaleWidth(16),
  },
  bulletList: {
    marginTop: scaleWidth(8),
    gap: scaleWidth(4),
  },

  /* 리스트(행) */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleWidth(4),
  },
  listLabel: {
    ...Body_16R,
    color: COLORS.black,
    minWidth: scaleWidth(14),
  },
  listContent: {
    ...Body_16R,
    color: COLORS.black,
    flex: 1,
  },

  /* 텍스트 */
  mainTitle: {
    ...Heading_24EB_Round,
    color: COLORS.black,
  },
  title: {
    ...Heading_18B,
    color: COLORS.black,
  },
  subTitle: {
    ...Heading_16B,
    color: COLORS.black,
  },
  text: {
    ...Body_16R,
    color: COLORS.black,
  },
  noticeText: {
    ...Body_16R,
    color: COLORS.gray500,
  },

  /* 테이블 */
  table: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray300,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: COLORS.gray300,
  },
  tableHeader: {
    padding: scaleWidth(8),
    backgroundColor: COLORS.gray100,
    ...Heading_16B,
    color: COLORS.black,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  tableCell: {
    padding: scaleWidth(8),
    ...Body_16R,
    color: COLORS.black,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  /* 박스 */
  box: {
    padding: scaleWidth(12),
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    gap: scaleWidth(4),
  },
});
