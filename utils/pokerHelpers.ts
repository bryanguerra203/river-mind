import { Card, HandType } from '@/types/poker';
import { rankValues } from '@/constants/pokerCards';

export function getSuitColor(suit: string): string {
  if (suit === 'hearts' || suit === 'diamonds') {
    return '#E53935'; // Red
  }
  return '#212121'; // Black
}

export function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
}

export function getCardValue(card: Card): number {
  return rankValues[card.rank] || 0;
}

export function getHandDescription(handType: HandType, cards: Card[]): string {
  switch (handType) {
    case 'high-card': {
      const highCard = [...cards].sort((a, b) => getCardValue(b) - getCardValue(a))[0];
      return `${highCard.rank} High`;
    }
    case 'pair': {
      // Find the pair
      const ranks = cards.map(card => card.rank);
      const pairRank = ranks.find(rank => ranks.filter(r => r === rank).length === 2);
      return `Pair of ${pairRank}s`;
    }
    case 'two-pair': {
      // Find the two pairs
      const ranks = cards.map(card => card.rank);
      const pairRanks = [...new Set(ranks)].filter(
        rank => ranks.filter(r => r === rank).length === 2
      ).sort((a, b) => rankValues[b] - rankValues[a]);
      
      if (pairRanks.length >= 2) {
        return `${pairRanks[0]}s and ${pairRanks[1]}s`;
      }
      return 'Two Pair';
    }
    case 'three-of-a-kind': {
      // Find the three of a kind
      const ranks = cards.map(card => card.rank);
      const tripRank = ranks.find(rank => ranks.filter(r => r === rank).length === 3);
      return `Three ${tripRank}s`;
    }
    case 'straight':
      return 'Five consecutive cards';
    case 'flush':
      return 'Five cards of the same suit';
    case 'full-house': {
      // Find the three of a kind and pair
      const ranks = cards.map(card => card.rank);
      const tripRank = ranks.find(rank => ranks.filter(r => r === rank).length === 3);
      const pairRank = ranks.find(rank => ranks.filter(r => r === rank).length === 2);
      
      if (tripRank && pairRank) {
        return `${tripRank}s full of ${pairRank}s`;
      }
      return 'Full House';
    }
    case 'four-of-a-kind': {
      // Find the four of a kind
      const ranks = cards.map(card => card.rank);
      const quadRank = ranks.find(rank => ranks.filter(r => r === rank).length === 4);
      return `Four ${quadRank}s`;
    }
    case 'straight-flush':
      return 'Straight of the same suit';
    case 'royal-flush':
      return 'A-K-Q-J-10 of the same suit';
    default:
      return '';
  }
}