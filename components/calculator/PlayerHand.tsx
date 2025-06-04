import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/types/poker';
import { Trash2 } from 'lucide-react-native';
import CardSelector from './CardSelector';

export default function PlayerHand({
  player,
  onUpdateCards,
  onRemove,
  showRemoveButton,
  disabledCards,
  showResults
}: {
  player: {
    id: string;
    name: string;
    cards: Card[];
    winPercentage: number;
    tiePercentage: number;
  };
  onUpdateCards: (cards: Card[]) => void;
  onRemove: () => void;
  showRemoveButton: boolean;
  disabledCards: Card[];
  showResults: boolean;
}) {
  const handleSelectCard = (card: Card, index: number) => {
    const newCards = [...player.cards];
    
    if (index < newCards.length) {
      newCards[index] = card;
    } else {
      newCards.push(card);
    }
    
    onUpdateCards(newCards.slice(0, 2));
  };
  
  const clearCards = () => {
    onUpdateCards([]);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.actions}>
          {player.cards.length > 0 && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={clearCards}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
          {showRemoveButton && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeButton]} 
              onPress={onRemove}
            >
              <Trash2 size={16} color={colors.accent.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.cardsContainer}>
          <CardSelector
            selectedCards={player.cards}
            onSelectCard={handleSelectCard}
            maxCards={2}
            disabledCards={disabledCards}
          />
          {player.cards.length !== 2 && (
            <Text style={styles.unknownText}>Unknown Hand</Text>
          )}
        </View>
        
        {showResults && player.cards.length === 2 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.winPercentage}>
              {(player.winPercentage * 100).toFixed(1)}%
            </Text>
            {player.tiePercentage > 0 && (
              <Text style={styles.tiePercentage}>
                Tie: {(player.tiePercentage * 100).toFixed(1)}%
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    color: colors.accent.primary,
    fontSize: 14,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardsContainer: {
    flex: 2,
  },
  unknownText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  winPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  tiePercentage: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});