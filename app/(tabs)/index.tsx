import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import ProfitChart from '@/components/ProfitChart';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SessionCard from '@/components/SessionCard';
import { formatCurrency, formatHourlyRate, formatDuration } from '@/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { sessions, stats, bankroll, initializeStats, updateBankroll } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [bankrollModalVisible, setBankrollModalVisible] = useState(false);
  const [newBankroll, setNewBankroll] = useState(bankroll.currentAmount.toString());
  
  // Get active sessions (status: 'current')
  const activeSessions = sessions.filter(session => session.status === 'current');

  useEffect(() => {
    // Initialize stats from stored sessions
    initializeStats();
    
    // Simulate a small delay to show loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [initializeStats]);

  const handleAddSession = () => {
    router.push('/new-session');
  };

  const handleUpdateBankroll = () => {
    const amount = parseFloat(newBankroll);
    if (!isNaN(amount)) {
      updateBankroll(amount);
      setBankrollModalVisible(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Sessions Yet</Text>
          <Text style={styles.emptyText}>Get started by adding your first poker session.</Text>
          <Button 
            title="Add Session" 
            onPress={handleAddSession} 
            style={styles.emptyButton}
          />
        </View>
      );
    }

    return (
      <>
        <View style={styles.summaryContainer}>
          <StatsCard 
            title="Total Profit" 
            value={formatCurrency(stats.totalProfit)} 
            positive={stats.totalProfit > 0}
            negative={stats.totalProfit < 0}
            large
          />
          <View style={styles.statsRow}>
            <StatsCard 
              title="Total Sessions" 
              value={stats.totalSessions} 
            />
            <StatsCard 
              title="Hourly Rate" 
              value={formatHourlyRate(stats.hourlyRate)}
              positive={stats.hourlyRate > 0}
              negative={stats.hourlyRate < 0}
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard 
              title="Total Time" 
              value={formatDuration(Math.round(stats.totalHours * 60))}
            />
            <StatsCard 
              title="Win Rate" 
              value={`${Math.round((stats.winningDays / (stats.winningDays + stats.losingDays) || 0) * 100)}%`}
              subtitle={`${stats.winningDays} winning sessions`}
            />
          </View>
        </View>

        {activeSessions.length > 0 && (
          <View style={styles.activeSessionsContainer}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            {activeSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        <ProfitChart sessions={sessions} height={220} />

        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.statsRow}>
            <StatsCard 
              title="Best Session" 
              value={formatCurrency(stats.bestSession)}
              positive={stats.bestSession > 0}
            />
            <StatsCard 
              title="Worst Session" 
              value={formatCurrency(stats.worstSession)}
              negative={stats.worstSession < 0}
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard 
              title="Current Streak" 
              value={`${stats.currentStreak > 0 ? '+' : ''}${stats.currentStreak} sessions`}
              subtitle={stats.currentStreak > 0 ? 'Winning' : stats.currentStreak < 0 ? 'Losing' : 'Neutral'}
              positive={stats.currentStreak > 0}
              negative={stats.currentStreak < 0}
            />
            <StatsCard 
              title="Longest Win Streak" 
              value={`${stats.longestWinStreak} sessions`}
            />
          </View>
        </View>

        <View style={styles.bankrollContainer}>
          <Text style={styles.sectionTitle}>Bankroll</Text>
          <TouchableOpacity 
            style={styles.bankrollCard}
            onPress={() => setBankrollModalVisible(true)}
          >
            <StatsCard 
              title="Current Bankroll" 
              value={formatCurrency(bankroll.currentAmount)}
              positive={bankroll.currentAmount > bankroll.initialAmount}
              negative={bankroll.currentAmount < bankroll.initialAmount}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionContainer}>
          <Button 
            title="Add New Session" 
            onPress={handleAddSession} 
            style={styles.quickActionButton}
          />
          <Button 
            title="View All Sessions" 
            onPress={() => router.push('/(tabs)/sessions')} 
            variant="outline"
            style={styles.quickActionButton}
          />
        </View>
      </>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Poker Dashboard</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSession}>
          <Plus size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      {renderContent()}

      <Modal
        visible={bankrollModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBankrollModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setBankrollModalVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Update Bankroll</Text>
              <Input
                label="New Bankroll Amount ($)"
                value={newBankroll}
                onChangeText={setNewBankroll}
                keyboardType="numeric"
                placeholder="Enter new bankroll amount"
              />
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setBankrollModalVisible(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Update"
                  onPress={handleUpdateBankroll}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    width: 200,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeSessionsContainer: {
    marginBottom: 24,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  bankrollContainer: {
    marginBottom: 24,
  },
  bankrollCard: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  quickActionContainer: {
    marginBottom: 32,
  },
  quickActionButton: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});