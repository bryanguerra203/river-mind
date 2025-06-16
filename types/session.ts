export interface Session {
  id: string;
  date: string; // ISO string
  gameType: string;
  sessionType: string;
  locationType: string;
  location: string;
  stakes: string;
  buyIn: number;
  cashOut: number;
  duration: number; // in minutes
  notes: string;
  tags: string[];
  status: 'past' | 'current'; // Added to track session status
  startTime?: string; // ISO string - when live session started
  endTime?: string; // ISO string - when live session ended
}

export interface SessionStats {
  totalSessions: number;
  totalProfit: number;
  totalHours: number;
  hourlyRate: number;
  bestSession: number;
  worstSession: number;
  winningDays: number;
  losingDays: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  locationStats: { [key: string]: { profit: number; sessions: number } };
  bestLocation: string | null;
  worstLocation: string | null;
}

export interface SessionFilters {
  gameType?: string;
  sessionType?: string;
  locationType?: string;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  stakes?: string;
  status?: 'past' | 'current'; // Added to filter by session status
  minProfit?: number;
  maxProfit?: number;
}

export interface Bankroll {
  currentAmount: number;
  initialAmount: number;
  lastUpdated: string; // ISO string
}