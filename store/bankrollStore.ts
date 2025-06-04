import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession, Player, BuyIn, CashOut } from '@/types/bankroll';
import { generateId } from '@/utils/helpers';

interface BankrollState {
  activeSessions: GameSession[];
  historySessions: GameSession[];
  
  // Actions
  createSession: (location: string, date?: Date) => string;
  getSession: (id: string) => GameSession | undefined;
  addPlayer: (sessionId: string, name: string, buyIn: number) => void;
  addBuyIn: (sessionId: string, playerId: string, amount: number) => void;
  addCashOut: (sessionId: string, playerId: string, amount: number) => void;
  editCashOut: (sessionId: string, playerId: string, cashOutId: string, newAmount: number) => void;
  updatePotAmount: (sessionId: string, amount: number) => void;
  endSession: (sessionId: string, notes: string) => void;
  deleteSession: (sessionId: string) => void;
  editBuyIn: (sessionId: string, playerId: string, buyInId: string, newAmount: number) => void;
}

export const useBankrollStore = create<BankrollState>()(
  persist(
    (set, get) => ({
      activeSessions: [],
      historySessions: [],
      
      createSession: (location, date = new Date()) => {
        const id = generateId();
        const newSession: GameSession = {
          id,
          location,
          date: date.toISOString(),
          players: [],
          potAmount: 0,
          totalBuyIns: 0,
          totalCashOuts: 0,
          isActive: true,
          notes: '',
        };
        
        set(state => ({
          activeSessions: [...state.activeSessions, newSession],
        }));
        
        return id;
      },
      
      getSession: (id) => {
        const { activeSessions, historySessions } = get();
        return [...activeSessions, ...historySessions].find(s => s.id === id);
      },
      
      addPlayer: (sessionId, name, buyInAmount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              const buyInId = generateId();
              const initialBuyIn: BuyIn = {
                id: buyInId,
                amount: buyInAmount,
                timestamp: new Date().toISOString(),
              };
              
              const newPlayer: Player = {
                id: generateId(),
                name,
                buyIns: [initialBuyIn],
                totalBuyIn: buyInAmount,
                cashOuts: [],
                totalCashOut: 0,
                profit: 0,
              };
              
              // Ensure players array is initialized
              const currentPlayers = session.players || [];
              
              return {
                ...session,
                players: [...currentPlayers, newPlayer],
                totalBuyIns: session.totalBuyIns + buyInAmount,
                potAmount: session.potAmount + buyInAmount,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
      
      addBuyIn: (sessionId, playerId, amount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              // Ensure players array is initialized
              const currentPlayers = session.players || [];
              
              const updatedPlayers = currentPlayers.map(player => {
                if (player.id === playerId) {
                  // Ensure buyIns is initialized
                  const currentBuyIns = player.buyIns || [];
                  
                  const newBuyIn: BuyIn = {
                    id: generateId(),
                    amount,
                    timestamp: new Date().toISOString(),
                  };
                  
                  const updatedTotalBuyIn = player.totalBuyIn + amount;
                  
                  return {
                    ...player,
                    buyIns: [...currentBuyIns, newBuyIn],
                    totalBuyIn: updatedTotalBuyIn,
                    // Recalculate profit if player has already cashed out
                    profit: player.totalCashOut !== null ? player.totalCashOut - updatedTotalBuyIn : 0,
                  };
                }
                return player;
              });
              
              return {
                ...session,
                players: updatedPlayers,
                totalBuyIns: session.totalBuyIns + amount,
                potAmount: session.potAmount + amount,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
      
      addCashOut: (sessionId, playerId, amount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              // Ensure players array is initialized
              const currentPlayers = session.players || [];
              
              const updatedPlayers = currentPlayers.map(player => {
                if (player.id === playerId) {
                  const newCashOut: CashOut = {
                    id: generateId(),
                    amount,
                    timestamp: new Date().toISOString(),
                  };
                  
                  const updatedTotalCashOut = (player.totalCashOut || 0) + amount;
                  const profit = updatedTotalCashOut - player.totalBuyIn;
                  
                  return {
                    ...player,
                    cashOuts: [...(player.cashOuts || []), newCashOut],
                    totalCashOut: updatedTotalCashOut,
                    profit,
                  };
                }
                return player;
              });
              
              return {
                ...session,
                players: updatedPlayers,
                totalCashOuts: session.totalCashOuts + amount,
                potAmount: session.potAmount - amount,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
      
      editCashOut: (sessionId, playerId, cashOutId, newAmount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              // Ensure players array is initialized
              const currentPlayers = session.players || [];
              
              // Find the old cash out amount to calculate the difference
              let amountDifference = 0;
              const targetPlayer = currentPlayers.find(p => p.id === playerId);
              if (targetPlayer) {
                const oldCashOut = targetPlayer.cashOuts.find(c => c.id === cashOutId);
                const oldCashOutAmount = oldCashOut ? oldCashOut.amount : 0;
                amountDifference = newAmount - oldCashOutAmount;
              }
              
              // Update the player and cash out
              const updatedPlayers = currentPlayers.map(player => {
                if (player.id === playerId) {
                  // Ensure cashOuts is initialized
                  const currentCashOuts = player.cashOuts || [];
                  
                  // Update the specific cash out
                  const updatedCashOuts = currentCashOuts.map(cashOut => {
                    if (cashOut.id === cashOutId) {
                      return {
                        ...cashOut,
                        amount: newAmount,
                      };
                    }
                    return cashOut;
                  });
                  
                  // Recalculate total cash out for the player
                  const updatedTotalCashOut = player.totalCashOut + amountDifference;
                  
                  return {
                    ...player,
                    cashOuts: updatedCashOuts,
                    totalCashOut: updatedTotalCashOut,
                    // Recalculate profit
                    profit: updatedTotalCashOut - player.totalBuyIn,
                  };
                }
                return player;
              });
              
              // Update session total cash outs and pot amount with the difference
              return {
                ...session,
                players: updatedPlayers,
                totalCashOuts: session.totalCashOuts + amountDifference,
                potAmount: session.potAmount - amountDifference,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
      
      updatePotAmount: (sessionId, amount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                potAmount: amount,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
      
      endSession: (sessionId, notes) => {
        set(state => {
          // Find the session to end
          const sessionToEnd = state.activeSessions.find(s => s.id === sessionId);
          
          if (!sessionToEnd) return state;
          
          // Ensure players array is initialized
          const currentPlayers = sessionToEnd.players || [];
          
          // Auto cash-out any players who haven't cashed out
          const updatedPlayers = currentPlayers.map(player => {
            if (player.totalCashOut === 0) {
              // Cash out with the same amount as total buy-in (no profit/loss)
              const totalBuyIn = player.totalBuyIn || 0;
              const newCashOut: CashOut = {
                id: generateId(),
                amount: totalBuyIn,
                timestamp: new Date().toISOString(),
              };
              return {
                ...player,
                cashOuts: [newCashOut],
                totalCashOut: totalBuyIn,
                profit: 0,
              };
            }
            return player;
          });
          
          // Calculate total cash-outs including auto cash-outs
          const totalCashOuts = updatedPlayers.reduce(
            (sum, player) => sum + (player.totalCashOut || 0), 
            0
          );
          
          // Create the ended session
          const endedSession: GameSession = {
            ...sessionToEnd,
            players: updatedPlayers,
            totalCashOuts,
            potAmount: 0, // Reset pot amount when ending
            isActive: false,
            notes,
          };
          
          return {
            activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
            historySessions: [...state.historySessions, endedSession],
          };
        });
      },
      
      deleteSession: (sessionId) => {
        set(state => {
          // Check if session exists in active sessions
          const activeSessionExists = state.activeSessions.some(s => s.id === sessionId);
          
          // Check if session exists in history sessions
          const historySessionExists = state.historySessions.some(s => s.id === sessionId);
          
          if (activeSessionExists) {
            return {
              ...state,
              activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
            };
          } 
          
          if (historySessionExists) {
            return {
              ...state,
              historySessions: state.historySessions.filter(s => s.id !== sessionId),
            };
          }
          
          // If somehow it's in neither (error case), return state unchanged
          return state;
        });
      },
      
      editBuyIn: (sessionId, playerId, buyInId, newAmount) => {
        set(state => {
          const updatedActiveSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              // Ensure players array is initialized
              const currentPlayers = session.players || [];
              
              // Find the old buy-in amount to calculate the difference
              let amountDifference = 0;
              const targetPlayer = currentPlayers.find(p => p.id === playerId);
              if (targetPlayer) {
                const oldBuyIn = targetPlayer.buyIns.find(b => b.id === buyInId);
                const oldBuyInAmount = oldBuyIn ? oldBuyIn.amount : 0;
                amountDifference = newAmount - oldBuyInAmount;
              }
              
              // Update the player and buy-in
              const updatedPlayers = currentPlayers.map(player => {
                if (player.id === playerId) {
                  // Ensure buyIns is initialized
                  const currentBuyIns = player.buyIns || [];
                  
                  // Update the specific buy-in
                  const updatedBuyIns = currentBuyIns.map(buyIn => {
                    if (buyIn.id === buyInId) {
                      return {
                        ...buyIn,
                        amount: newAmount,
                      };
                    }
                    return buyIn;
                  });
                  
                  // Recalculate total buy-in for the player
                  const updatedTotalBuyIn = player.totalBuyIn + amountDifference;
                  
                  return {
                    ...player,
                    buyIns: updatedBuyIns,
                    totalBuyIn: updatedTotalBuyIn,
                    // Recalculate profit if player has already cashed out
                    profit: player.totalCashOut !== null ? player.totalCashOut - updatedTotalBuyIn : 0,
                  };
                }
                return player;
              });
              
              // Update session total buy-ins and pot amount with the difference
              return {
                ...session,
                players: updatedPlayers,
                totalBuyIns: session.totalBuyIns + amountDifference,
                potAmount: session.potAmount + amountDifference,
              };
            }
            return session;
          });
          
          return { activeSessions: updatedActiveSessions };
        });
      },
    }),
    {
      name: 'bankroll-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);