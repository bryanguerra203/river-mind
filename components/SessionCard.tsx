import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, DollarSign } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Session } from '@/types/session';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const profit = session.cashOut - session.buyIn;
  const isProfit = profit > 0;
  const isActive = session.status === 'current';
  
  const handlePress = () => {
    router.push(`/session/${session.id}`);
  };
  
  // Local formatDuration function to avoid dependency on the utility
  const formatDurationLocal = (duration: number | string): string => {
    if (typeof duration === 'string') return duration;
    
    if (isNaN(duration) || duration < 0) return '0h 0m';
    
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };
  
  return (
    <Pressable 
      style={[styles.container, isActive && styles.activeContainer]} 
      onPress={handlePress}
    >
      <View style={styles.header}>
        <Text style={styles.gameType}>
          {session.gameType} • {session.sessionType}
        </Text>
        {!isActive && (
          <Text 
            style={[
              styles.profit, 
              isProfit ? styles.positive : styles.negative
            ]}
          >
            {isProfit ? '+' : ''}{formatCurrency(profit)}
          </Text>
        )}
        {isActive && (
          <Text style={styles.activeLabel}>Live</Text>
        )}
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{formatDate(session.date)}</Text>
        </View>
        
        {!isActive && (
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {formatDurationLocal(session.duration)}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <DollarSign size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{session.stakes}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.location}>{session.location}</Text>
        {session.tags && session.tags.length > 0 && (
          <View style={styles.tags}>
            {session.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {session.tags.length > 2 && (
              <Text style={styles.moreTag}>+{session.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activeContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.warning, // Changed from secondary to warning (yellow)
    backgroundColor: colors.background.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameType: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  profit: {
    fontSize: 18,
    fontWeight: '700',
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
  activeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.warning, // Changed from secondary to warning (yellow)
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: colors.text.secondary,
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  tags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: colors.background.input,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  moreTag: {
    color: colors.text.tertiary,
    fontSize: 12,
    marginLeft: 6,
  },
});