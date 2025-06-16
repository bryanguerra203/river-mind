import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, DollarSign, Users, Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useBankrollStore } from '@/store/bankrollStore';
import Button from '@/components/Button';
import Input from '@/components/Input';
import DatePicker from '@/components/DatePicker';

export default function NewBankrollSessionScreen() {
  const router = useRouter();
  const { createSession } = useBankrollStore();
  
  const [location, setLocation] = useState('');
  const [locationError, setLocationError] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateError, setDateError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCreateSession = async () => {
    // Validate form
    let isValid = true;
    
    if (!location.trim()) {
      setLocationError('Please enter a location');
      isValid = false;
    }
    
    // Date validation is handled by the DatePicker component
    
    if (!isValid) return;
    
    setIsLoading(true);
    
    try {
      // Create a new session with the selected date
      const newSession = {
        location: location.trim(),
        date: date.toISOString(),
        players: [],
        potAmount: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        isActive: true
      };
      
      await createSession(newSession);
      
      // Get the session ID from the store
      const sessionId = useBankrollStore.getState().activeSessions[0].id;
      
      // Navigate to the session screen
      router.replace(`/bankroll-session/${sessionId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New Poker Game</Text>
        <Text style={styles.subtitle}>
          Create a new poker game to track buy-ins, cash-outs, and profits.
        </Text>
        
        <View style={styles.formContainer}>
          <Input
            label="Game Location"
            placeholder="Home game, Casino, etc."
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              setLocationError('');
            }}
            error={locationError}
            leftIcon={<MapPin size={20} color={colors.text.secondary} />}
            autoFocus
          />
          
          <DatePicker
            label="Game Date"
            value={date}
            onChange={(newDate) => {
              setDate(newDate);
              setDateError('');
            }}
            error={dateError}
          />
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>
              After creating a game, you can:
            </Text>
            
            <View style={styles.infoItem}>
              <Users size={16} color={colors.text.secondary} />
              <Text style={styles.infoItemText}>Add players and track their buy-ins</Text>
            </View>
            
            <View style={styles.infoItem}>
              <DollarSign size={16} color={colors.text.secondary} />
              <Text style={styles.infoItemText}>Record cash-outs and calculate profits</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={styles.infoItemText}>Save the game to your history when finished</Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              style={styles.cancelButton}
              disabled={isLoading}
            />
            <Button
              title="Create Game"
              onPress={handleCreateSession}
              style={styles.createButton}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary, // Ensure title text is white/light
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary, // Already using theme color
    marginBottom: 32,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary, // Ensure info title text is white/light
    marginBottom: 8,
  },
  infoText: {
    color: colors.text.secondary, // Already using theme color
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItemText: {
    color: colors.text.secondary, // Already using theme color
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
  },
});