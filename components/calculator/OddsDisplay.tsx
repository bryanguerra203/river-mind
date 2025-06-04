import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface OddsDisplayProps {
  odds: {
    turnOdds: number;
    riverOdds: number;
    combinedOdds: number;
    outs: number;
  };
}

export default function OddsDisplay({ odds }: OddsDisplayProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Improvement Odds</Text>
      
      <View style={styles.oddsContainer}>
        <View style={styles.oddsRow}>
          <Text style={styles.oddsLabel}>Outs:</Text>
          <Text style={styles.oddsValue}>{odds.outs}</Text>
        </View>
        
        <View style={styles.oddsRow}>
          <Text style={styles.oddsLabel}>Hit by Turn:</Text>
          <Text style={styles.oddsValue}>{formatPercentage(odds.turnOdds)}</Text>
        </View>
        
        <View style={styles.oddsRow}>
          <Text style={styles.oddsLabel}>Hit by River:</Text>
          <Text style={styles.oddsValue}>{formatPercentage(odds.riverOdds)}</Text>
        </View>
        
        <View style={styles.oddsRow}>
          <Text style={styles.oddsLabel}>Hit by Turn or River:</Text>
          <Text style={[styles.oddsValue, styles.combinedOdds]}>
            {formatPercentage(odds.combinedOdds)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.tip}>
        Tip: Multiply outs by 2 for turn odds, by 4 for turn+river odds (Rule of 2 and 4)
      </Text>
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
  oddsContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  oddsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oddsLabel: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  oddsValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  combinedOdds: {
    color: colors.accent.primary,
    fontSize: 18,
  },
  tip: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});