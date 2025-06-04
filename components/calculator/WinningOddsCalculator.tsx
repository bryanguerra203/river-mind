import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/types/poker';
import { Plus, Trash2, Play, User } from 'lucide-react-native';
import CardSelector from './CardSelector';
import PlayerHand from './PlayerHand';
import { calculateWinningOdds } from '@/utils/pokerEquityCalculator';

interface Player {
  id: string;
  name: string;
  cards: Card[];
  winPercentage: number;
  tiePercentage: number;
}

export default function WinningOddsCalculator() {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', cards: [], winPercentage: 0, tiePercentage: 0 },
    { id: '2', name: 'Player 2', cards: [], winPercentage: 0, tiePercentage: 0 },
  ]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const addPlayer = () => {
    if (players.length < 9) {
      setPlayers([
        ...players,
        {
          id: (players.length + 1).toString(),
          name: `Player ${players.length + 1}`,
          cards: [],
          winPercentage: 0,
          tiePercentage: 0
        }
      ]);
      // Scroll to the bottom after adding a new player
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  const removePlayer = (playerId: string) => {
    if (players.length > 2) {
      const updatedPlayers = players
        .filter(player => player.id !== playerId)
        .map((player, index) => ({
          ...player,
          id: (index + 1).toString(),
          name: `Player ${index + 1}`
        }));
      setPlayers(updatedPlayers);
    }
  };
  
  const updatePlayerCards = (playerId: string, cards: Card[]) => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, cards } : player
    ));
    setResultsReady(false);
  };
  
  const handleSelectCommunityCard = (card: Card, index: number) => {
    const newCommunityCards = [...communityCards];
    
    if (index < newCommunityCards.length) {
      newCommunityCards[index] = card;
    } else {
      newCommunityCards.push(card);
    }
    
    setCommunityCards(newCommunityCards.slice(0, 5));
    setResultsReady(false);
  };
  
  const clearCommunityCards = () => {
    setCommunityCards([]);
    setResultsReady(false);
  };
  
  const resetCalculator = () => {
    setPlayers([
      { id: '1', name: 'Player 1', cards: [], winPercentage: 0, tiePercentage: 0 },
      { id: '2', name: 'Player 2', cards: [], winPercentage: 0, tiePercentage: 0 },
    ]);
    setCommunityCards([]);
    setResultsReady(false);
  };
  
  const calculateOdds = async () => {
    setCalculating(true);
    
    try {
      // Get all selected cards to pass as used cards
      const allSelectedCards = [
        ...communityCards,
        ...players.flatMap(player => player.cards)
      ];
      
      // Run the equity calculation
      const results = await calculateWinningOdds(
        players.map(p => p.cards),
        communityCards,
        5000 // number of simulations
      );
      
      // Update players with results
      setPlayers(players.map((player, index) => ({
        ...player,
        winPercentage: results.winPercentages[index] || 0,
        tiePercentage: results.tiePercentages[index] || 0
      })));
      
      setResultsReady(true);
    } catch (error) {
      console.error('Error calculating odds:', error);
      alert('Error calculating odds. Please try again.');
    } finally {
      setCalculating(false);
    }
  };
  
  // Get all cards that are already selected by any player or in community cards
  const getAllSelectedCards = (): Card[] => {
    return [
      ...communityCards,
      ...players.flatMap(player => player.cards)
    ];
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Players</Text>
          {players.length < 9 && (
            <TouchableOpacity 
              style={styles.addPlayerButton} 
              onPress={addPlayer}
            >
              <Plus size={16} color={colors.text.primary} />
              <Text style={styles.addPlayerText}>Add Player</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          style={styles.playersContainer}
          ref={scrollViewRef}
        >
          {players.map((player) => (
            <PlayerHand
              key={player.id}
              player={player}
              onUpdateCards={(cards) => updatePlayerCards(player.id, cards)}
              onRemove={() => removePlayer(player.id)}
              showRemoveButton={players.length > 2}
              disabledCards={getAllSelectedCards().filter(card => 
                !player.cards.some(c => c.rank === card.rank && c.suit === card.suit)
              )}
              showResults={resultsReady}
            />
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Cards</Text>
          {communityCards.length > 0 && (
            <TouchableOpacity onPress={clearCommunityCards}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <CardSelector 
          selectedCards={communityCards}
          onSelectCard={handleSelectCommunityCard}
          maxCards={5}
          showPositions
          disabledCards={players.flatMap(player => player.cards)}
        />
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.calculateButton, calculating && styles.disabledButton]}
          onPress={calculateOdds}
          disabled={calculating}
        >
          {calculating ? (
            <ActivityIndicator color={colors.text.primary} size="small" />
          ) : (
            <>
              <Play size={20} color={colors.text.primary} />
              <Text style={styles.calculateText}>Calculate Odds</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetCalculator}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
      
      {resultsReady && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          <Text style={styles.resultsSubtitle}>
            Based on {communityCards.length > 0 ? 
              `${communityCards.length} community cards` : 
              'pre-flop analysis'}
            {players.filter(p => p.cards.length === 2).length <= 1 ? 
              ' (vs random hands)' : ''}
          </Text>
          
          {players
            .sort((a, b) => b.winPercentage - a.winPercentage)
            .map((player, index) => (
              <View key={player.id} style={styles.resultRow}>
                <View style={styles.resultRank}>
                  <Text style={styles.resultRankText}>{index + 1}</Text>
                </View>
                <View style={styles.resultNameContainer}>
                  <User size={16} color={colors.text.secondary} />
                  <Text style={styles.resultName}>{player.name}</Text>
                  {player.cards.length !== 2 && (
                    <Text style={styles.unknownText}>(Unknown)</Text>
                  )}
                </View>
                <View style={styles.resultPercentages}>
                  <Text style={styles.winPercentage}>
                    {(player.winPercentage * 100).toFixed(1)}%
                  </Text>
                  {player.tiePercentage > 0 && (
                    <Text style={styles.tiePercentage}>
                      Tie: {(player.tiePercentage * 100).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clearText: {
    color: colors.accent.primary,
    fontSize: 14,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addPlayerText: {
    color: colors.text.primary,
    marginLeft: 6,
    fontSize: 14,
  },
  playersContainer: {
    maxHeight: 400,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  calculateButton: {
    flex: 3,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  calculateText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetText: {
    color: colors.accent.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background.input,
    borderRadius: 8,
    padding: 12,
  },
  resultRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultRankText: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  resultNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultName: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  unknownText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginLeft: 8,
  },
  resultPercentages: {
    alignItems: 'flex-end',
  },
  winPercentage: {
    color: colors.accent.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  tiePercentage: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
});