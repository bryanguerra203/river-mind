export interface BuyIn {
  id: string;
  amount: number;
  timestamp: string; // ISO string
}

export interface CashOut {
  id: string;
  amount: number;
  timestamp: string; // ISO string
}

export interface Player {
  id: string;
  name: string;
  buyIns: BuyIn[];
  totalBuyIn: number;
  cashOuts: CashOut[];
  totalCashOut: number;
  profit: number;
}

export interface GameSession {
  id: string;
  location: string;
  date: string; // ISO string
  players: Player[];
  potAmount: number;
  totalBuyIns: number;
  totalCashOuts: number;
  isActive: boolean;
  notes: string;
}