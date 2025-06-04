import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Card } from '@/types/poker';
import { colors } from '@/constants/colors';
import PlayingCard from './PlayingCard';
import { suits, ranks } from '@/constants/pokerCards';

interface CardSelectorProps {
  selectedCards: Card[];
  onSelectCard: (card: Card, index: number) => void;
  maxCards: number;
  showPositions?: boolean;
  disabledCards?: Card[]; // Cards that are already selected elsewhere
}

export default function CardSelector({
  selectedCards,
  onSelectCard,
  maxCards,
  showPositions = false,
  disabledCards = [],
}: CardSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  
  const handleCardPress = (index: number) => {
    setSelectedIndex(index);
    setSelectedSuit(null);
    setModalVisible(true);
  };
  
  const handleSuitSelect = (suit: string) => {
    setSelectedSuit(suit);
  };
  
  const handleRankSelect = (rank: string) => {
    if (selectedSuit) {
      const card: Card = { rank, suit: selectedSuit };
      
      // Check if this card is already selected anywhere
      const isCardAlreadySelected = [...selectedCards, ...disabledCards].some(
        c => c.rank === card.rank && c.suit === card.suit
      );
      
      if (!isCardAlreadySelected) {
        onSelectCard(card, selectedIndex);
        setModalVisible(false);
      }
    }
  };
  
  const getPositionLabel = (index: number) => {
    if (!showPositions) return '';
    
    if (index === 0) return 'Flop';
    if (index === 1) return 'Flop';
    if (index === 2) return 'Flop';
    if (index === 3) return 'Turn';
    if (index === 4) return 'River';
    return '';
  };
  
  const renderEmptyCardSlot = (index: number) => {
    return (
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={() => handleCardPress(index)}
      >
        <Text style={styles.emptyCardText}>+</Text>
        {showPositions && (
          <Text style={styles.positionLabel}>{getPositionLabel(index)}</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  // Check if a card with this rank and suit is already selected elsewhere
  const isCardDisabled = (rank: string, suit: string): boolean => {
    return disabledCards.some(card => card.rank === rank && card.suit === suit);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        {Array.from({ length: maxCards }).map((_, index) => (
          <View key={index} style={styles.cardSlot}>
            {index < selectedCards.length ? (
              <TouchableOpacity onPress={() => handleCardPress(index)}>
                <PlayingCard card={selectedCards[index]} />
                {showPositions && (
                  <Text style={styles.positionLabel}>{getPositionLabel(index)}</Text>
                )}
              </TouchableOpacity>
            ) : (
              renderEmptyCardSlot(index)
            )}
          </View>
        ))}
      </View>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select a Card</Text>
            
            {!selectedSuit ? (
              <>
                <Text style={styles.modalSubtitle}>Choose a Suit</Text>
                <View style={styles.suitsContainer}>
                  {suits.map(suit => (
                    <TouchableOpacity
                      key={suit.value}
                      style={styles.suitButton}
                      onPress={() => handleSuitSelect(suit.value)}
                    >
                      <Text style={[
                        styles.suitSymbol,
                        { color: suit.color }
                      ]}>
                        {suit.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Choose a Rank</Text>
                <FlatList
                  data={ranks}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => {
                    const isDisabled = isCardDisabled(item, selectedSuit);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.rankButton,
                          isDisabled && styles.disabledRankButton
                        ]}
                        onPress={() => !isDisabled && handleRankSelect(item)}
                        disabled={isDisabled}
                      >
                        <Text style={[
                          styles.rankText,
                          isDisabled && styles.disabledRankText
                        ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  numColumns={4}
                  contentContainerStyle={styles.ranksList}
                />
                
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedSuit(null)}
                >
                  <Text style={styles.backButtonText}>Back to Suits</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cardSlot: {
    marginRight: 12,
    marginBottom: 12,
  },
  emptyCard: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.card,
  },
  emptyCardText: {
    fontSize: 24,
    color: colors.text.tertiary,
  },
  positionLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.text.secondary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  suitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  suitButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitSymbol: {
    fontSize: 32,
  },
  ranksList: {
    paddingBottom: 10,
  },
  rankButton: {
    flex: 1,
    height: 50,
    margin: 5,
    borderRadius: 8,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledRankButton: {
    backgroundColor: colors.background.input,
    opacity: 0.5,
  },
  rankText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  disabledRankText: {
    color: colors.text.tertiary,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  closeButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});