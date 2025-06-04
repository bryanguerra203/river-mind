export const suits = [
  { value: 'hearts', symbol: '♥', color: '#E53935' },
  { value: 'diamonds', symbol: '♦', color: '#E53935' },
  { value: 'clubs', symbol: '♣', color: '#212121' },
  { value: 'spades', symbol: '♠', color: '#212121' },
];

export const ranks = [
  'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'
];

export const rankValues: Record<string, number> = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};