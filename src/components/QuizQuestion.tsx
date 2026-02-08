import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, scaleWidth } from '../styles/global';
import { Heading_24EB_Round, Heading_20EB_Round } from '../styles/typography';
interface QuizQuestionProps {
  question: string;
  Q_color?: string;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  Q_color = COLORS.puple[5],
}) => {
  return (
    <View>
      <Text style={[styles.qIconText, { color: Q_color }]}>Q</Text>
      <Text style={styles.questionText}>{question}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  qIconText: {
    ...Heading_24EB_Round,
    marginBottom: scaleWidth(4),
  },
  questionText: {
    ...Heading_20EB_Round,
    color: COLORS.black,
    flex: 1,
  },
});

export default QuizQuestion;
