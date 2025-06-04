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
import { formatCurrency } from '@/utils/formatters';

interface SetBankrollModalProps {
  visible: boolean;
  currentBankroll: number;
  onClose: () => void;
  onSetBankroll: (amount: number) => void;
}

export default function SetBankrollModal({
  visible,
  currentBankroll,
  onClose,
  onSetBankroll
}: SetBankrollModalProps) {
  const [amount, setAmount] = useState(currentBankroll.toString());
  const [error, setError] = useState('');
  
  const handleSubmit = () => {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (numAmount < 0) {
      setError('Amount cannot be negative');
      return;
    }
    
    onSetBankroll(numAmount);
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
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Set Bankroll</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.description}>
              Enter your current poker bankroll amount. This will be used to track your profits and losses.
            </Text>
            
            <Input
              label="Bankroll Amount"
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
                onPress={onClose}
                style={styles.cancelButton}
              />
              <Button
                title="Save"
                onPress={handleSubmit}
                style={styles.saveButton}
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
  description: {
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
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
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});