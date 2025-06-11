import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { colors } from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { X, AlertCircle } from 'lucide-react-native';
import { GameSession } from '@/types/bankroll';
import { formatCurrency } from '@/utils/formatters';

interface EndSessionModalProps {
  visible: boolean;
  session: GameSession;
  onClose: () => void;
  onEndSession: (notes: string) => void;
}

export default function EndSessionModal({
  visible,
  session,
  onClose,
  onEndSession
}: EndSessionModalProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if there are players who haven't cashed out
  const uncashedPlayers = session.players?.filter(p => p.totalCashOut === 0) || [];
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // End the session
      onEndSession(notes.trim());
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Reset form and close modal
    setNotes('');
    onClose();
  };
  
  const totalProfit = session.totalCashOuts - session.totalBuyIns;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.overlay} onPress={handleCancel}>
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Save Game</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scrollView}>
              {uncashedPlayers.length > 0 && (
                <View style={styles.warningContainer}>
                  <AlertCircle size={20} color={colors.accent.danger} />
                  <Text style={styles.warningText}>
                    {uncashedPlayers.length} player(s) have not cashed out yet. 
                    They will be automatically cashed out with their buy-in amount (no profit/loss).
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Game Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Buy-ins:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(session.totalBuyIns)}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Cash-outs:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(session.totalCashOuts)}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Game Profit:</Text>
                  <Text 
                    style={[
                      styles.summaryValue,
                      totalProfit >= 0 ? styles.positive : styles.negative
                    ]}
                  >
                    {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Remaining Pot:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(session.potAmount)}
                  </Text>
                </View>
              </View>
              
              <Input
                label="Game Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this game"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.notesInput}
              />
            </ScrollView>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={isLoading}
              />
              <Button
                title="Save Game"
                onPress={handleSubmit}
                style={styles.endButton}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    paddingBottom: 40,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  warningText: {
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.text.secondary,
  },
  summaryValue: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  endButton: {
    flex: 1,
    marginLeft: 8,
  },
});