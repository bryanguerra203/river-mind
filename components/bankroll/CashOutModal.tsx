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
import { Player } from '@/types/bankroll';
import { formatCurrency } from '@/utils/formatters';

interface CashOutModalProps {
  visible: boolean;
  player: Player | null;
  sessionId: string;
  onClose: () => void;
}

export default function CashOutModal({
  visible,
  player,
  sessionId,
  onClose
}: CashOutModalProps) {
  const { addCashOut } = useBankrollStore();
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset amount when player changes
  React.useEffect(() => {
    if (player) {
      setAmount(player.totalBuyIn.toString());
    }
  }, [player]);
  
  const handleSubmit = async () => {
    if (!player) return;
    
    // Validate form
    const cashOutAmount = Number(amount);
    if (isNaN(cashOutAmount) || cashOutAmount < 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Cash out the player
      addCashOut(sessionId, player.id, cashOutAmount);
      
      // Reset form and close modal
      setAmount('');
      setError('');
      onClose();
    } catch (error) {
      console.error('Error cashing out player:', error);
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
    const formattedText = parts.length > 1 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : cleanedText;
    
    setAmount(formattedText);
    setError('');
  };
  
  if (!player) return null;
  
  const cashOutAmount = Number(amount);
  const profit = !isNaN(cashOutAmount) ? cashOutAmount - player.totalBuyIn : 0;
  const isProfit = profit >= 0;
  
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
              <Text style={styles.title}>Cash Out Player</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.buyInText}>
                Total Buy-in: {formatCurrency(player.totalBuyIn)}
              </Text>
            </View>
            
            <Input
              label="Cash Out Amount"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="Enter amount"
              leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
              error={error}
              autoFocus
            />
            
            {!isNaN(cashOutAmount) && (
              <View style={styles.profitContainer}>
                <Text style={styles.profitLabel}>Profit/Loss:</Text>
                <Text 
                  style={[
                    styles.profitValue,
                    isProfit ? styles.profitPositive : styles.profitNegative
                  ]}
                >
                  {isProfit ? '+' : ''}{formatCurrency(profit)}
                </Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={isLoading}
              />
              <Button
                title="Cash Out"
                onPress={handleSubmit}
                style={styles.cashOutButton}
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
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  profitLabel: {
    color: colors.text.secondary, // Already using theme color
    marginRight: 8,
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  profitPositive: {
    color: colors.accent.success,
  },
  profitNegative: {
    color: colors.accent.danger,
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
  cashOutButton: {
    flex: 1,
    marginLeft: 8,
  },
});