import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
  large?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  positive = false, 
  negative = false,
  large = false
}: StatsCardProps) {
  return (
    <View style={[styles.container, large && styles.largeContainer]}>
      <Text style={styles.title}>{title}</Text>
      <Text 
        style={[
          styles.value, 
          large && styles.largeValue,
          positive && styles.positive, 
          negative && styles.negative
        ]}
      >
        {value}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    minWidth: '45%',
  },
  largeContainer: {
    width: '100%',
    marginBottom: 16,
  },
  title: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  largeValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: 4,
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
});