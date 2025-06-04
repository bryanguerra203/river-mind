import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Info } from 'lucide-react-native';
import CardSelector from '@/components/calculator/CardSelector';
import HandStrength from '@/components/calculator/HandStrength';
import OddsDisplay from '@/components/calculator/OddsDisplay';
import { calculatePokerOdds, identifyHand } from '@/utils/pokerCalculator';
import { Card, HandType } from '@/types/poker';
import SegmentedControl from '@/components/SegmentedControl';
import WinningOddsCalculator from '@/components/calculator/WinningOddsCalculator';

export default function CalculatorScreen() {
  const [calculatorType, setCalculatorType] = useState('winning');
  const [holeCards, setHoleCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [handType, setHandType] = useState<HandType | null>(null);
  const [odds, setOdds] = useState<{
    turnOdds: number;
    riverOdds: number;
    combinedOdds: number;
    outs: number;
  }>({
    turnOdds: 0,
    riverOdds: 0,
    combinedOdds: 0,
    outs: 0,
  });
  
  // Calculate odds whenever cards change
  useEffect(() => {
    if (holeCards.length === 2) {
      // Identify current hand
      const currentHand = identifyHand([...holeCards, ...communityCards]);
      setHandType(currentHand.handType);
      
      // Calculate odds of improving
      if (communityCards.length < 5) {
        const calculatedOdds = calculatePokerOdds(holeCards, communityCards);
        setOdds(calculatedOdds);
      } else {
        // All cards are out, no more odds to calculate
        setOdds({
          turnOdds: 0,
          riverOdds: 0,
          combinedOdds: 0,
          outs: 0,
        });
      }
    } else {
      // Reset if hole cards aren't complete
      setHandType(null);
      setOdds({
        turnOdds: 0,
        riverOdds: 0,
        combinedOdds: 0,
        outs: 0,
      });
    }
  }, [holeCards, communityCards]);
  
  const handleSelectHoleCard = (card: Card, index: number) => {
    const newHoleCards = [...holeCards];
    
    // If this position already has a card, replace it
    if (index < newHoleCards.length) {
      newHoleCards[index] = card;
    } else {
      // Otherwise add it
      newHoleCards.push(card);
    }
    
    // Limit to 2 hole cards
    setHoleCards(newHoleCards.slice(0, 2));
  };
  
  const handleSelectCommunityCard = (card: Card, index: number) => {
    const newCommunityCards = [...communityCards];
    
    // If this position already has a card, replace it
    if (index < newCommunityCards.length) {
      newCommunityCards[index] = card;
    } else {
      // Otherwise add it
      newCommunityCards.push(card);
    }
    
    // Limit to 5 community cards
    setCommunityCards(newCommunityCards.slice(0, 5));
  };
  
  const handleClearHoleCards = () => {
    setHoleCards([]);
  };
  
  const handleClearCommunityCards = () => {
    setCommunityCards([]);
  };
  
  const handleClearAll = () => {
    setHoleCards([]);
    setCommunityCards([]);
  };
  
  const showHelp = () => {
    if (calculatorType === 'outs') {
      Alert.alert(
        "Poker Odds Calculator",
        "Select your hole cards and the community cards to calculate your odds of improving your hand.\n\n" +
        "• Hole Cards: Your two private cards\n" +
        "• Community Cards: The shared cards (flop, turn, river)\n\n" +
        "The calculator will show your current hand strength and the odds of improving on the turn and river.",
        [{ text: "Got it" }]
      );
    } else {
      Alert.alert(
        "Winning Odds Calculator",
        "Compare the winning chances of multiple players' hands.\n\n" +
        "• Add up to 9 players and select their hole cards\n" +
        "• Add community cards (optional)\n" +
        "• The calculator will run simulations to determine each player's chance of winning\n\n" +
        "Results are based on thousands of random simulations of possible outcomes.",
        [{ text: "Got it" }]
      );
    }
  };
  
  // Check if a card is already selected in either hole cards or community cards
  const isCardSelected = (card: Card): boolean => {
    return [...holeCards, ...communityCards].some(
      c => c.rank === card.rank && c.suit === card.suit
    );
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Poker Calculator</Text>
        <TouchableOpacity onPress={showHelp} style={styles.helpButton}>
          <Info size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <SegmentedControl
        options={[
          { label: 'Winning Odds', value: 'winning' },
          { label: 'Outs & Odds', value: 'outs' }
        ]}
        value={calculatorType}
        onChange={setCalculatorType}
        style={styles.segmentedControl}
      />
      
      {calculatorType === 'outs' ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Hole Cards</Text>
              {holeCards.length > 0 && (
                <TouchableOpacity onPress={handleClearHoleCards}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <CardSelector 
              selectedCards={holeCards}
              onSelectCard={handleSelectHoleCard}
              maxCards={2}
              disabledCards={communityCards}
            />
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Cards</Text>
              {communityCards.length > 0 && (
                <TouchableOpacity onPress={handleClearCommunityCards}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <CardSelector 
              selectedCards={communityCards}
              onSelectCard={handleSelectCommunityCard}
              maxCards={5}
              showPositions
              disabledCards={holeCards}
            />
          </View>
          
          {holeCards.length === 2 && (
            <>
              <HandStrength 
                handType={handType} 
                cards={[...holeCards, ...communityCards]}
              />
              
              {communityCards.length < 5 && (
                <OddsDisplay odds={odds} />
              )}
            </>
          )}
          
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllText}>Reset Calculator</Text>
          </TouchableOpacity>
        </>
      ) : (
        <WinningOddsCalculator />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedControl: {
    marginBottom: 24,
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
  clearAllButton: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  clearAllText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});