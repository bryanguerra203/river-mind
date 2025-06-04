import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import Button from '@/components/Button';

interface EmptyBankrollProps {
  onCreateSession: () => void;
}

export default function EmptyBankroll({ onCreateSession }: EmptyBankrollProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Your Poker Games</Text>
        <Text style={styles.description}>
          Log your poker games, track players, manage buy-ins and cash-outs, 
          and see who's winning and losing in real-time.
        </Text>
        
        <Button 
          title="Create New Game" 
          onPress={onCreateSession}
          size="large"
          style={styles.button}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});