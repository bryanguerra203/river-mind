import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, SessionFilters, SessionStats, Bankroll } from '@/types/session';
import { defaultStakes } from '@/constants/gameTypes';
import { supabase, verifyAuth } from '@/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { testSupabaseConnection } from '@/lib/testSupabaseConnection';

interface SessionState {
  sessions: Session[];
  filters: SessionFilters;
  stats: SessionStats;
  bankroll: Bankroll;
  customStakes: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addSession: (session: Session) => Promise<void>;
  updateSession: (id: string, session: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setFilters: (filters: SessionFilters) => void;
  clearFilters: () => void;
  clearAllSessions: () => Promise<void>;
  initializeStats: () => void;
  updateBankroll: (amount: number) => Promise<void>;
  addCustomStake: (stake: string) => void;
  syncWithServer: () => Promise<void>;
  clearStore: () => void;
  syncBankroll: () => Promise<void>;
  
  // Computed
  getFilteredSessions: () => Session[];
  calculateStats: () => SessionStats;
  getAllStakes: () => string[];
}

const defaultStats: SessionStats = {
  totalSessions: 0,
  totalProfit: 0,
  totalHours: 0,
  hourlyRate: 0,
  bestSession: 0,
  worstSession: 0,
  winningDays: 0,
  losingDays: 0,
  currentStreak: 0,
  longestWinStreak: 0,
  longestLoseStreak: 0,
};

const defaultBankroll: Bankroll = {
  currentAmount: 0,
  initialAmount: 0,
  lastUpdated: new Date().toISOString(),
};

const testSession: Session = {
  id: 'test-session-' + Date.now(),
  date: new Date().toISOString(),
  gameType: 'Cash Game',
  sessionType: 'Live',
  locationType: 'Casino',
  location: 'Test Casino',
  buyIn: 200,
  cashOut: 300,
  duration: 120,
  notes: 'Test session to verify database connection',
  status: 'past',
  stakes: '1/2',
  tags: ['test'],
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString()
};

const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const response = await fetch(`${supabaseUrl}/rest/v1/sessions?select=count`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Connection test failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Connection test successful:', data);
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      filters: {},
      stats: defaultStats,
      bankroll: defaultBankroll,
      customStakes: [],
      isLoading: false,
      error: null,

      clearStore: () => {
        // Clear all state
        set({
          sessions: [],
          filters: {},
          stats: defaultStats,
          bankroll: defaultBankroll,
          customStakes: [],
          isLoading: false,
          error: null
        });

        // Clear persisted data from AsyncStorage
        AsyncStorage.removeItem('poker-sessions').catch(error => {
          console.error('Error clearing persisted data:', error);
        });
      },

      syncWithServer: async () => {
        set({ isLoading: true, error: null });
        try {
          // Verify authentication first
          const authState = await verifyAuth();
          if (!authState.isAuthenticated) {
            throw new Error('User not authenticated');
          }

          console.log('Auth verified, fetching sessions for user:', authState.userId);

          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', authState.userId)
            .order('date', { ascending: false });

          if (error) {
            console.error('Error fetching sessions:', error);
            throw error;
          }

          console.log('Successfully fetched sessions:', data?.length || 0);

          // Convert the response to our camelCase format
          const formattedSessions = data?.map(session => ({
            id: session.id,
            date: session.date,
            gameType: session.gametype,
            sessionType: session.sessiontype,
            locationType: session.locationtype,
            location: session.location,
            stakes: session.stakes,
            buyIn: session.buyin,
            cashOut: session.cashout,
            duration: session.duration,
            notes: session.notes,
            tags: session.tags,
            status: session.status,
            startTime: session.starttime,
            endTime: session.endtime,
          })) || [];

          console.log('Formatted sessions:', formattedSessions);

          set((state) => ({
            sessions: formattedSessions,
            stats: calculateSessionStats(formattedSessions),
            isLoading: false
          }));

          // Also sync bankroll
          await get().syncBankroll();

          set({ isLoading: false });
        } catch (error: any) {
          console.error('Error syncing with server:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      addSession: async (session) => {
        set({ isLoading: true, error: null });
        try {
          // Get the current user session
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          console.log('Auth check:', {
            user: user ? { id: user.id, email: user.email } : null,
            authError,
            session: await supabase.auth.getSession()
          });
          
          if (authError) {
            console.error('Auth error:', authError);
            throw new Error(`Authentication error: ${authError.message}`);
          }
          
          if (!user) {
            console.error('No user found');
            throw new Error('User not authenticated');
          }

          // Format the session data for Supabase with lowercase column names
          const formattedSession = {
            user_id: user.id,
            date: new Date(session.date).toISOString().split('T')[0],
            gametype: session.gameType,
            sessiontype: session.sessionType,
            locationtype: session.locationType,
            location: session.location,
            stakes: session.stakes,
            buyin: session.buyIn,
            cashout: session.cashOut,
            duration: session.duration,
            notes: session.notes,
            tags: session.tags,
            status: session.status,
            starttime: session.startTime ? new Date(session.startTime).toISOString() : null,
            endtime: session.endTime ? new Date(session.endTime).toISOString() : null,
          };

          console.log('Attempting to insert session:', formattedSession);

          // First try a simple insert without select
          const { error: insertError } = await supabase
            .from('sessions')
            .insert([formattedSession]);

          if (insertError) {
            console.error('Insert error:', {
              error: insertError,
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            });
            throw insertError;
          }

          // If insert was successful, fetch the inserted session
          const { data: insertedSession, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (fetchError) {
            console.error('Fetch error:', fetchError);
            throw fetchError;
          }

          if (!insertedSession) {
            throw new Error('Failed to fetch inserted session');
          }

          // Convert the response back to our camelCase format
          const formattedResponse = {
            ...insertedSession,
            gameType: insertedSession.gametype,
            sessionType: insertedSession.sessiontype,
            locationType: insertedSession.locationtype,
            buyIn: insertedSession.buyin,
            cashOut: insertedSession.cashout,
            startTime: insertedSession.starttime,
            endTime: insertedSession.endtime,
          };

          // After successful session insert, update bankroll
          const profit = session.cashOut - session.buyIn;
          const currentBankroll = get().bankroll;
          await get().updateBankroll(currentBankroll.currentAmount + profit);

          set((state) => {
            const newSessions = [...state.sessions, formattedResponse];
            const newStats = calculateSessionStats(newSessions);
            return { 
              sessions: newSessions,
              stats: newStats,
              isLoading: false
            };
          });
        } catch (error: any) {
          console.error('Error adding session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      updateSession: async (id, updatedSession) => {
        set({ isLoading: true, error: null });
        try {
          // Get the current user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('Auth error:', authError);
            throw new Error(`Authentication error: ${authError.message}`);
          }
          
          if (!user) {
            console.error('No user found');
            throw new Error('User not authenticated');
          }

          console.log('Current user:', {
            id: user.id,
            email: user.email
          });

          // Convert camelCase to snake_case for Supabase
          const formattedUpdate = {
            date: updatedSession.date ? new Date(updatedSession.date).toISOString().split('T')[0] : undefined,
            gametype: updatedSession.gameType,
            sessiontype: updatedSession.sessionType,
            locationtype: updatedSession.locationType,
            location: updatedSession.location,
            stakes: updatedSession.stakes,
            buyin: updatedSession.buyIn,
            cashout: updatedSession.cashOut,
            duration: updatedSession.duration,
            notes: updatedSession.notes,
            tags: updatedSession.tags,
            status: updatedSession.status,
            starttime: updatedSession.startTime ? new Date(updatedSession.startTime).toISOString() : undefined,
            endtime: updatedSession.endTime ? new Date(updatedSession.endTime).toISOString() : undefined,
          };

          console.log('Updating session:', {
            sessionId: id,
            userId: user.id,
            updateData: formattedUpdate
          });

          // First update the session
          const { error: updateError } = await supabase
            .from('sessions')
            .update(formattedUpdate)
            .eq('id', id)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Update error:', {
              error: updateError,
              code: updateError.code,
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint
            });
            throw updateError;
          }

          console.log('Update successful, fetching updated session...');

          // Then fetch the updated session
          const { data, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (fetchError) {
            console.error('Fetch error:', {
              error: fetchError,
              code: fetchError.code,
              message: fetchError.message,
              details: fetchError.details,
              hint: fetchError.hint
            });
            throw fetchError;
          }

          if (!data) {
            throw new Error('Failed to fetch updated session');
          }

          console.log('Successfully fetched updated session:', data);

          // Convert the response back to our camelCase format
          const formattedResponse = {
            ...data,
            gameType: data.gametype,
            sessionType: data.sessiontype,
            locationType: data.locationtype,
            buyIn: data.buyin,
            cashOut: data.cashout,
            startTime: data.starttime,
            endTime: data.endtime,
          };

          // After successful session update, update bankroll
          const oldSession = get().sessions.find(s => s.id === id);
          if (oldSession && updatedSession.buyIn !== undefined && updatedSession.cashOut !== undefined) {
            const oldProfit = oldSession.cashOut - oldSession.buyIn;
            const newProfit = updatedSession.cashOut - updatedSession.buyIn;
            const currentBankroll = get().bankroll;
            await get().updateBankroll(currentBankroll.currentAmount - oldProfit + newProfit);
          }

          set((state) => {
            const newSessions = state.sessions.map((session) => 
              session.id === id ? formattedResponse : session
            );
            const newStats = calculateSessionStats(newSessions);
            return { 
              sessions: newSessions,
              stats: newStats,
              isLoading: false
            };
          });
        } catch (error: any) {
          console.error('Error updating session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      deleteSession: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => {
            const sessionToDelete = state.sessions.find(s => s.id === id);
            const newSessions = state.sessions.filter((session) => session.id !== id);
            const newStats = calculateSessionStats(newSessions);
            let newBankroll = state.bankroll;
            if (sessionToDelete) {
              const profitToRemove = sessionToDelete.cashOut - sessionToDelete.buyIn;
              newBankroll = {
                ...state.bankroll,
                currentAmount: state.bankroll.currentAmount - profitToRemove,
                lastUpdated: new Date().toISOString(),
              };
            }
            return { 
              sessions: newSessions,
              stats: newStats,
              bankroll: newBankroll,
              isLoading: false
            };
          });

          // After successful session delete, update bankroll
          const sessionToDelete = get().sessions.find(s => s.id === id);
          if (sessionToDelete) {
            const profitToRemove = sessionToDelete.cashOut - sessionToDelete.buyIn;
            const currentBankroll = get().bankroll;
            await get().updateBankroll(currentBankroll.currentAmount - profitToRemove);
          }

          set((state) => {
            const newSessions = state.sessions.filter((session) => session.id !== id);
            const newStats = calculateSessionStats(newSessions);
            return { 
              sessions: newSessions,
              stats: newStats,
              isLoading: false
            };
          });
        } catch (error: any) {
          console.error('Error deleting session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      clearAllSessions: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get the current user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('Auth error:', authError);
            throw new Error(`Authentication error: ${authError.message}`);
          }
          
          if (!user) {
            console.error('No user found');
            throw new Error('User not authenticated');
          }

          // Delete all sessions for the current user
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({
            sessions: [],
            stats: defaultStats,
            bankroll: defaultBankroll,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Error clearing sessions:', error);
          set({ error: error.message, isLoading: false });
          throw error; // Re-throw to handle in the UI
        }
      },
      
      setFilters: (filters) => {
        set({ filters });
      },
      
      clearFilters: () => {
        set({ filters: {} });
      },
      
      initializeStats: () => {
        set((state) => ({
          stats: calculateSessionStats(state.sessions)
        }));
      },
      
      updateBankroll: async (amount) => {
        set({ isLoading: true, error: null });
        try {
          // Get the current user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          // Check if bankroll exists for user
          const { data: existingBankroll } = await supabase
            .from('bankroll')
            .select('*')
            .eq('user_id', user.id)
            .single();

          const bankrollData = {
            user_id: user.id,
            current_amount: amount,
            initial_amount: existingBankroll?.initial_amount || amount,
            last_updated: new Date().toISOString()
          };

          if (existingBankroll) {
            // Update existing bankroll
            const { error: updateError } = await supabase
              .from('bankroll')
              .update(bankrollData)
              .eq('user_id', user.id);

            if (updateError) throw updateError;
          } else {
            // Insert new bankroll
            const { error: insertError } = await supabase
              .from('bankroll')
              .insert([bankrollData]);

            if (insertError) throw insertError;
          }

          set((state) => ({
            bankroll: {
              ...state.bankroll,
              currentAmount: amount,
              initialAmount: existingBankroll?.initial_amount || amount,
              lastUpdated: new Date().toISOString(),
            },
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error updating bankroll:', error);
          set({ error: error.message, isLoading: false });
        }
      },
      
      syncBankroll: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          // First try to get existing bankroll
          const { data: bankroll, error: fetchError } = await supabase
            .from('bankroll')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle instead of single to handle no results

          if (fetchError) {
            console.error('Error fetching bankroll:', fetchError);
            throw fetchError;
          }

          if (bankroll) {
            // Update state with existing bankroll
            set((state) => ({
              bankroll: {
                currentAmount: bankroll.current_amount,
                initialAmount: bankroll.initial_amount,
                lastUpdated: bankroll.last_updated,
              },
              isLoading: false
            }));
          } else {
            // No bankroll exists, create one with default values
            const defaultBankroll = {
              user_id: user.id,
              current_amount: 0,
              initial_amount: 0,
              last_updated: new Date().toISOString()
            };

            const { error: insertError } = await supabase
              .from('bankroll')
              .insert([defaultBankroll]);

            if (insertError) {
              console.error('Error creating default bankroll:', insertError);
              throw insertError;
            }

            // Update state with default bankroll
            set((state) => ({
              bankroll: {
                currentAmount: 0,
                initialAmount: 0,
                lastUpdated: new Date().toISOString(),
              },
              isLoading: false
            }));
          }
        } catch (error: any) {
          console.error('Error syncing bankroll:', error);
          set({ error: error.message, isLoading: false });
        }
      },
      
      addCustomStake: (stake) => {
        set((state) => ({
          customStakes: state.customStakes.includes(stake) 
            ? state.customStakes 
            : [...state.customStakes, stake]
        }));
      },
      
      getFilteredSessions: () => {
        const { sessions, filters } = get();
        return filterSessions(sessions, filters);
      },
      
      calculateStats: () => {
        const filteredSessions = get().getFilteredSessions();
        return calculateSessionStats(filteredSessions);
      },
      
      getAllStakes: () => {
        const { customStakes } = get();
        return [...defaultStakes.map(s => s.name), ...customStakes];
      },
    }),
    {
      name: 'poker-sessions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        bankroll: state.bankroll,
        customStakes: state.customStakes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.sessions.length > 0) {
          state.stats = calculateSessionStats(state.sessions);
        }
      },
    }
  )
);

// Helper functions
function filterSessions(sessions: Session[], filters: SessionFilters): Session[] {
  return sessions.filter((session) => {
    // Game type filter
    if (filters.gameType && session.gameType !== filters.gameType) {
      return false;
    }
    
    // Session type filter
    if (filters.sessionType && session.sessionType !== filters.sessionType) {
      return false;
    }
    
    // Location type filter
    if (filters.locationType && session.locationType !== filters.locationType) {
      return false;
    }
    
    // Location filter
    if (filters.location && !session.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const sessionDate = new Date(session.date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (sessionDate < startDate || sessionDate > endDate) {
        return false;
      }
    }
    
    // Stakes filter
    if (filters.stakes && session.stakes !== filters.stakes) {
      return false;
    }
    
    // Status filter
    if (filters.status && session.status !== filters.status) {
      return false;
    }
    
    return true;
  });
}

function calculateSessionStats(sessions: Session[]): SessionStats {
  if (sessions.length === 0) {
    return defaultStats;
  }
  
  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let totalProfit = 0;
  let totalHours = 0;
  let bestSession = Number.MIN_SAFE_INTEGER;
  let worstSession = Number.MAX_SAFE_INTEGER;
  let winningDays = 0;
  let losingDays = 0;
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  
  console.log('Calculating stats for sessions:', sortedSessions);
  
  sortedSessions.forEach((session) => {
    const profit = session.cashOut - session.buyIn;
    const hours = session.duration / 60;
    
    console.log('Session stats:', {
      profit,
      hours,
      buyIn: session.buyIn,
      cashOut: session.cashOut,
      duration: session.duration
    });
    
    totalProfit += profit;
    totalHours += hours;
    
    bestSession = Math.max(bestSession, profit);
    worstSession = Math.min(worstSession, profit);
    
    if (profit > 0) {
      winningDays++;
      currentWinStreak++;
      currentLoseStreak = 0;
    } else if (profit < 0) {
      losingDays++;
      currentLoseStreak++;
      currentWinStreak = 0;
    }
    
    longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
  });
  
  // Calculate current streak
  const lastSession = sortedSessions[sortedSessions.length - 1];
  const lastProfit = lastSession.cashOut - lastSession.buyIn;
  currentStreak = lastProfit > 0 ? currentWinStreak : -currentLoseStreak;
  
  const stats = {
    totalSessions: sessions.length,
    totalProfit,
    totalHours,
    hourlyRate: totalHours > 0 ? totalProfit / totalHours : 0,
    bestSession,
    worstSession: worstSession === Number.MAX_SAFE_INTEGER ? 0 : worstSession,
    winningDays,
    losingDays,
    currentStreak,
    longestWinStreak,
    longestLoseStreak,
  };
  
  console.log('Calculated stats:', stats);
  
  return stats;
}