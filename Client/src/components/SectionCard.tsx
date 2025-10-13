import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, style }) => {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <View>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
});

export default SectionCard;


