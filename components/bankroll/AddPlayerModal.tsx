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
import { User, DollarSign, X } from 'lucide-react-native';
import { useBankrollStore } from '@/store/bankrollStore';

interface AddPlayerModalProps {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
}

export default function AddPlayerModal({
  visible,
  sessionId,
  onClose
}: AddPlayerModalProps) {
  const { addPlayer } = useBankrollStore();
  
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [nameError, setNameError] = useState('');
  const [buyInError, setBuyInError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    // Validate form
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Please enter a name');
      isValid = false;
    }
    
    const buyInAmount = Number(buyIn);
    if (isNaN(buyInAmount) || buyInAmount <= 0) {
      setBuyInError('Please enter a valid amount');
      isValid = false;
    }
    
    if (!isValid) return;
    
    setIsLoading(true);
    
    try {
      // Add player to the session
      addPlayer(sessionId, name.trim(), buyInAmount);
      
      // Reset form and close modal
      setName('');
      setBuyIn('');
      setNameError('');
      setBuyInError('');
      onClose();
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Reset form and close modal
    setName('');
    setBuyIn('');
    setNameError('');
    setBuyInError('');
    onClose();
  };
  
  const handleBuyInChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanedText.split('.');
    const formattedText = parts.length > 1 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : cleanedText;
    
    setBuyIn(formattedText);
    setBuyInError('');
  };
  
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
              <Text style={styles.title}>Add Player</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Input
              label="Player Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError('');
              }}
              placeholder="Enter name"
              leftIcon={<User size={20} color={colors.text.secondary} />}
              error={nameError}
              autoFocus
            />
            
            <Input
              label="Buy-in Amount"
              value={buyIn}
              onChangeText={handleBuyInChange}
              keyboardType="numeric"
              placeholder="Enter amount"
              leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
              error={buyInError}
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
                title="Add Player"
                onPress={handleSubmit}
                style={styles.addButton}
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
    marginLeft: 8,
  },
});