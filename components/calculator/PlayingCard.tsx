import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/types/poker';
import { getSuitColor, getSuitSymbol } from '@/utils/pokerHelpers';

interface PlayingCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
}

export default function PlayingCard({ card, size = 'medium' }: PlayingCardProps) {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  
  const getCardStyle = () => {
    switch (size) {
      case 'small':
        return styles.cardSmall;
      case 'large':
        return styles.cardLarge;
      default:
        return styles.card;
    }
  };
  
  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.textSmall;
      case 'large':
        return styles.textLarge;
      default:
        return styles.text;
    }
  };
  
  return (
    <View style={[styles.card, getCardStyle()]}>
      <Text style={[styles.text, getTextStyle(), { color: suitColor }]}>
        {card.rank}
      </Text>
      <Text style={[styles.suit, getTextStyle(), { color: suitColor }]}>
        {suitSymbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  cardSmall: {
    width: 40,
    height: 60,
  },
  cardLarge: {
    width: 90,
    height: 130,
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 32,
  },
  suit: {
    fontSize: 28,
    marginTop: 5,
  },
});