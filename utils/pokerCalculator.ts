import { Card, HandResult, HandType } from '@/types/poker';
import { rankValues } from '@/constants/pokerCards';

// Identify the current hand type
export function identifyHand(cards: Card[]): HandResult {
  if (cards.length < 2) {
    return { handType: 'high-card', cards };
  }
  
  // Sort cards by rank (high to low)
  const sortedCards = [...cards].sort((a, b) => 
    rankValues[b.rank] - rankValues[a.rank]
  );
  
  // Check for royal flush
  if (isRoyalFlush(sortedCards)) {
    return { handType: 'royal-flush', cards: sortedCards };
  }
  
  // Check for straight flush
  if (isStraightFlush(sortedCards)) {
    return { handType: 'straight-flush', cards: sortedCards };
  }
  
  // Check for four of a kind
  if (isFourOfAKind(sortedCards)) {
    return { handType: 'four-of-a-kind', cards: sortedCards };
  }
  
  // Check for full house
  if (isFullHouse(sortedCards)) {
    return { handType: 'full-house', cards: sortedCards };
  }
  
  // Check for flush
  if (isFlush(sortedCards)) {
    return { handType: 'flush', cards: sortedCards };
  }
  
  // Check for straight
  if (isStraight(sortedCards)) {
    return { handType: 'straight', cards: sortedCards };
  }
  
  // Check for three of a kind
  if (isThreeOfAKind(sortedCards)) {
    return { handType: 'three-of-a-kind', cards: sortedCards };
  }
  
  // Check for two pair
  if (isTwoPair(sortedCards)) {
    return { handType: 'two-pair', cards: sortedCards };
  }
  
  // Check for pair
  if (isPair(sortedCards)) {
    return { handType: 'pair', cards: sortedCards };
  }
  
  // High card
  return { handType: 'high-card', cards: sortedCards };
}

// Calculate poker odds
export function calculatePokerOdds(holeCards: Card[], communityCards: Card[]): {
  turnOdds: number;
  riverOdds: number;
  combinedOdds: number;
  outs: number;
} {
  // Combine hole cards and community cards
  const allCards = [...holeCards, ...communityCards];
  
  // Identify current hand
  const currentHand = identifyHand(allCards);
  
  // Calculate outs (cards that improve the hand)
  const outs = calculateOuts(holeCards, communityCards, currentHand.handType);
  
  // Calculate odds based on outs and remaining cards
  const remainingCards = 52 - allCards.length;
  
  // Calculate odds for turn (if we're pre-flop or on the flop)
  let turnOdds = 0;
  if (communityCards.length <= 3) {
    turnOdds = outs / remainingCards;
  }
  
  // Calculate odds for river (if we're pre-flop, on the flop, or on the turn)
  let riverOdds = 0;
  if (communityCards.length <= 4) {
    // If we're on the turn, just calculate river odds
    if (communityCards.length === 4) {
      riverOdds = outs / remainingCards;
    } else {
      // If we're pre-flop or on the flop, calculate river odds assuming we missed on the turn
      riverOdds = outs / (remainingCards - 1);
    }
  }
  
  // Calculate combined odds of hitting on either turn or river
  // P(A or B) = P(A) + P(B) - P(A and B)
  const combinedOdds = turnOdds + riverOdds - (turnOdds * riverOdds);
  
  return {
    turnOdds,
    riverOdds,
    combinedOdds,
    outs,
  };
}

// Helper functions for hand identification
function isRoyalFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  // Check if we have a straight flush
  if (!isStraightFlush(cards)) return false;
  
  // Check if the highest card is an Ace
  const sameSuitCards = getSameSuitCards(cards);
  const straightCards = findStraight(sameSuitCards);
  
  if (straightCards && straightCards.length >= 5) {
    return straightCards[0].rank === 'A';
  }
  
  return false;
}

function isStraightFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  // Get cards of the same suit
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  for (const suit of suits) {
    const sameSuitCards = cards.filter(card => card.suit === suit);
    
    if (sameSuitCards.length >= 5) {
      // Check if these cards form a straight
      const straight = findStraight(sameSuitCards);
      if (straight && straight.length >= 5) {
        return true;
      }
    }
  }
  
  return false;
}

function isFourOfAKind(cards: Card[]): boolean {
  if (cards.length < 4) return false;
  
  const rankCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  return Object.values(rankCounts).some(count => count >= 4);
}

function isFullHouse(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  const rankCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const counts = Object.values(rankCounts);
  return counts.includes(3) && counts.includes(2);
}

function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  const suitCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  return Object.values(suitCounts).some(count => count >= 5);
}

function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  
  const straight = findStraight(cards);
  return straight !== null && straight.length >= 5;
}

function isThreeOfAKind(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  
  const rankCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  return Object.values(rankCounts).some(count => count >= 3);
}

function isTwoPair(cards: Card[]): boolean {
  if (cards.length < 4) return false;
  
  const rankCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const pairs = Object.values(rankCounts).filter(count => count >= 2);
  return pairs.length >= 2;
}

function isPair(cards: Card[]): boolean {
  if (cards.length < 2) return false;
  
  const rankCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  return Object.values(rankCounts).some(count => count >= 2);
}

// Helper function to find a straight in a set of cards
function findStraight(cards: Card[]): Card[] | null {
  if (cards.length < 5) return null;
  
  // Sort cards by rank (high to low)
  const sortedCards = [...cards].sort((a, b) => 
    rankValues[b.rank] - rankValues[a.rank]
  );
  
  // Get unique ranks
  const uniqueRanks = Array.from(new Set(sortedCards.map(card => rankValues[card.rank])));
  
  // Handle Ace low straight (A-2-3-4-5)
  if (uniqueRanks.includes(14)) { // Ace
    uniqueRanks.push(1); // Add Ace as 1 for low straight
  }
  
  // Find 5 consecutive ranks
  let consecutiveCount = 1;
  let startIndex = 0;
  
  for (let i = 1; i < uniqueRanks.length; i++) {
    if (uniqueRanks[i] === uniqueRanks[i - 1] - 1) {
      consecutiveCount++;
      if (consecutiveCount >= 5) {
        // Found 5 consecutive ranks
        const straightRanks = uniqueRanks.slice(startIndex, startIndex + 5);
        
        // Map ranks back to cards
        return sortedCards.filter(card => {
          const value = rankValues[card.rank];
          return straightRanks.includes(value) || 
                 (value === 14 && straightRanks.includes(1)); // Handle Ace for low straight
        }).slice(0, 5);
      }
    } else {
      consecutiveCount = 1;
      startIndex = i;
    }
  }
  
  return null;
}

// Helper function to get cards of the same suit
function getSameSuitCards(cards: Card[]): Card[] {
  const suitCounts: Record<string, Card[]> = {};
  
  cards.forEach(card => {
    if (!suitCounts[card.suit]) {
      suitCounts[card.suit] = [];
    }
    suitCounts[card.suit].push(card);
  });
  
  // Find the suit with the most cards
  let maxSuit = '';
  let maxCount = 0;
  
  Object.entries(suitCounts).forEach(([suit, suitCards]) => {
    if (suitCards.length > maxCount) {
      maxCount = suitCards.length;
      maxSuit = suit;
    }
  });
  
  return suitCounts[maxSuit] || [];
}

// Calculate outs (cards that improve the hand)
function calculateOuts(holeCards: Card[], communityCards: Card[], currentHandType: HandType): number {
  const allCards = [...holeCards, ...communityCards];
  
  // Get all cards that are already used
  const usedCards = new Set<string>();
  allCards.forEach(card => {
    usedCards.add(`${card.rank}-${card.suit}`);
  });
  
  let outs = 0;
  
  // Based on current hand type, calculate potential outs
  switch (currentHandType) {
    case 'high-card':
      // Outs for pair
      outs += countPairOuts(allCards, usedCards);
      // Outs for flush draw
      outs += countFlushDrawOuts(allCards, usedCards);
      // Outs for straight draw
      outs += countStraightDrawOuts(allCards, usedCards);
      break;
      
    case 'pair':
      // Outs for two pair or three of a kind
      outs += countTwoPairOuts(allCards, usedCards);
      // Outs for flush draw
      outs += countFlushDrawOuts(allCards, usedCards);
      // Outs for straight draw
      outs += countStraightDrawOuts(allCards, usedCards);
      break;
      
    case 'two-pair':
      // Outs for full house
      outs += countFullHouseOuts(allCards, usedCards);
      break;
      
    case 'three-of-a-kind':
      // Outs for full house or four of a kind
      outs += countFullHouseFromTripsOuts(allCards, usedCards);
      break;
      
    case 'straight':
      // Outs for flush or higher straight
      outs += countFlushDrawOuts(allCards, usedCards);
      break;
      
    case 'flush':
      // Outs for straight flush
      outs += countStraightFlushOuts(allCards, usedCards);
      break;
      
    case 'full-house':
      // Outs for four of a kind
      outs += countFourOfAKindOuts(allCards, usedCards);
      break;
      
    default:
      // For already strong hands, fewer outs to improve
      outs = 0;
  }
  
  return outs;
}

// Helper functions to count specific outs
function countPairOuts(cards: Card[], usedCards: Set<string>): number {
  // Count outs for making a pair with hole cards
  const holeCardRanks = cards.slice(0, 2).map(card => card.rank);
  let outs = 0;
  
  holeCardRanks.forEach(rank => {
    // 3 more cards of this rank could be outs
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
      const cardKey = `${rank}-${suit}`;
      if (!usedCards.has(cardKey)) {
        outs++;
      }
    }
  });
  
  return outs;
}

function countTwoPairOuts(cards: Card[], usedCards: Set<string>): number {
  // Find the pair
  const rankCounts: Record<string, number> = {};
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
  if (!pairRank) return 0;
  
  // Count outs for making trips with the pair
  let outs = 0;
  for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
    const cardKey = `${pairRank}-${suit}`;
    if (!usedCards.has(cardKey)) {
      outs++;
    }
  }
  
  return outs;
}

function countFlushDrawOuts(cards: Card[], usedCards: Set<string>): number {
  // Count cards by suit
  const suitCounts: Record<string, number> = {};
  cards.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  // Check for flush draw (4 cards of the same suit)
  const flushSuit = Object.keys(suitCounts).find(suit => suitCounts[suit] === 4);
  if (!flushSuit) return 0;
  
  // Count remaining cards of that suit
  let outs = 0;
  for (const rank of Object.keys(rankValues)) {
    const cardKey = `${rank}-${flushSuit}`;
    if (!usedCards.has(cardKey)) {
      outs++;
    }
  }
  
  return outs;
}

function countStraightDrawOuts(cards: Card[], usedCards: Set<string>): number {
  // Get unique ranks
  const cardValues = cards.map(card => rankValues[card.rank]);
  const uniqueValues = Array.from(new Set(cardValues)).sort((a, b) => a - b);
  
  // Check for open-ended straight draw (4 consecutive cards)
  let outs = 0;
  
  for (let i = 0; i <= uniqueValues.length - 4; i++) {
    const consecutive = uniqueValues.slice(i, i + 4);
    if (consecutive[3] - consecutive[0] === 3) {
      // Open-ended straight draw
      // Check for lower out
      if (consecutive[0] > 2) { // Not at bottom of deck
        const lowerOut = consecutive[0] - 1;
        for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
          const rankKey = Object.keys(rankValues).find(
            key => rankValues[key] === lowerOut
          );
          if (rankKey) {
            const cardKey = `${rankKey}-${suit}`;
            if (!usedCards.has(cardKey)) {
              outs++;
            }
          }
        }
      }
      
      // Check for higher out
      if (consecutive[3] < 14) { // Not at top of deck
        const higherOut = consecutive[3] + 1;
        for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
          const rankKey = Object.keys(rankValues).find(
            key => rankValues[key] === higherOut
          );
          if (rankKey) {
            const cardKey = `${rankKey}-${suit}`;
            if (!usedCards.has(cardKey)) {
              outs++;
            }
          }
        }
      }
    }
  }
  
  // Check for gutshot straight draw
  for (let i = 0; i <= uniqueValues.length - 4; i++) {
    for (let j = i + 1; j <= uniqueValues.length - 3; j++) {
      const values = [
        uniqueValues[i],
        uniqueValues[i + 1],
        uniqueValues[j],
        uniqueValues[j + 1]
      ];
      
      if (values[3] - values[0] === 4) {
        // There's a gap of 1
        const missingValue = values[0] + (values[3] - values[0]) / 2;
        
        for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
          const rankKey = Object.keys(rankValues).find(
            key => rankValues[key] === missingValue
          );
          if (rankKey) {
            const cardKey = `${rankKey}-${suit}`;
            if (!usedCards.has(cardKey)) {
              outs++;
            }
          }
        }
      }
    }
  }
  
  return outs;
}

function countFullHouseOuts(cards: Card[], usedCards: Set<string>): number {
  // Find the two pairs
  const rankCounts: Record<string, number> = {};
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const pairRanks = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 2);
  if (pairRanks.length < 2) return 0;
  
  // Count outs for making a full house (turning either pair into trips)
  let outs = 0;
  
  pairRanks.forEach(rank => {
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
      const cardKey = `${rank}-${suit}`;
      if (!usedCards.has(cardKey)) {
        outs++;
      }
    }
  });
  
  return outs;
}

function countFullHouseFromTripsOuts(cards: Card[], usedCards: Set<string>): number {
  // Find the three of a kind and other ranks
  const rankCounts: Record<string, number> = {};
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3);
  if (!tripRank) return 0;
  
  // Count outs for making four of a kind
  let outsForQuads = 0;
  for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
    const cardKey = `${tripRank}-${suit}`;
    if (!usedCards.has(cardKey)) {
      outsForQuads++;
    }
  }
  
  // Count outs for making a full house (any pair from other cards)
  let outsForFullHouse = 0;
  Object.keys(rankCounts).forEach(rank => {
    if (rank !== tripRank && rankCounts[rank] === 1) {
      for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
        const cardKey = `${rank}-${suit}`;
        if (!usedCards.has(cardKey)) {
          outsForFullHouse++;
        }
      }
    }
  });
  
  return outsForQuads + outsForFullHouse;
}

function countStraightFlushOuts(cards: Card[], usedCards: Set<string>): number {
  // This is a complex calculation that would require checking for both straight and flush draws
  // Simplified version: check if we have 4 cards to a straight flush
  const suitCounts: Record<string, Card[]> = {};
  
  cards.forEach(card => {
    if (!suitCounts[card.suit]) {
      suitCounts[card.suit] = [];
    }
    suitCounts[card.suit].push(card);
  });
  
  let outs = 0;
  
  Object.values(suitCounts).forEach(suitCards => {
    if (suitCards.length >= 4) {
      // Check for straight draw within this suit
      const values = suitCards.map(card => rankValues[card.rank])
        .sort((a, b) => a - b);
      
      // Check for 4 consecutive cards
      for (let i = 0; i <= values.length - 4; i++) {
        if (values[i + 3] - values[i] === 3) {
          // We have 4 consecutive cards of the same suit
          // Check for lower out
          if (values[i] > 2) {
            const lowerOut = values[i] - 1;
            const rankKey = Object.keys(rankValues).find(
              key => rankValues[key] === lowerOut
            );
            if (rankKey) {
              const cardKey = `${rankKey}-${suitCards[0].suit}`;
              if (!usedCards.has(cardKey)) {
                outs++;
              }
            }
          }
          
          // Check for higher out
          if (values[i + 3] < 14) {
            const higherOut = values[i + 3] + 1;
            const rankKey = Object.keys(rankValues).find(
              key => rankValues[key] === higherOut
            );
            if (rankKey) {
              const cardKey = `${rankKey}-${suitCards[0].suit}`;
              if (!usedCards.has(cardKey)) {
                outs++;
              }
            }
          }
        }
      }
    }
  });
  
  return outs;
}

function countFourOfAKindOuts(cards: Card[], usedCards: Set<string>): number {
  // Find the three of a kind in the full house
  const rankCounts: Record<string, number> = {};
  cards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3);
  if (!tripRank) return 0;
  
  // Count outs for making four of a kind
  let outs = 0;
  for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
    const cardKey = `${tripRank}-${suit}`;
    if (!usedCards.has(cardKey)) {
      outs++;
    }
  }
  
  return outs;
}