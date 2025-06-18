import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
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
  const blinkAnim = new Animated.Value(1);
  
  useEffect(() => {
    if (isActive) {
      const blink = Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]);
      
      Animated.loop(blink).start();
    }
  }, [isActive]);
  
  const handlePress = () => {
    router.push(`/session/${session.id}`);
  };
  
  // Local formatDuration function to avoid dependency on the utility
  const formatDurationLocal = (duration: number | string): string => {
    if (typeof duration === 'string') return duration;
    
    if (isNaN(duration) || duration < 0) return '0h 0m';
    
    // Round to nearest minute
    const roundedDuration = Math.round(duration);
    const hours = Math.floor(roundedDuration / 60);
    const mins = roundedDuration % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  // Format time to HH:mm AM/PM
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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
          <View style={styles.liveContainer}>
            <Animated.View 
              style={[
                styles.blinkDot,
                { opacity: blinkAnim }
              ]} 
            />
            <Text style={styles.activeLabel}>Live</Text>
          </View>
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

        {isActive && (
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>Session Start: {formatTime(session.startTime || session.date)}</Text>
          </View>
        )}
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
    borderLeftColor: colors.accent.warning,
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
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.warning,
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
  blinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.warning,
  },
});