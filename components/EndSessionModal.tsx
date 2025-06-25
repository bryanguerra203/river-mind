import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Session } from '@/types/session';
import { useSessionStore } from '@/store/sessionStore';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { formatCurrency } from '@/utils/formatters';

interface EndSessionModalProps {
  visible: boolean;
  onClose: () => void;
  session: Session;
}

export default function EndSessionModal({ visible, onClose, session }: EndSessionModalProps) {
  const router = useRouter();
  const { updateSession } = useSessionStore();
  const [buyIn, setBuyIn] = useState(session.buyIn.toString());
  const [cashOut, setCashOut] = useState('');
  const [notes, setNotes] = useState(session.notes || '');
  const [isEnding, setIsEnding] = useState(false);
  
  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const buyInValue = parseFloat(buyIn) || 0;
      const cashOutValue = parseFloat(cashOut) || 0;
      const endTime = new Date();
      const startTime = session.startTime ? new Date(session.startTime) : new Date();
      
      // Calculate duration from start time to end time in minutes
      const durationInMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      const updatedSession: Partial<Session> = {
        buyIn: buyInValue,
        cashOut: cashOutValue,
        notes,
        status: 'past',
        duration: durationInMinutes,
        endTime: endTime.toISOString(),
      };
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      updateSession(session.id, updatedSession);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error ending session:', error);
      setIsEnding(false);
    }
  };

  const profit = (parseFloat(cashOut) || 0) - (parseFloat(buyIn) || 0);
  const isProfit = profit > 0;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={onClose}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>End Session</Text>
                <Text style={styles.subtitle}>Complete your poker session</Text>
              </View>
              <View style={styles.closeButtonPlaceholder} />
            </View>
            
            <ScrollView 
              style={styles.formContainer} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* Session Summary */}
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Session Summary</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Current Profit/Loss</Text>
                    <Text style={[
                      styles.summaryValue,
                      isProfit ? styles.profitText : styles.lossText
                    ]}>
                      {isProfit ? '+' : ''}{formatCurrency(profit)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Buy-in Input */}
              <View style={styles.inputSection}>
                <Input
                  label="Buy-in Amount ($)"
                  value={buyIn}
                  onChangeText={setBuyIn}
                  keyboardType="numeric"
                  placeholder="0.00"
                  style={styles.inputText}
                />
              </View>

              {/* Cash Out Input */}
              <View style={styles.inputSection}>
                <Input
                  label="Cash Out Amount ($)"
                  value={cashOut}
                  onChangeText={setCashOut}
                  keyboardType="numeric"
                  placeholder="0.00"
                  style={styles.inputText}
                />
              </View>
              
              {/* Notes Input */}
              <View style={styles.inputSection}>
                <Input
                  label="Session Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  placeholder="How did the session go? Any key hands or observations..."
                  style={styles.notesInputText}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={styles.cancelButton}
              />
              <Button
                title="End Session"
                onPress={handleEndSession}
                style={styles.confirmButton}
                loading={isEnding}
                disabled={isEnding || cashOut.trim() === '' || buyIn.trim() === ''}
              />
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
    minHeight: '80%',
  },
  header: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 18,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    flexGrow: 1,
  },
  summarySection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '500',
  },
  summaryValue: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  profitText: {
    color: colors.accent.success,
  },
  lossText: {
    color: colors.accent.danger,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '500',
  },
  notesInputText: {
    color: colors.text.primary,
    fontSize: 18,
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  closeButtonPlaceholder: {
    width: 40,
    height: 40,
  },
});