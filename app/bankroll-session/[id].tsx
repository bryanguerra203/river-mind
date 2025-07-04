import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowUp, 
  ArrowDown,
  Edit2,
  Trash2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useBankrollStore } from '@/store/bankrollStore';
import { Player, BuyIn, CashOut } from '@/types/bankroll';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency, formatDate, formatTime, formatDuration } from '@/utils/formatters';
import AddPlayerModal from '@/components/bankroll/AddPlayerModal';
import CashOutModal from '@/components/bankroll/CashOutModal';
import EndSessionModal from '@/components/bankroll/EndSessionModal';
import AddBuyInModal from '@/components/bankroll/AddBuyInModal';
import EditBuyInModal from '@/components/bankroll/EditBuyInModal';
import EditCashOutModal from '@/components/bankroll/EditCashOutModal';
import { BlurView } from 'expo-blur';

export default function BankrollSessionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    getSession, 
    deleteSession,
    saveSession,
    deleteBuyIn,
    deleteCashOut,
    deletePlayer
  } = useBankrollStore();
  
  const [session, setSession] = useState(getSession(id as string));
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showAddBuyInModal, setShowAddBuyInModal] = useState(false);
  const [showEditBuyInModal, setShowEditBuyInModal] = useState(false);
  const [showEditCashOutModal, setShowEditCashOutModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedBuyIn, setSelectedBuyIn] = useState<BuyIn | null>(null);
  const [selectedCashOut, setSelectedCashOut] = useState<CashOut | null>(null);
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refresh session data when it changes
  useEffect(() => {
    const refreshSession = () => {
      const updatedSession = getSession(id as string);
      setSession(updatedSession);
    };
    
    refreshSession();
    
    // Set up an interval to refresh the session data
    const intervalId = setInterval(refreshSession, 1000);
    
    return () => clearInterval(intervalId);
  }, [id, getSession]);
  
  if (!session) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Session not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.replace('/bankroll')} 
          style={styles.backButton}
        />
      </View>
    );
  }
  
  const handleCashOutPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowCashOutModal(true);
  };
  
  const handleAddBuyIn = (player: Player) => {
    setSelectedPlayer(player);
    setShowAddBuyInModal(true);
  };
  
  const handleEditBuyIn = (player: Player, buyIn: BuyIn) => {
    setSelectedPlayer(player);
    setSelectedBuyIn(buyIn);
    setShowEditBuyInModal(true);
  };
  
  const handleEditCashOut = (player: Player, cashOut: CashOut) => {
    setSelectedPlayer(player);
    setSelectedCashOut(cashOut);
    setShowEditCashOutModal(true);
  };
  
  const handleDeleteBuyIn = (player: Player, buyIn: BuyIn) => {
    Alert.alert(
      "Delete Buy-in",
      `Are you sure you want to delete this $${buyIn.amount} buy-in? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteBuyIn(session.id, player.id, buyIn.id);
          }
        }
      ]
    );
  };
  
  const handleDeleteCashOut = (player: Player, cashOut: CashOut) => {
    Alert.alert(
      "Delete Cash Out",
      `Are you sure you want to delete this $${cashOut.amount} cash out? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteCashOut(session.id, player.id, cashOut.id);
          }
        }
      ]
    );
  };
  
  const handleDeletePlayer = (player: Player) => {
    const buyInCount = player.buyIns.length;
    const cashOutCount = player.cashOuts.length;
    
    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${player.name}? This will remove all their buy-ins (${buyInCount}) and cash-outs (${cashOutCount}). This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Player", 
          style: "destructive",
          onPress: () => {
            deletePlayer(session.id, player.id);
          }
        }
      ]
    );
  };
  
  const handleEndSession = async (notes: string) => {
    try {
      setIsSaving(true);
      await saveSession(id as string, notes);
      router.replace('/bankroll');
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteSession = () => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteSession(session.id);
            router.replace('/bankroll');
          }
        }
      ]
    );
  };
  
  const togglePlayerExpanded = (playerId: string) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };
  
  const toggleDeleteMenu = () => {
    setShowDeleteMenu(!showDeleteMenu);
  };
  
  const getPlayerStatus = (player: Player) => {
    // If no buy-ins, player is not active
    if (player.buyIns.length === 0) {
      return { status: 'Not Playing', isActive: false };
    }
    
    // If no cash-outs, player is active
    if (player.cashOuts.length === 0) {
      return { status: 'Active', isActive: true };
    }
    
    // Check if there are buy-ins after the latest cash-out
    const latestCashOutTime = Math.max(...player.cashOuts.map(co => new Date(co.timestamp).getTime()));
    const hasBuyInsAfterCashOut = player.buyIns.some(bi => new Date(bi.timestamp).getTime() > latestCashOutTime);
    
    if (hasBuyInsAfterCashOut) {
      return { status: 'Active', isActive: true };
    }
    
    // If the last action was a cash-out (no buy-ins after latest cash-out), player is cashed out
    // regardless of current balance (positive or negative)
    return { status: 'Cashed Out', isActive: false };
  };
  
  // Calculate session stats
  const totalBuyIn = session.players?.reduce((total, player) => total + player.totalBuyIn, 0) || 0;
  const totalCashOut = session.players?.reduce((total, player) => total + player.totalCashOut, 0) || 0;
  const sessionProfit = totalCashOut - totalBuyIn;
  const potAmount = totalBuyIn - totalCashOut;
  const activePlayers = session.players?.filter(p => p.cashOuts.length === 0).length || 0;
  const cashedOutPlayers = session.players?.filter(p => p.cashOuts.length > 0).length || 0;
  
  return (
    <View style={styles.container}>
      <Modal
        visible={isSaving}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={20} style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
            <Text style={styles.loadingText}>Saving Session...</Text>
          </View>
        </BlurView>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{session.location}</Text>
              <Text style={styles.date}>{formatDate(session.date)}</Text>
              {!session.isActive && (
                <Text style={styles.duration}>
                  {formatDuration(session.duration || 0)}
                </Text>
              )}
            </View>
            
            <View style={styles.headerActions}>
              {session.isActive ? (
                <Button 
                  title="Save Game" 
                  variant="outline"
                  onPress={() => setShowEndSessionModal(true)}
                  style={styles.endButton}
                />
              ) : (
                <View style={styles.deleteContainer}>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={toggleDeleteMenu}
                    accessibilityLabel="Session options"
                  >
                    <MoreVertical size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                  
                  {showDeleteMenu && (
                    <View style={styles.deleteMenu}>
                      <TouchableOpacity 
                        style={styles.deleteMenuItem}
                        onPress={handleDeleteSession}
                      >
                        <Trash2 size={16} color={colors.accent.danger} />
                        <Text style={styles.deleteMenuText}>Delete Session</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>Pot Amount</Text>
              </View>
              <Text style={styles.potAmount}>{formatCurrency(potAmount)}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Buy-ins</Text>
                <Text style={styles.statValue}>{formatCurrency(totalBuyIn)}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Cash-outs</Text>
                <Text style={styles.statValue}>{formatCurrency(totalCashOut)}</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Session Profit</Text>
                <Text 
                  style={[
                    styles.statValue,
                    sessionProfit >= 0 ? styles.positive : styles.negative
                  ]}
                >
                  {sessionProfit >= 0 ? '+' : ''}{formatCurrency(sessionProfit)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Players</Text>
                <Text style={styles.statValue}>
                  {activePlayers} active, {cashedOutPlayers} cashed out
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.playersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              {session.isActive && (
                <Button 
                  title="Add Player" 
                  variant="secondary"
                  size="small"
                  onPress={() => setShowAddPlayerModal(true)}
                  style={styles.addPlayerButton}
                />
              )}
            </View>
            
            {!session.players || session.players.length === 0 ? (
              <View style={styles.emptyPlayersContainer}>
                <Text style={styles.emptyPlayersText}>
                  No players added yet. Add players to track buy-ins and cash-outs.
                </Text>
              </View>
            ) : (
              session.players.map((player) => (
                <View key={player.id} style={styles.playerCard}>
                  <TouchableOpacity 
                    style={styles.playerHeader}
                    onPress={() => togglePlayerExpanded(player.id)}
                  >
                    <View style={styles.playerInfo}>
                      <View style={styles.playerNameContainer}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        {(() => {
                          const { status, isActive } = getPlayerStatus(player);
                          let badgeStyle = styles.cashedOutBadge; // default
                          
                          if (status === 'Active') {
                            badgeStyle = styles.activeBadge;
                          } else if (status === 'Not Playing') {
                            badgeStyle = styles.notPlayingBadge;
                          }
                          
                          return (
                            <View style={[
                              styles.statusBadge,
                              badgeStyle
                            ]}>
                              <Text style={styles.statusText}>{status}</Text>
                            </View>
                          );
                        })()}
                        <View style={styles.chevronContainer}>
                          {expandedPlayers[player.id] ? (
                            <ChevronUp size={16} color={colors.text.secondary} />
                          ) : (
                            <ChevronDown size={16} color={colors.text.secondary} />
                          )}
                        </View>
                      </View>
                      <View style={styles.playerStats}>
                        <View style={styles.playerStat}>
                          <ArrowDown size={14} color={colors.accent.danger} />
                          <Text style={styles.playerStatText}>
                            {formatCurrency(player.totalBuyIn)}
                          </Text>
                        </View>
                        
                        {player.cashOuts.length > 0 && (
                          <>
                            <View style={styles.playerStat}>
                              <ArrowUp size={14} color={colors.accent.success} />
                              <Text style={styles.playerStatText}>
                                {formatCurrency(player.totalCashOut)}
                              </Text>
                            </View>
                            
                            <View style={styles.playerStat}>
                              <Text 
                                style={[
                                  styles.playerProfit,
                                  player.profit >= 0 ? styles.positive : styles.negative
                                ]}
                              >
                                {player.profit >= 0 ? '+' : ''}{formatCurrency(player.profit)}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.playerActions}>
                      {session.isActive && (
                        <View style={styles.actionButtons}>
                          {getPlayerStatus(player).isActive && (
                            <Button 
                              title="Cash Out" 
                              variant="outline"
                              size="small"
                              onPress={() => handleCashOutPlayer(player)}
                              style={styles.cashOutButton}
                            />
                          )}
                          
                          <TouchableOpacity 
                            style={styles.buyInButton}
                            onPress={() => handleAddBuyIn(player)}
                          >
                            <PlusCircle size={18} color={colors.accent.primary} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.deletePlayerButton}
                            onPress={() => handleDeletePlayer(player)}
                          >
                            <Trash2 size={16} color={colors.accent.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {expandedPlayers[player.id] && (
                    <>
                      <View style={styles.buyInsContainer}>
                        <Text style={styles.buyInsTitle}>Buy-in History</Text>
                        {player.buyIns && player.buyIns.length > 0 ? (
                          player.buyIns.map((buyIn, index) => (
                            <TouchableOpacity 
                              key={buyIn.id} 
                              style={styles.buyInItem}
                              onPress={() => session.isActive && handleEditBuyIn(player, buyIn)}
                              disabled={!session.isActive}
                            >
                              <Text style={styles.buyInNumber}>#{index + 1}</Text>
                              <Text style={styles.buyInAmount}>{formatCurrency(buyIn.amount)}</Text>
                              <Text style={styles.buyInTime}>{formatTime(buyIn.timestamp)}</Text>
                              {session.isActive && (
                                <View style={styles.buyInActions}>
                                  <TouchableOpacity 
                                    style={styles.editBuyInIcon}
                                    onPress={() => handleEditBuyIn(player, buyIn)}
                                  >
                                    <Edit2 size={14} color={colors.accent.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={styles.deleteBuyInIcon}
                                    onPress={() => handleDeleteBuyIn(player, buyIn)}
                                  >
                                    <Trash2 size={14} color={colors.accent.danger} />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noBuyInsText}>No buy-ins recorded</Text>
                        )}
                      </View>
                      
                      {player.cashOuts && player.cashOuts.length > 0 && (
                        <View style={styles.cashOutsContainer}>
                          <Text style={styles.cashOutsTitle}>Cash Out History</Text>
                          {player.cashOuts.map((cashOut, index) => (
                            <TouchableOpacity 
                              key={cashOut.id} 
                              style={styles.cashOutItem}
                              onPress={() => session.isActive && handleEditCashOut(player, cashOut)}
                              disabled={!session.isActive}
                            >
                              <Text style={styles.cashOutNumber}>#{index + 1}</Text>
                              <Text style={styles.cashOutAmount}>{formatCurrency(cashOut.amount)}</Text>
                              <Text style={styles.cashOutTime}>{formatTime(cashOut.timestamp)}</Text>
                              {session.isActive && (
                                <View style={styles.cashOutActions}>
                                  <TouchableOpacity 
                                    style={styles.editCashOutIcon}
                                    onPress={() => handleEditCashOut(player, cashOut)}
                                  >
                                    <Edit2 size={14} color={colors.accent.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={styles.deleteCashOutIcon}
                                    onPress={() => handleDeleteCashOut(player, cashOut)}
                                  >
                                    <Trash2 size={14} color={colors.accent.danger} />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))
            )}
          </View>
          
          {!session.isActive && session.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        <AddPlayerModal
          visible={showAddPlayerModal}
          sessionId={session.id}
          onClose={() => setShowAddPlayerModal(false)}
        />
        
        <CashOutModal
          visible={showCashOutModal}
          player={selectedPlayer}
          sessionId={session.id}
          onClose={() => {
            setShowCashOutModal(false);
            setSelectedPlayer(null);
          }}
        />
        
        <AddBuyInModal
          visible={showAddBuyInModal}
          player={selectedPlayer}
          sessionId={session.id}
          onClose={() => {
            setShowAddBuyInModal(false);
            setSelectedPlayer(null);
          }}
        />
        
        <EditBuyInModal
          visible={showEditBuyInModal}
          player={selectedPlayer}
          buyIn={selectedBuyIn}
          sessionId={session.id}
          onClose={() => {
            setShowEditBuyInModal(false);
            setSelectedPlayer(null);
            setSelectedBuyIn(null);
          }}
        />
        
        <EditCashOutModal
          visible={showEditCashOutModal}
          player={selectedPlayer}
          cashOut={selectedCashOut}
          sessionId={session.id}
          onClose={() => {
            setShowEditCashOutModal(false);
            setSelectedPlayer(null);
            setSelectedCashOut(null);
          }}
        />
        
        <EndSessionModal
          visible={showEndSessionModal}
          session={session}
          onClose={() => setShowEndSessionModal(false)}
          onEndSession={handleEndSession}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endButton: {
    minWidth: 120,
  },
  deleteContainer: {
    position: 'relative',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    width: 160,
  },
  deleteMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  deleteMenuText: {
    color: colors.accent.danger,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  potAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  potInput: {
    marginBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
  playersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addPlayerButton: {
    minWidth: 100,
  },
  emptyPlayersContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  emptyPlayersText: {
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  playerCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  playerHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  playerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  playerStatText: {
    color: colors.text.secondary,
    marginLeft: 6,
    fontSize: 14,
  },
  playerProfit: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashOutButton: {
    minWidth: 100,
  },
  buyInButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyInsContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buyInsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  buyInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  buyInNumber: {
    width: 30,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  buyInAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  buyInTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  buyInActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBuyInIcon: {
    marginLeft: 8,
    padding: 4,
  },
  deleteBuyInIcon: {
    marginLeft: 8,
    padding: 4,
  },
  noBuyInsText: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  cashOutsContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cashOutsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  cashOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  cashOutNumber: {
    width: 30,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  cashOutAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cashOutTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  cashOutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editCashOutIcon: {
    marginLeft: 8,
    padding: 4,
  },
  deleteCashOutIcon: {
    marginLeft: 8,
    padding: 4,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  backButton: {
    width: 120,
  },
  sessionTimeContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sessionTimeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  sessionTimeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContent: {
    backgroundColor: colors.background.secondary,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.accent.warning,
    borderRadius: 12,
    padding: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background.primary,
  },
  activeBadge: {
    backgroundColor: colors.accent.warning,
  },
  cashedOutBadge: {
    backgroundColor: colors.accent.success,
  },
  notPlayingBadge: {
    backgroundColor: colors.accent.danger,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  deletePlayerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});