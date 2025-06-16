export interface BuyIn {
  id: string;
  amount: number;
  timestamp: string; // ISO string
  created_at: string;
}

export interface CashOut {
  id: string;
  playerId: string;
  amount: number;
  timestamp: string; // ISO string
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  buyIns: BuyIn[];
  totalBuyIn: number;
  cashOuts: CashOut[];
  totalCashOut: number;
  profit: number;
  created_at: string;
  updated_at: string;
  initialBuyIn?: number;
}

export interface GameSession {
  id: string;
  location: string;
  date: string; // ISO string
  players?: Player[];
  potAmount: number;
  totalBuyIns: number;
  totalCashOuts: number;
  isActive: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  duration?: number; // Duration in minutes
}