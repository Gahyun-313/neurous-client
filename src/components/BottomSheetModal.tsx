import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS, scaleWidth, BORDER_RADIUS } from '../styles/global';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  paddingHorizontal?: number;
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  children,
  paddingHorizontal,
}) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.bottomSheet}>
            <SafeAreaView edges={['bottom']} style={{ paddingBottom: bottom }}>
              {/* Grab Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Content */}
              <View
                style={{
                  paddingHorizontal: paddingHorizontal ?? scaleWidth(20),
                }}
              >
                {children}
              </View>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS[20],
    borderTopRightRadius: BORDER_RADIUS[20],
    maxHeight: '80%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: scaleWidth(12),
    paddingBottom: scaleWidth(40),
  },
  handle: {
    width: scaleWidth(40),
    height: scaleWidth(4),
    borderRadius: BORDER_RADIUS[2],
    backgroundColor: COLORS.gray500,
  },
  content: {
    paddingHorizontal: scaleWidth(20),
  },
});

export default BottomSheetModal;
