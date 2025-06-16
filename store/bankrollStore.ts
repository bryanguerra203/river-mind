import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { GameSession, Player, BuyIn, CashOut } from '@/types/bankroll';
import { generateId } from '@/utils/helpers';

interface BankrollState {
  activeSessions: GameSession[];
  historySessions: GameSession[];
  isLoading: boolean;
  error: string | null;
  
  // Local storage operations
  createSession: (session: Omit<GameSession, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addPlayer: (sessionId: string, player: { name: string; initialBuyIn?: number }) => Promise<void>;
  addBuyIn: (playerId: string, buyIn: Omit<BuyIn, 'id' | 'created_at'>) => Promise<void>;
  addCashOut: (sessionId: string, cashOut: Omit<CashOut, 'id' | 'created_at'>) => Promise<void>;
  editBuyIn: (sessionId: string, playerId: string, buyInId: string, amount: number) => Promise<void>;
  editCashOut: (sessionId: string, playerId: string, cashOutId: string, amount: number) => Promise<void>;
  
  // Database operations
  loadSessions: () => Promise<void>;
  saveSession: (sessionId: string, notes?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Helper functions
  getSession: (sessionId: string) => GameSession | null;
}

export const useBankrollStore = create<BankrollState>()(
  persist(
    (set, get) => ({
      activeSessions: [],
      historySessions: [],
      isLoading: false,
      error: null,
      
      createSession: async (session) => {
        const newSession: GameSession = {
          ...session,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          players: [],
          totalBuyIns: 0,
          totalCashOuts: 0,
          potAmount: 0,
          isActive: true
        };
        
        set(state => ({
          activeSessions: [...state.activeSessions, newSession]
        }));
      },
      
      addPlayer: async (sessionId, player) => {
        const newPlayer: Player = {
          ...player,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buyIns: [],
          cashOuts: [],
          totalBuyIn: 0,
          totalCashOut: 0,
          profit: 0
        };
        
        // If there's an initial buy-in, add it
        if (player.initialBuyIn) {
          const initialBuyIn: BuyIn = {
            id: generateId(),
            amount: player.initialBuyIn,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          newPlayer.buyIns = [initialBuyIn];
          newPlayer.totalBuyIn = player.initialBuyIn;
        }
        
        set(state => {
          const updatedSessions = state.activeSessions.map(session => {
            if (session.id === sessionId) {
              const updatedPlayers = [...(session.players || []), newPlayer];
              const totalBuyIns = updatedPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
              const totalCashOuts = updatedPlayers.reduce((sum, p) => sum + p.totalCashOut, 0);
              const potAmount = totalCashOuts - totalBuyIns;
              
              return {
                ...session,
                players: updatedPlayers,
                totalBuyIns,
                totalCashOuts,
                potAmount
              };
            }
            return session;
          });
          
          return { activeSessions: updatedSessions };
        });
      },
      
      addBuyIn: async (playerId, buyIn) => {
        const newBuyIn: BuyIn = {
          ...buyIn,
          id: generateId(),
          created_at: new Date().toISOString()
        };
        
        set(state => {
          const updatedSessions = state.activeSessions.map(session => {
            const updatedPlayers = session.players?.map(player => {
              if (player.id === playerId) {
                const updatedBuyIns = [...player.buyIns, newBuyIn];
                const totalBuyIn = updatedBuyIns.reduce((sum, bi) => sum + bi.amount, 0);
                return {
                  ...player,
                  buyIns: updatedBuyIns,
                  totalBuyIn,
                  profit: player.totalCashOut - totalBuyIn
                };
              }
              return player;
            }) || [];

            // Calculate session totals
            const totalBuyIns = updatedPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
            const totalCashOuts = updatedPlayers.reduce((sum, p) => sum + p.totalCashOut, 0);
            const potAmount = totalCashOuts - totalBuyIns;

            return {
              ...session,
              players: updatedPlayers,
              totalBuyIns,
              totalCashOuts,
              potAmount,
              updated_at: new Date().toISOString()
            };
          });
          
          return { activeSessions: updatedSessions };
        });
      },
      
      addCashOut: async (sessionId, cashOut) => {
        const newCashOut: CashOut = {
          ...cashOut,
          id: generateId(),
          created_at: new Date().toISOString()
        };
        
        set(state => {
          const updatedSessions = state.activeSessions.map(session => {
            if (session.id !== sessionId) return session;
            
            const updatedPlayers = session.players?.map(player => {
              if (player.id === cashOut.playerId) {
                const updatedCashOuts = [...player.cashOuts, newCashOut];
                const totalCashOut = updatedCashOuts.reduce((sum, co) => sum + co.amount, 0);
                return {
                  ...player,
                  cashOuts: updatedCashOuts,
                  totalCashOut,
                  profit: totalCashOut - player.totalBuyIn
                };
              }
              return player;
            }) || [];

            // Calculate session totals
            const totalBuyIns = updatedPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
            const totalCashOuts = updatedPlayers.reduce((sum, p) => sum + p.totalCashOut, 0);
            const potAmount = totalCashOuts - totalBuyIns;

            return {
              ...session,
              players: updatedPlayers,
              totalBuyIns,
              totalCashOuts,
              potAmount,
              updated_at: new Date().toISOString()
            };
          });
          
          return { activeSessions: updatedSessions };
        });
      },
      
      editBuyIn: async (sessionId, playerId, buyInId, amount) => {
        set(state => {
          const updatedSessions = state.activeSessions.map(session => {
            if (session.id !== sessionId) return session;
            
            const updatedPlayers = session.players?.map(player => {
              if (player.id !== playerId) return player;
              
              const updatedBuyIns = player.buyIns.map(buyIn => {
                if (buyIn.id !== buyInId) return buyIn;
                return { ...buyIn, amount };
              });
              
              const totalBuyIn = updatedBuyIns.reduce((sum, bi) => sum + bi.amount, 0);
              return {
                ...player,
                buyIns: updatedBuyIns,
                totalBuyIn,
                profit: player.totalCashOut - totalBuyIn
              };
            }) || [];

            // Calculate session totals
            const totalBuyIns = updatedPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
            const totalCashOuts = updatedPlayers.reduce((sum, p) => sum + p.totalCashOut, 0);
            const potAmount = totalCashOuts - totalBuyIns;

            return {
              ...session,
              players: updatedPlayers,
              totalBuyIns,
              totalCashOuts,
              potAmount,
              updated_at: new Date().toISOString()
            };
          });
          
          return { activeSessions: updatedSessions };
        });
      },
      
      editCashOut: async (sessionId, playerId, cashOutId, amount) => {
        set(state => {
          const updatedSessions = state.activeSessions.map(session => {
            if (session.id !== sessionId) return session;
            
            const updatedPlayers = session.players?.map(player => {
              if (player.id !== playerId) return player;
              
              const updatedCashOuts = player.cashOuts.map(cashOut => {
                if (cashOut.id !== cashOutId) return cashOut;
                return { ...cashOut, amount };
              });
              
              const totalCashOut = updatedCashOuts.reduce((sum, co) => sum + co.amount, 0);
              return {
                ...player,
                cashOuts: updatedCashOuts,
                totalCashOut,
                profit: totalCashOut - player.totalBuyIn
              };
            }) || [];

            // Calculate session totals
            const totalBuyIns = updatedPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
            const totalCashOuts = updatedPlayers.reduce((sum, p) => sum + p.totalCashOut, 0);
            const potAmount = totalCashOuts - totalBuyIns;

            return {
              ...session,
              players: updatedPlayers,
              totalBuyIns,
              totalCashOuts,
              potAmount,
              updated_at: new Date().toISOString()
            };
          });
          
          return { activeSessions: updatedSessions };
        });
      },
      
      loadSessions: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Get the current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) throw new Error('User must be authenticated to load sessions');

          // Load history sessions from database
          const { data: sessions, error } = await supabase
            .from('bankroll_sessions')
            .select(`
              *,
              players:bankroll_players(
                *,
                buyIns:bankroll_buy_ins(*),
                cashOuts:bankroll_cash_outs(*)
              )
            `)
            .eq('is_active', false)
            .order('date', { ascending: false });
            
          if (error) throw error;

          // Format the sessions to match our GameSession type
          const formattedSessions = sessions?.map(session => ({
            id: session.id,
            location: session.location,
            date: session.date,
            potAmount: parseFloat(session.pot_amount) || 0,
            totalBuyIns: parseFloat(session.total_buy_ins) || 0,
            totalCashOuts: parseFloat(session.total_cash_outs) || 0,
            notes: session.notes,
            isActive: session.is_active,
            duration: session.duration || 0,
            created_at: session.created_at,
            updated_at: session.updated_at,
            players: session.players?.map((player: any) => ({
              id: player.id,
              name: player.name,
              totalBuyIn: parseFloat(player.total_buy_in) || 0,
              totalCashOut: parseFloat(player.total_cash_out) || 0,
              profit: parseFloat(player.profit) || 0,
              created_at: player.created_at,
              updated_at: player.updated_at,
              buyIns: player.buyIns?.map((buyIn: any) => ({
                id: buyIn.id,
                amount: parseFloat(buyIn.amount) || 0,
                timestamp: buyIn.timestamp,
                created_at: buyIn.created_at
              })) || [],
              cashOuts: player.cashOuts?.map((cashOut: any) => ({
                id: cashOut.id,
                amount: parseFloat(cashOut.amount) || 0,
                timestamp: cashOut.timestamp,
                created_at: cashOut.created_at
              })) || []
            })) || []
          })) || [];
          
          set({
            historySessions: formattedSessions,
            isLoading: false
          });
        } catch (error) {
          console.error('Error loading sessions:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      
      saveSession: async (sessionId: string, notes?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const session = get().activeSessions.find(s => s.id === sessionId);
          if (!session) throw new Error('Session not found');

          // Get the current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) throw new Error('User must be authenticated to save sessions');

          // Calculate session duration in minutes
          const startTime = new Date(session.date);
          const endTime = new Date();
          const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

          // Save session to database
          const { data: savedSession, error: sessionError } = await supabase
            .from('bankroll_sessions')
            .insert({
              user_id: user.id,
              location: session.location,
              date: session.date,
              pot_amount: session.potAmount,
              total_buy_ins: session.totalBuyIns,
              total_cash_outs: session.totalCashOuts,
              notes,
              is_active: false,
              duration,
              created_at: session.created_at,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error(`Failed to save session: ${sessionError.message}`);
          }
          
          // Save players
          for (const player of session.players || []) {
            const { data: savedPlayer, error: playerError } = await supabase
              .from('bankroll_players')
              .insert({
                session_id: savedSession.id,
                name: player.name,
                total_buy_in: player.totalBuyIn,
                total_cash_out: player.totalCashOut,
                profit: player.profit,
                created_at: player.created_at,
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (playerError) {
              console.error('Player error:', playerError);
              throw new Error(`Failed to save player: ${playerError.message}`);
            }
            
            // Save buy-ins
            for (const buyIn of player.buyIns) {
              const { error: buyInError } = await supabase
                .from('bankroll_buy_ins')
                .insert({
                  player_id: savedPlayer.id,
                  amount: buyIn.amount,
                  timestamp: buyIn.timestamp,
                  created_at: buyIn.created_at
                });
                
              if (buyInError) {
                console.error('Buy-in error:', buyInError);
                throw new Error(`Failed to save buy-in: ${buyInError.message}`);
              }
            }
            
            // Save cash-outs
            for (const cashOut of player.cashOuts) {
              const { error: cashOutError } = await supabase
                .from('bankroll_cash_outs')
                .insert({
                  player_id: savedPlayer.id,
                  amount: cashOut.amount,
                  timestamp: cashOut.timestamp,
                  created_at: cashOut.created_at
                });
                
              if (cashOutError) {
                console.error('Cash-out error:', cashOutError);
                throw new Error(`Failed to save cash-out: ${cashOutError.message}`);
              }
            }
          }
          
          // Remove session from active sessions
          set(state => ({
            activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error saving session:', error);
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      
      deleteSession: async (sessionId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if session is in active sessions
          const activeSession = get().activeSessions.find(s => s.id === sessionId);
          if (activeSession) {
            set(state => ({
              activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
              isLoading: false
            }));
            return;
          }
          
          // Delete from database
          const { error } = await supabase
            .from('bankroll_sessions')
            .delete()
            .eq('id', sessionId);
            
          if (error) throw error;
          
          set(state => ({
            historySessions: state.historySessions.filter(s => s.id !== sessionId),
            isLoading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      
      getSession: (sessionId) => {
        const state = get();
        return [...state.activeSessions, ...state.historySessions]
          .find(session => session.id === sessionId) || null;
      }
    }),
    {
      name: 'bankroll-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeSessions: state.activeSessions })
    }
  )
);