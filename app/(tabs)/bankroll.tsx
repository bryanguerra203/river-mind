import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  DollarSign, 
  Clock, 
  Users,
  Trash2,
  MoreVertical
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useBankrollStore } from '@/store/bankrollStore';
import { useGuestStore } from '@/store/guestStore';
import { GameSession } from '@/types/bankroll';
import { formatCurrency, formatDate } from '@/utils/formatters';
import EmptyBankroll from '@/components/bankroll/EmptyBankroll';
import GuestModePrompt from '@/components/GuestModePrompt';

export default function BankrollScreen() {
  const router = useRouter();
  const { 
    activeSessions, 
    historySessions,
    deleteSession,
    loadSessions,
    isLoading
  } = useBankrollStore();
  const { isGuestMode } = useGuestStore();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const handleCreateSession = () => {
    router.push('/new-bankroll-session');
  };
  
  const handleViewSession = (sessionId: string) => {
    router.push(`/bankroll-session/${sessionId}`);
  };
  
  const toggleSessionMenu = (sessionId: string, event: any) => {
    // Stop propagation to prevent opening the session details
    event.stopPropagation();
    setOpenMenuId(prev => prev === sessionId ? null : sessionId);
  };
  
  const handleDeleteSession = (session: GameSession, event: any) => {
    // Stop propagation to prevent opening the session details
    event.stopPropagation();
    
    Alert.alert(
      "Delete Session",
      `Are you sure you want to delete "${session.location}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteSession(session.id);
            setOpenMenuId(null);
          }
        }
      ]
    );
  };
  
  const closeAllMenus = () => {
    setOpenMenuId(null);
  };
  
  // If in guest mode, show guest mode prompt
  if (isGuestMode) {
    return <GuestModePrompt pageName="Bankroll" />;
  }
  
  // Sort history sessions by date (newest first)
  const sortedHistorySessions = [...historySessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading your poker games...</Text>
      </View>
    );
  }
  
  if (activeSessions.length === 0 && historySessions.length === 0) {
    return <EmptyBankroll onCreateSession={handleCreateSession} />;
  }
  
  const renderSessionItem = (session: GameSession) => {
    const totalProfit = session.totalCashOuts - session.totalBuyIns;
    const isProfit = totalProfit >= 0;
    const isMenuOpen = openMenuId === session.id;
    
    return (
      <View key={session.id} style={styles.sessionCardContainer}>
        <TouchableOpacity 
          style={styles.sessionCard}
          onPress={() => handleViewSession(session.id)}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionLocation}>{session.location}</Text>
            <View style={styles.sessionActions}>
              <Text 
                style={[
                  styles.sessionProfit,
                  isProfit ? styles.profitPositive : styles.profitNegative
                ]}
              >
                {isProfit ? '+' : ''}{formatCurrency(totalProfit)}
              </Text>
              
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={(e) => toggleSessionMenu(session.id, e)}
                >
                  <MoreVertical size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                
                {isMenuOpen && (
                  <>
                    <Pressable style={styles.menuOverlay} onPress={closeAllMenus} />
                    <View style={styles.menu}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={(e) => handleDeleteSession(session, e)}
                      >
                        <Trash2 size={16} color={colors.accent.danger} />
                        <Text style={[styles.menuItemText, styles.deleteText]}>
                          Delete Session
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <Clock size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>{formatDate(session.date)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Users size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>{session.players?.length || 0} players</Text>
            </View>
            
            <View style={styles.detailItem}>
              <DollarSign size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {formatCurrency(session.totalBuyIns)} total buy-ins
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Pressable style={styles.container} onPress={closeAllMenus}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Poker Games</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleCreateSession}
          >
            <Plus size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {activeSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Games</Text>
            {activeSessions.map(session => renderSessionItem(session))}
          </View>
        )}
        
        {historySessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game History</Text>
            {sortedHistorySessions.map(session => renderSessionItem(session))}
          </View>
        )}
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  sessionCardContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'visible',
    position: 'relative',
  },
  sessionCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionProfit: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  profitPositive: {
    color: colors.accent.success,
  },
  profitNegative: {
    color: colors.accent.danger,
  },
  menuContainer: {
    position: 'relative',
    zIndex: 2,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: '100%',
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  deleteText: {
    color: colors.accent.danger,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text.secondary,
  },
});