import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { useGuestStore } from '@/store/guestStore';
import { Session } from '@/types/session';
import ProfitChart from '@/components/ProfitChart';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SessionCard from '@/components/SessionCard';
import GuestModePrompt from '@/components/GuestModePrompt';
import { formatCurrency, formatHourlyRate, formatDuration } from '@/utils/formatters';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function DashboardScreen() {
  const router = useRouter();
  const { sessions, stats, bankroll, initializeStats, updateBankroll, isLoading } = useSessionStore();
  const { isGuestMode } = useGuestStore();
  const isOnline = useNetworkStatus();
  const [bankrollModalVisible, setBankrollModalVisible] = useState(false);
  const [newBankroll, setNewBankroll] = useState(bankroll.currentAmount.toString());
  const [showInitialBankrollModal, setShowInitialBankrollModal] = useState(false);
  const [initialBankrollInput, setInitialBankrollInput] = useState("");
  
  // Get active sessions (status: 'current')
  const activeSessions = sessions.filter(session => session.status === 'current');

  useEffect(() => {
    // Initialize stats from stored sessions
    initializeStats();
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

  const handleSetInitialBankroll = () => {
    const amount = parseFloat(initialBankrollInput);
    if (!isNaN(amount) && amount > 0) {
      updateBankroll(amount);
      setShowInitialBankrollModal(false);
    }
  };

  // If in guest mode, show guest mode prompt
  if (isGuestMode) {
    return <GuestModePrompt pageName="Dashboard" />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>
            {isOnline ? 'Syncing with server...' : 'Loading...'}
          </Text>
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

    const bestLoc = getBestLocation(sessions);
    const worstLoc = getWorstLocation(sessions);
    const bestSession = getBestSession(sessions);
    const worstSession = getWorstSession(sessions);

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
              value={formatDuration(stats.totalHours * 60)}
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
          <View style={styles.statsRow}>
            <StatsCard 
              title="Best Location" 
              value={bestLoc ? bestLoc.location : 'N/A'}
              subtitle={bestLoc ? formatCurrency(bestLoc.profit) : 'N/A'}
              positive={!!bestLoc && bestLoc.profit > 0}
            />
            <StatsCard 
              title="Worst Location" 
              value={worstLoc ? worstLoc.location : 'N/A'}
              subtitle={worstLoc ? formatCurrency(worstLoc.profit) : 'N/A'}
              negative={!!worstLoc}
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
        visible={showInitialBankrollModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInitialBankrollModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowInitialBankrollModal(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Set Initial Bankroll</Text>
              <Input
                label="Initial Bankroll Amount ($)"
                value={initialBankrollInput}
                onChangeText={setInitialBankrollInput}
                keyboardType="numeric"
                placeholder="Enter initial bankroll amount"
              />
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowInitialBankrollModal(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Set Bankroll"
                  onPress={handleSetInitialBankroll}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

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
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
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
    textAlign: 'left',
    marginBottom: 24,
  },
  emptyButton: {
    width: 200,
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
    marginBottom: 8,
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
  locationValue: {
    color: colors.text.primary,
  },
});

function calculateGameTypeWinRate(sessions: Session[]): string {
  const gameTypes: Record<string, { wins: number; total: number }> = {
    'Cash Game': { wins: 0, total: 0 },
    'Tournament': { wins: 0, total: 0 },
    'Sit & Go': { wins: 0, total: 0 }
  };

  sessions.forEach(session => {
    const gameType = session.gameType as keyof typeof gameTypes;
    if (gameType in gameTypes) {
      gameTypes[gameType].total++;
      if (session.cashOut > session.buyIn) {
        gameTypes[gameType].wins++;
      }
    }
  });

  const rates = Object.entries(gameTypes)
    .filter(([_, stats]) => stats.total > 0)
    .map(([type, stats]) => ({
      type,
      rate: (stats.wins / stats.total) * 100
    }))
    .sort((a, b) => b.rate - a.rate);

  if (rates.length === 0) return 'N/A';

  return rates.map(r => `${r.type}: ${Math.round(r.rate)}%`).join('\n');
}

function findBestLocation(sessions: Session[]): { value: string; isPositive?: boolean } {
  const locationStats = new Map<string, { profit: number, sessions: number }>();

  sessions.forEach(session => {
    const current = locationStats.get(session.location) || { profit: 0, sessions: 0 };
    locationStats.set(session.location, {
      profit: current.profit + (session.cashOut - session.buyIn),
      sessions: current.sessions + 1
    });
  });


  const locations = Array.from(locationStats.entries())
    .filter(([_, stats]) => stats.sessions >= 1) // Changed from 3 to 1 to include all locations
    .sort(([_, a], [__, b]) => b.profit - a.profit);


  if (locations.length === 0) return { value: 'N/A' };

  const [bestLocation, stats] = locations[0];
  return {
    value: `${bestLocation}\n${formatCurrency(stats.profit)}`,
    isPositive: stats.profit > 0
  };
}

function findWorstLocation(sessions: Session[]): { value: string; isPositive?: boolean } {
  const locationStats = new Map<string, { profit: number, sessions: number }>();

  sessions.forEach(session => {
    const current = locationStats.get(session.location) || { profit: 0, sessions: 0 };
    locationStats.set(session.location, {
      profit: current.profit + (session.cashOut - session.buyIn),
      sessions: current.sessions + 1
    });
  });


  const locations = Array.from(locationStats.entries())
    .filter(([_, stats]) => stats.sessions >= 1) // Changed from 3 to 1 to include all locations
    .sort(([_, a], [__, b]) => a.profit - b.profit); // Sort by ascending profit (worst first)

  if (locations.length === 0) return { value: 'N/A' };

  const [worstLocation, stats] = locations[0];
  return {
    value: `${worstLocation}\n${formatCurrency(stats.profit)}`,
    isPositive: stats.profit > 0
  };
}

// Helper to get best/worst location or N/A
function getBestLocation(sessions: Session[]) {
  const locationStats: { [key: string]: { profit: number, display: string } } = {};
  sessions.forEach((session: Session) => {
    const profit = session.cashOut - session.buyIn;
    const locKey = session.location.trim().toLowerCase();
    if (!locationStats[locKey]) {
      locationStats[locKey] = { profit: 0, display: session.location };
    }
    locationStats[locKey].profit += profit;
  });
  const sorted = Object.entries(locationStats).sort(([, a], [, b]) => (b.profit as number) - (a.profit as number));
  if (sorted.length === 0) return null;
  const [bestLoc, bestData] = sorted[0];
  if ((bestData.profit as number) <= 0) return null;
  return { location: bestData.display, profit: bestData.profit as number };
}

function getWorstLocation(sessions: Session[]) {
  const locationStats: { [key: string]: { profit: number, display: string } } = {};
  sessions.forEach((session: Session) => {
    const profit = session.cashOut - session.buyIn;
    const locKey = session.location.trim().toLowerCase();
    if (!locationStats[locKey]) {
      locationStats[locKey] = { profit: 0, display: session.location };
    }
    locationStats[locKey].profit += profit;
  });
  const sorted = Object.entries(locationStats).sort(([, a], [, b]) => (a.profit as number) - (b.profit as number));
  if (sorted.length === 0) return null;
  const [worstLoc, worstData] = sorted[0];
  if ((worstData.profit as number) >= 0) return null;
  return { location: worstData.display, profit: worstData.profit as number };
}

// Helper for best/worst session
function getBestSession(sessions: Session[]) {
  if (!sessions.length) return null;
  const best = Math.max(...sessions.map((s: Session) => s.cashOut - s.buyIn));
  if (best <= 0) return null;
  return best;
}

function getWorstSession(sessions: Session[]) {
  if (!sessions.length) return null;
  const worst = Math.min(...sessions.map((s: Session) => s.cashOut - s.buyIn));
  if (worst >= 0) return null;
  return worst;
}