import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, SessionFilters, SessionStats, Bankroll } from '@/types/session';
import { defaultStakes } from '@/constants/gameTypes';
import { supabase, verifyAuth } from '@/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { testSupabaseConnection } from '@/lib/testSupabaseConnection';
import { useGuestStore } from './guestStore';

interface SessionState {
  sessions: Session[];
  filters: SessionFilters;
  stats: SessionStats;
  bankroll: Bankroll;
  customStakes: string[];
  isLoading: boolean;
  error: string | null;
  hasBankroll: boolean;
  needsSync: boolean;
  
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
  syncBankroll: (userId: string) => Promise<void>;
  setNeedsSync: (value: boolean) => void;
  
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
  locationStats: {},
  bestLocation: null,
  worstLocation: null,
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

// Helper function to check if user is in guest mode
const isGuestMode = () => {
  return useGuestStore.getState().isGuestMode;
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
      hasBankroll: false,
      needsSync: true,

      setNeedsSync: (value: boolean) => {
        try {
          set({ needsSync: value });
        } catch (error) {
          console.error('Error setting needsSync:', error);
        }
      },

      clearStore: () => {
        try {
          set({
            sessions: [],
            filters: {},
            stats: defaultStats,
            bankroll: defaultBankroll,
            customStakes: [],
            isLoading: false,
            error: null,
            hasBankroll: false,
            needsSync: true,
          });
          AsyncStorage.removeItem('poker-sessions').catch(error => {
            console.error('Error clearing persisted data:', error);
          });
        } catch (error) {
          console.error('Error clearing store:', error);
        }
      },

      syncWithServer: async () => {
        try {
          // Skip server sync if in guest mode
          if (isGuestMode()) {
            console.log('Skipping server sync in guest mode');
            return;
          }

          if (!get().needsSync) return;
          set({ isLoading: true, error: null });
          
          // Verify authentication first
          const authState = await verifyAuth();
          if (!authState.isAuthenticated || !authState.userId) {
            throw new Error('User not authenticated or user ID missing');
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

          set((state) => ({
            sessions: formattedSessions,
            stats: calculateSessionStats(formattedSessions),
            isLoading: false,
            needsSync: false,
          }));

          // Only fetch bankroll if there is at least one session
          if (formattedSessions.length > 0) {
            const { data: bankrollData, error: bankrollError } = await supabase
              .from('bankroll')
              .select('*')
              .eq('user_id', authState.userId)
              .single();

            if (!bankrollError && bankrollData) {
              set({
                bankroll: {
                  currentAmount: bankrollData.current_amount || 0,
                  initialAmount: bankrollData.initial_amount || 0,
                  lastUpdated: bankrollData.last_updated,
                },
                hasBankroll: true,
              });
            }
          }

          set({ isLoading: false });
        } catch (error: any) {
          console.error('Error syncing with server:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      addSession: async (session) => {
        // Check if in guest mode
        if (isGuestMode()) {
          throw new Error('Cannot add sessions in guest mode. Please log in to save your data.');
        }

        set({ isLoading: true, error: null });
        try {
          // Get the current user session
          const { data: { user }, error: authError } = await supabase.auth.getUser();
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

          // First try a simple insert without select
          const { error: insertError } = await supabase
            .from('sessions')
            .insert([formattedSession]);

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to insert session: ${insertError.message}`);
          }
          
          // After successful insertion, sync sessions to update the local state
          await get().syncWithServer(); 

          // If bankroll is missing (initialAmount is 0 or null), set it to the profit from this session (or $0 if loss)
          const currentBankroll = get().bankroll;
          if ((currentBankroll.initialAmount === 0 || currentBankroll.initialAmount === null) && get().sessions.length === 1) {
            let profit = session.cashOut - session.buyIn;
            if (profit < 0) profit = 0;
            await get().updateBankroll(profit);
            set({ hasBankroll: true });
          } else {
            // Update bankroll with the new session's profit/loss
            const profit = session.cashOut - session.buyIn;
            await get().updateBankroll(currentBankroll.currentAmount + profit);
          }

          set(state => ({ isLoading: false, needsSync: true }));
          await get().syncWithServer(); // Ensure dashboard updates
        } catch (error: any) {
          console.error('Error adding session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      updateSession: async (id, session) => {
        // Check if in guest mode
        if (isGuestMode()) {
          throw new Error('Cannot update sessions in guest mode. Please log in to save your data.');
        }

        set({ isLoading: true, error: null });
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          const oldSession = get().sessions.find(s => s.id === id);

          const formattedUpdate: { [key: string]: any } = {};
          if (session.date) formattedUpdate.date = new Date(session.date).toISOString().split('T')[0];
          if (session.gameType !== undefined) formattedUpdate.gametype = session.gameType;
          if (session.sessionType !== undefined) formattedUpdate.sessiontype = session.sessionType;
          if (session.locationType !== undefined) formattedUpdate.locationtype = session.locationType;
          if (session.location !== undefined) formattedUpdate.location = session.location;
          if (session.stakes !== undefined) formattedUpdate.stakes = session.stakes;
          if (session.buyIn !== undefined) formattedUpdate.buyin = session.buyIn;
          if (session.cashOut !== undefined) formattedUpdate.cashout = session.cashOut;
          if (session.duration !== undefined) formattedUpdate.duration = session.duration;
          if (session.notes !== undefined) formattedUpdate.notes = session.notes;
          if (session.tags !== undefined) formattedUpdate.tags = session.tags;
          if (session.status !== undefined) formattedUpdate.status = session.status;
          if (session.startTime !== undefined) formattedUpdate.starttime = session.startTime ? new Date(session.startTime).toISOString() : null;
          if (session.endTime !== undefined) formattedUpdate.endtime = session.endTime ? new Date(session.endTime).toISOString() : null;

          const { data, error: updateError } = await supabase
            .from('sessions')
            .update(formattedUpdate)
            .eq('id', id)
            .select()
            .single();

          if (updateError) throw updateError;

          const formattedResponse = {
            id: data.id,
            date: data.date,
            gameType: data.gametype,
            sessionType: data.sessiontype,
            locationType: data.locationtype,
            location: data.location,
            stakes: data.stakes,
            buyIn: data.buyin,
            cashOut: data.cashout,
            duration: data.duration,
            notes: data.notes,
            tags: data.tags,
            status: data.status,
            startTime: data.starttime,
            endTime: data.endtime,
          };

          if (oldSession && formattedResponse.buyIn !== undefined && formattedResponse.cashOut !== undefined) {
            const oldProfit = oldSession.cashOut - oldSession.buyIn;
            const newProfit = formattedResponse.cashOut - formattedResponse.buyIn;
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
              isLoading: false,
              needsSync: true,
            };
          });
          await get().syncWithServer(); // Ensure dashboard updates
        } catch (error: any) {
          console.error('Error updating session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      deleteSession: async (id) => {
        // Check if in guest mode
        if (isGuestMode()) {
          throw new Error('Cannot delete sessions in guest mode. Please log in to save your data.');
        }

        set({ isLoading: true, error: null });
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          // Get the session to be deleted to calculate its profit/loss
          const sessionToDelete = get().sessions.find(s => s.id === id);
          
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Ensure only the user's sessions can be deleted

          if (error) throw error;

          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
            stats: calculateSessionStats(state.sessions.filter((session) => session.id !== id)),
            isLoading: false,
            needsSync: true,
          }));
          await get().syncWithServer(); // Ensure dashboard updates

          // Update bankroll after successful deletion
          if (sessionToDelete) {
            const profitToRemove = sessionToDelete.cashOut - sessionToDelete.buyIn;
            const currentBankroll = get().bankroll;
            await get().updateBankroll(currentBankroll.currentAmount - profitToRemove);
          }

        } catch (error: any) {
          console.error('Error deleting session:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      clearAllSessions: async () => {
        // Check if in guest mode
        if (isGuestMode()) {
          throw new Error('Cannot clear sessions in guest mode. Please log in to save your data.');
        }

        set({ isLoading: true, error: null });
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          // Delete all sessions for the current user
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({ 
            sessions: [], 
            stats: defaultStats, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Error clearing all sessions:', error);
          set({ error: error.message, isLoading: false });
        }
      },
      
      initializeStats: () => {
        const { sessions } = get();
        set({ stats: calculateSessionStats(sessions) });
      },
      
      updateBankroll: async (amount) => {
        // Check if in guest mode
        if (isGuestMode()) {
          throw new Error('Cannot update bankroll in guest mode. Please log in to save your data.');
        }

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

          // Update local state and hasBankroll immediately
          set((state) => ({
            bankroll: {
              ...state.bankroll,
              currentAmount: amount,
              initialAmount: existingBankroll?.initial_amount || amount,
              lastUpdated: new Date().toISOString(),
            },
            isLoading: false,
            hasBankroll: true,
            needsSync: true,
          }));
        } catch (error: any) {
          console.error('Error updating bankroll:', error);
          set({ error: error.message, isLoading: false });
        }
      },
      
      syncBankroll: async (userId) => {
        // Skip bankroll sync if in guest mode
        if (isGuestMode()) {
          console.log('Skipping bankroll sync in guest mode');
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // First check if the bankroll table exists for this user
          const { data: bankrollData, error } = await supabase
            .from('bankroll')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            // Handle case where no bankroll exists for new user
            if (error.code === 'PGRST116' || error.code === '406') {
              console.log('No bankroll found for user, creating initial record...');
              // Create initial bankroll for new user
              const initialBankrollData = {
                user_id: userId,
                current_amount: 0,
                initial_amount: 0,
                last_updated: new Date().toISOString()
              };

              const { error: insertError } = await supabase
                .from('bankroll')
                .insert([initialBankrollData]);

              if (insertError) {
                console.error('Error creating initial bankroll:', insertError);
                throw new Error('Failed to create initial bankroll record');
              }

              set(state => ({
                bankroll: {
                  currentAmount: 0,
                  initialAmount: 0,
                  lastUpdated: new Date().toISOString(),
                },
                isLoading: false
              }));
              return;
            }
            console.error('Error fetching bankroll:', error);
            throw new Error('Failed to fetch bankroll data');
          }

          set(state => ({
            bankroll: {
              currentAmount: bankrollData.current_amount || 0,
              initialAmount: bankrollData.initial_amount || 0,
              lastUpdated: bankrollData.last_updated,
            },
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Error syncing bankroll:', error);
          set({ 
            error: error.message || 'Failed to sync bankroll data', 
            isLoading: false,
            bankroll: {
              currentAmount: 0,
              initialAmount: 0,
              lastUpdated: new Date().toISOString(),
            }
          });
        }
      },
      
      addCustomStake: (stake) => {
        set((state) => {
          if (!state.customStakes.includes(stake)) {
            return { customStakes: [...state.customStakes, stake] };
          }
          return {};
        });
      },
      
      getFilteredSessions: () => {
        const { sessions, filters } = get();
        return filterSessions(sessions, filters);
      },
      
      calculateStats: () => {
        const { sessions } = get();
        return calculateSessionStats(sessions);
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
        filters: state.filters,
        bankroll: state.bankroll,
        customStakes: state.customStakes,
        hasBankroll: state.hasBankroll,
      }),
    }
  )
);

// Helper functions
function filterSessions(sessions: Session[], filters: SessionFilters): Session[] {
  return sessions.filter(session => {
    // Implement filtering logic based on your filters object
    // Example:
    if (filters.gameType && session.gameType !== filters.gameType) return false;
    if (filters.sessionType && session.sessionType !== filters.sessionType) return false;
    if (filters.locationType && session.locationType !== filters.locationType) return false;
    if (filters.minProfit !== undefined && (session.cashOut - session.buyIn) < filters.minProfit) return false;
    if (filters.maxProfit !== undefined && (session.cashOut - session.buyIn) > filters.maxProfit) return false;
    // Add more filters as needed
    return true;
  });
}

function calculateSessionStats(sessions: Session[]): SessionStats {
  const totalSessions = sessions.length;
  const totalProfit = sessions.reduce((sum, s) => sum + (s.cashOut - s.buyIn), 0);
  const totalHours = sessions.reduce((sum, s) => sum + (s.duration / 60), 0);
  const hourlyRate = totalHours > 0 ? totalProfit / totalHours : 0;

  const bestSession = sessions.reduce((max, s) => Math.max(max, s.cashOut - s.buyIn), 0);
  const worstSession = sessions.reduce((min, s) => Math.min(min, s.cashOut - s.buyIn), 0);

  let winningDays = 0;
  let losingDays = 0;
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;

  // Streak calculation (simple, assumes sessions are sorted by date)
  // You might need to sort sessions by date descending first if they are not
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of sortedSessions) {
    const profit = session.cashOut - session.buyIn;
    if (profit > 0) {
      winningDays++;
      currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      longestWinStreak = Math.max(longestWinStreak, currentStreak);
    } else if (profit < 0) {
      losingDays++;
      currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      longestLoseStreak = Math.min(longestLoseStreak, currentStreak);
    } else {
      currentStreak = 0; // Reset streak on break-even
    }
  }

  // Calculate location stats
  const locationStats: { [key: string]: { profit: number; sessions: number } } = {};
  sessions.forEach(session => {
    const location = session.location;
    const profit = session.cashOut - session.buyIn;
    if (locationStats[location]) {
      locationStats[location].profit += profit;
      locationStats[location].sessions++;
    } else {
      locationStats[location] = { profit, sessions: 1 };
    }
  });

  // console.log('Location stats:', locationStats);

  // Sort locations by profit (best to worst)
  const sortedLocations = Object.entries(locationStats).sort(([, a], [, b]) => b.profit - a.profit);

  // console.log('Sorted locations:', sortedLocations);

  // Find best location by profit
  const bestLocation = sortedLocations.length > 0 ? sortedLocations[0][0] : null;
  
  // console.log('Location stats for worst:', locationStats);

  // Sort locations by profit (worst to best)
  const sortedLocationsWorst = Object.entries(locationStats).sort(([, a], [, b]) => a.profit - b.profit);

  // console.log('Sorted locations for worst:', sortedLocationsWorst);

  // Find worst location by profit
  const worstLocation = sortedLocationsWorst.length > 0 ? sortedLocationsWorst[0][0] : null;

  return {
    totalSessions,
    totalProfit,
    totalHours,
    hourlyRate,
    bestSession,
    worstSession,
    winningDays,
    losingDays,
    currentStreak: Math.abs(currentStreak), // Return absolute value of current streak
    longestWinStreak,
    longestLoseStreak: Math.abs(longestLoseStreak), // Return absolute value of longest lose streak
    locationStats,
    bestLocation,
    worstLocation,
  };
}