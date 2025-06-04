import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { Card, HandType } from '@/types/poker';
import { getHandDescription } from '@/utils/pokerHelpers';

interface HandStrengthProps {
  handType: HandType | null;
  cards: Card[];
}

export default function HandStrength({ handType, cards }: HandStrengthProps) {
  if (!handType) return null;
  
  const handDescription = getHandDescription(handType, cards);
  
  const getHandColor = () => {
    switch (handType) {
      case 'straight-flush':
      case 'royal-flush':
        return colors.accent.success;
      case 'four-of-a-kind':
      case 'full-house':
      case 'flush':
      case 'straight':
        return '#FFA500'; // Orange
      case 'three-of-a-kind':
      case 'two-pair':
      case 'pair':
        return colors.accent.primary;
      default:
        return colors.text.primary;
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Hand</Text>
      <View style={styles.handContainer}>
        <Text style={[styles.handType, { color: getHandColor() }]}>
          {handType.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Text>
        <Text style={styles.handDescription}>{handDescription}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  handContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  handType: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  handDescription: {
    color: colors.text.secondary,
    fontSize: 16,
  },
});