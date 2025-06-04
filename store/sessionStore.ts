import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, SessionFilters, SessionStats, Bankroll } from '@/types/session';
import { defaultStakes } from '@/constants/gameTypes';

interface SessionState {
  sessions: Session[];
  filters: SessionFilters;
  stats: SessionStats;
  bankroll: Bankroll;
  customStakes: string[];
  
  // Actions
  addSession: (session: Session) => void;
  updateSession: (id: string, session: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  setFilters: (filters: SessionFilters) => void;
  clearFilters: () => void;
  clearAllSessions: () => void;
  initializeStats: () => void;
  updateBankroll: (amount: number) => void;
  addCustomStake: (stake: string) => void;
  
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

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      filters: {},
      stats: defaultStats,
      bankroll: defaultBankroll,
      customStakes: [],
      
      addSession: (session) => {
        set((state) => {
          const newSessions = [...state.sessions, session];
          const newStats = calculateSessionStats(newSessions);
          const profit = session.cashOut - session.buyIn;
          const newBankroll = {
            ...state.bankroll,
            currentAmount: state.bankroll.currentAmount + profit,
            lastUpdated: new Date().toISOString(),
          };
          console.log("New session added, total sessions:", newSessions.length);
          return { 
            sessions: newSessions,
            stats: newStats,
            bankroll: newBankroll,
          };
        });
      },
      
      updateSession: (id, updatedSession) => {
        set((state) => {
          const oldSession = state.sessions.find(s => s.id === id);
          const newSessions = state.sessions.map((session) => 
            session.id === id ? { ...session, ...updatedSession } : session
          );
          const newStats = calculateSessionStats(newSessions);
          let newBankroll = state.bankroll;
          if (oldSession && updatedSession.buyIn !== undefined && updatedSession.cashOut !== undefined) {
            const oldProfit = oldSession.cashOut - oldSession.buyIn;
            const newProfit = updatedSession.cashOut - updatedSession.buyIn;
            newBankroll = {
              ...state.bankroll,
              currentAmount: state.bankroll.currentAmount - oldProfit + newProfit,
              lastUpdated: new Date().toISOString(),
            };
          }
          return { 
            sessions: newSessions,
            stats: newStats,
            bankroll: newBankroll,
          };
        });
      },
      
      deleteSession: (id) => {
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
          };
        });
      },
      
      setFilters: (filters) => {
        set({ filters });
      },
      
      clearFilters: () => {
        set({ filters: {} });
      },
      
      clearAllSessions: () => {
        set({
          sessions: [],
          stats: defaultStats,
          bankroll: defaultBankroll,
        });
      },
      
      initializeStats: () => {
        set((state) => ({
          stats: calculateSessionStats(state.sessions)
        }));
      },
      
      updateBankroll: (amount) => {
        set((state) => ({
          bankroll: {
            ...state.bankroll,
            currentAmount: amount,
            initialAmount: state.bankroll.initialAmount === 0 ? amount : state.bankroll.initialAmount,
            lastUpdated: new Date().toISOString(),
          }
        }));
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
        // Don't persist filters or stats as they can be recalculated
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
  
  sortedSessions.forEach((session) => {
    const profit = session.cashOut - session.buyIn;
    const hours = session.duration / 60;
    
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
  
  return {
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
}