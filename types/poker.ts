export interface Card {
  rank: string;
  suit: string;
}

export type HandType = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandResult {
  handType: HandType;
  cards: Card[];
  description?: string;
}