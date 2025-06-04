import { Card, HandType } from '@/types/poker';
import { identifyHand } from './pokerCalculator';
import { rankValues } from '@/constants/pokerCards';

// Calculate winning odds for multiple players, including those with unknown hands
export async function calculateWinningOdds(
  playerCards: Card[][],
  communityCards: Card[],
  iterations: number = 5000
): Promise<{
  winPercentages: number[];
  tiePercentages: number[];
}> {
  // Filter out players without cards for calculation, but keep track of all players
  const validPlayerIndices = playerCards
    .map((cards, index) => ({ cards, index }))
    .filter(player => player.cards.length === 2)
    .map(player => player.index);
  
  const validPlayerCards = playerCards.filter(cards => cards.length === 2);
  const totalPlayers = playerCards.length;
  
  if (totalPlayers < 2) {
    throw new Error('At least two players are required');
  }
  
  // If only one player has cards, or none have cards, we'll simulate against random hands for others
  const simulateRandomHands = validPlayerCards.length <= 1;
  
  // Track wins and ties for each player
  const wins = Array(totalPlayers).fill(0);
  const ties = Array(totalPlayers).fill(0);
  
  // Get all cards that are already used
  const usedCards = new Set<string>();
  
  // Add known player cards to used cards
  validPlayerCards.flat().forEach(card => {
    usedCards.add(`${card.rank}-${card.suit}`);
  });
  
  // Add community cards to used cards
  communityCards.forEach(card => {
    usedCards.add(`${card.rank}-${card.suit}`);
  });
  
  // Create a deck of remaining cards
  const remainingDeck = createRemainingDeck(usedCards);
  
  // Run Monte Carlo simulations
  for (let i = 0; i < iterations; i++) {
    // Shuffle the deck for this iteration
    const shuffledDeck = shuffleArray([...remainingDeck]);
    
    // Determine how many more community cards we need
    const remainingCommunityCardsCount = 5 - communityCards.length;
    
    // Deal the remaining community cards for this simulation
    const simulatedCommunityCards = [
      ...communityCards,
      ...shuffledDeck.slice(0, remainingCommunityCardsCount)
    ];
    
    // Prepare player hands for this iteration
    let currentDeckIndex = remainingCommunityCardsCount;
    const iterationPlayerCards: Card[][] = playerCards.map((cards, index) => {
      if (cards.length === 2) {
        // Known hand, use as is
        return [...cards];
      } else {
        // Unknown hand, deal random cards
        const newCards = shuffledDeck.slice(currentDeckIndex, currentDeckIndex + 2);
        currentDeckIndex += 2;
        return newCards;
      }
    });
    
    // Evaluate each player's hand
    const handStrengths = iterationPlayerCards.map(playerHand => {
      const allCards = [...playerHand, ...simulatedCommunityCards];
      return evaluateHandStrength(allCards);
    });
    
    // Determine winner(s)
    const { winners, isTie } = determineWinners(handStrengths);
    
    // Update win/tie counts
    if (isTie) {
      winners.forEach(winnerIndex => {
        ties[winnerIndex]++;
      });
    } else if (winners.length === 1) {
      wins[winners[0]]++;
    }
  }
  
  // Calculate percentages
  const winPercentages = Array(totalPlayers).fill(0);
  const tiePercentages = Array(totalPlayers).fill(0);
  
  playerCards.forEach((_, index) => {
    winPercentages[index] = wins[index] / iterations;
    tiePercentages[index] = ties[index] / iterations;
  });
  
  return {
    winPercentages,
    tiePercentages
  };
}

// Create a deck of remaining cards
function createRemainingDeck(usedCards: Set<string>): Card[] {
  const deck: Card[] = [];
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      const cardKey = `${rank}-${suit}`;
      if (!usedCards.has(cardKey)) {
        deck.push({ rank, suit });
      }
    }
  }
  
  return deck;
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Evaluate hand strength (returns a numeric value for comparison)
function evaluateHandStrength(cards: Card[]): {
  handType: HandType;
  handRank: number;
  tiebreakers: number[];
} {
  const { handType } = identifyHand(cards);
  
  // Assign a rank to each hand type
  const handTypeRanks: Record<HandType, number> = {
    'high-card': 1,
    'pair': 2,
    'two-pair': 3,
    'three-of-a-kind': 4,
    'straight': 5,
    'flush': 6,
    'full-house': 7,
    'four-of-a-kind': 8,
    'straight-flush': 9,
    'royal-flush': 10
  };
  
  // Calculate tiebreakers based on hand type
  const tiebreakers = calculateTiebreakers(cards, handType);
  
  return {
    handType,
    handRank: handTypeRanks[handType],
    tiebreakers
  };
}

// Calculate tiebreakers for a hand
function calculateTiebreakers(cards: Card[], handType: HandType): number[] {
  // Sort cards by rank (high to low)
  const sortedCards = [...cards].sort((a, b) => 
    rankValues[b.rank] - rankValues[a.rank]
  );
  
  // Get rank values
  const rankVals = sortedCards.map(card => rankValues[card.rank]);
  
  // Count occurrences of each rank
  const rankCounts: Record<number, number> = {};
  rankVals.forEach(val => {
    rankCounts[val] = (rankCounts[val] || 0) + 1;
  });
  
  // Sort ranks by count (high to low) and then by rank value (high to low)
  const sortedRanks = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: parseInt(rank), count }))
    .sort((a, b) => 
      b.count - a.count || b.rank - a.rank
    )
    .map(item => item.rank);
  
  switch (handType) {
    case 'high-card':
      // Return the 5 highest cards
      return rankVals.slice(0, 5);
      
    case 'pair':
      // Return the pair rank, then the 3 highest kickers
      return [
        sortedRanks[0],
        ...rankVals.filter(val => val !== sortedRanks[0]).slice(0, 3)
      ];
      
    case 'two-pair':
      // Return the higher pair, lower pair, then highest kicker
      return [
        sortedRanks[0],
        sortedRanks[1],
        ...rankVals.filter(val => val !== sortedRanks[0] && val !== sortedRanks[1]).slice(0, 1)
      ];
      
    case 'three-of-a-kind':
      // Return the trips rank, then the 2 highest kickers
      return [
        sortedRanks[0],
        ...rankVals.filter(val => val !== sortedRanks[0]).slice(0, 2)
      ];
      
    case 'straight':
      // Return the highest card in the straight
      const straight = findStraight(sortedCards);
      return straight ? [rankValues[straight[0].rank]] : [0];
      
    case 'flush':
      // Return the 5 highest cards of the flush suit
      const flushSuit = findFlushSuit(sortedCards);
      if (flushSuit) {
        return sortedCards
          .filter(card => card.suit === flushSuit)
          .slice(0, 5)
          .map(card => rankValues[card.rank]);
      }
      return [0];
      
    case 'full-house':
      // Return the trips rank, then the pair rank
      return [sortedRanks[0], sortedRanks[1]];
      
    case 'four-of-a-kind':
      // Return the quads rank, then the highest kicker
      return [
        sortedRanks[0],
        ...rankVals.filter(val => val !== sortedRanks[0]).slice(0, 1)
      ];
      
    case 'straight-flush':
    case 'royal-flush':
      // Return the highest card in the straight flush
      const straightFlushCards = findStraightFlush(sortedCards);
      return straightFlushCards ? [rankValues[straightFlushCards[0].rank]] : [0];
      
    default:
      return [];
  }
}

// Find a straight in a set of cards
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

// Find the suit of a flush
function findFlushSuit(cards: Card[]): string | null {
  const suitCounts: Record<string, number> = {};
  
  cards.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count >= 5) {
      return suit;
    }
  }
  
  return null;
}

// Find a straight flush in a set of cards
function findStraightFlush(cards: Card[]): Card[] | null {
  const flushSuit = findFlushSuit(cards);
  
  if (!flushSuit) return null;
  
  const flushCards = cards.filter(card => card.suit === flushSuit);
  
  return findStraight(flushCards);
}

// Determine winners from hand strengths
function determineWinners(handStrengths: {
  handType: HandType;
  handRank: number;
  tiebreakers: number[];
}[]): {
  winners: number[];
  isTie: boolean;
} {
  // Find the highest hand rank
  const maxHandRank = Math.max(...handStrengths.map(h => h.handRank));
  
  // Filter players with the highest hand rank
  const highestHands = handStrengths
    .map((hand, index) => ({ hand, index }))
    .filter(item => item.hand.handRank === maxHandRank);
  
  if (highestHands.length === 1) {
    // Clear winner
    return {
      winners: [highestHands[0].index],
      isTie: false
    };
  }
  
  // Compare tiebreakers
  const tiebreakersLength = highestHands[0].hand.tiebreakers.length;
  
  for (let i = 0; i < tiebreakersLength; i++) {
    // Find max value for this tiebreaker
    const maxTiebreaker = Math.max(
      ...highestHands.map(item => item.hand.tiebreakers[i])
    );
    
    // Filter hands with max tiebreaker
    const handsWithMaxTiebreaker = highestHands.filter(
      item => item.hand.tiebreakers[i] === maxTiebreaker
    );
    
    if (handsWithMaxTiebreaker.length < highestHands.length) {
      // We have a winner or fewer ties
      return {
        winners: handsWithMaxTiebreaker.map(item => item.index),
        isTie: handsWithMaxTiebreaker.length > 1
      };
    }
    
    // If all hands have the same tiebreaker, continue to the next one
  }
  
  // If we get here, all tiebreakers are equal - it's a tie
  return {
    winners: highestHands.map(item => item.index),
    isTie: true
  };
}