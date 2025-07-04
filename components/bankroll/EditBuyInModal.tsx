import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors } from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { DollarSign, X } from 'lucide-react-native';
import { useBankrollStore } from '@/store/bankrollStore';
import { Player, BuyIn } from '@/types/bankroll';
import { formatCurrency } from '@/utils/formatters';

interface EditBuyInModalProps {
  visible: boolean;
  player: Player | null;
  buyIn: BuyIn | null;
  sessionId: string;
  onClose: () => void;
}

export default function EditBuyInModal({
  visible,
  player,
  buyIn,
  sessionId,
  onClose
}: EditBuyInModalProps) {
  const { editBuyIn } = useBankrollStore();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Set initial amount when modal opens
  React.useEffect(() => {
    if (buyIn) {
      setAmount(buyIn.amount.toString());
    }
  }, [buyIn]);
  
  const handleSubmit = async () => {
    if (!player || !buyIn) return;
    
    // Validate form
    const buyInAmount = Number(amount.replace(/,/g, ''));
    if (isNaN(buyInAmount) || buyInAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update the buy-in amount
      editBuyIn(sessionId, player.id, buyIn.id, buyInAmount);
      
      // Reset form and close modal
      setAmount('');
      setError('');
      onClose();
    } catch (error) {
      console.error('Error editing buy-in:', error);
      setError('Failed to update buy-in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Reset form and close modal
    setAmount('');
    setError('');
    onClose();
  };
  
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanedText.split('.');
    const wholeNumber = parts[0];
    const decimal = parts.length > 1 ? `.${parts.slice(1).join('')}` : '';
    
    // Add commas to the whole number part
    const formattedWholeNumber = wholeNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    setAmount(formattedWholeNumber + decimal);
    setError('');
  };
  
  if (!player || !buyIn) return null;
  
  // Calculate previous buy-ins count and total
  const buyInsCount = player.buyIns ? player.buyIns.length : 0;
  const totalBuyIn = player.totalBuyIn || 0;
  
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
              <Text style={styles.title}>Edit Buy-In</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.buyInText}>
                Current Total: {formatCurrency(totalBuyIn)}
              </Text>
              {buyInsCount > 0 && (
                <Text style={styles.buyInCount}>
                  Buy-in #{player.buyIns.findIndex(b => b.id === buyIn.id) + 1} of {buyInsCount}
                </Text>
              )}
            </View>
            
            <Input
              label="Buy-In Amount"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="Enter amount"
              leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
              error={error}
              autoFocus
            />
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={isLoading}
              />
              <Button
                title="Update Buy-In"
                onPress={handleSubmit}
                style={styles.updateButton}
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
    color: colors.text.primary, // Ensure title text is white/light
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInfo: {
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary, // Ensure player name text is white/light
    marginBottom: 4,
  },
  buyInText: {
    color: colors.text.secondary, // Already using theme color
    marginBottom: 4,
  },
  buyInCount: {
    color: colors.text.secondary, // Already using theme color
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  updateButton: {
    flex: 1,
    marginLeft: 8,
  },
});