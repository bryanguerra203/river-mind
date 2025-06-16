import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DollarSign, Clock, MapPin, Tag, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DatePicker from '@/components/DatePicker';
import { gameTypes, sessionTypes, locationTypes } from '@/constants/gameTypes';
import TagInput from '@/components/TagInput';

export default function EditSessionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { sessions, updateSession } = useSessionStore();
  
  const session = sessions.find(s => s.id === id);
  
  const [date, setDate] = useState(new Date());
  const [gameType, setGameType] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [locationType, setLocationType] = useState('');
  const [location, setLocation] = useState('');
  const [stakes, setStakes] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (session) {
      try {
        const sessionDate = new Date(session.date);
        if (!isNaN(sessionDate.getTime())) {
          setDate(sessionDate);
        } else {
          console.error("Invalid date in session:", session.date);
          setDate(new Date());
        }
      } catch (e) {
        console.error("Error parsing session date:", e);
        setDate(new Date());
      }
      
      setGameType(session.gameType);
      setSessionType(session.sessionType);
      setLocationType(session.locationType);
      setLocation(session.location);
      setStakes(session.stakes);
      setBuyIn(session.buyIn.toString());
      setCashOut(session.cashOut.toString());
      const totalMinutes = session.duration;
      setHours(Math.floor(totalMinutes / 60).toString());
      setMinutes((totalMinutes % 60).toString());
      setNotes(session.notes);
      setTags(session.tags || []);
    }
  }, [session]);
  
  if (!session) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Session not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </View>
    );
  }
  
  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag('');
    }
  };
  
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      // Check if date is in the future
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time part for comparison
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > currentDate) {
        newErrors.date = 'Cannot select future dates';
      }
    }
    
    if (!gameType) newErrors.gameType = 'Game type is required';
    if (!sessionType) newErrors.sessionType = 'Session type is required';
    if (!locationType) newErrors.locationType = 'Location type is required';
    if (!location) newErrors.location = 'Location is required';
    if (!stakes) newErrors.stakes = 'Stakes are required';
    if (!buyIn) newErrors.buyIn = 'Buy-in is required';
    else if (isNaN(Number(buyIn))) newErrors.buyIn = 'Must be a number';
    if (!cashOut) newErrors.cashOut = 'Cash out is required';
    else if (isNaN(Number(cashOut))) newErrors.cashOut = 'Must be a number';
    if (!hours && !minutes) newErrors.duration = 'Duration is required';
    else if (hours && isNaN(Number(hours))) newErrors.hours = 'Hours must be a number';
    else if (minutes && isNaN(Number(minutes))) newErrors.minutes = 'Minutes must be a number';
    else if (minutes && Number(minutes) >= 60) newErrors.minutes = 'Minutes must be less than 60';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const duration = (Number(hours || 0) * 60) + Number(minutes || 0);
      const updatedSession = {
        date: date.toISOString(),
        gameType,
        sessionType,
        locationType,
        location,
        stakes,
        buyIn: Number(buyIn),
        cashOut: Number(cashOut),
        duration,
        notes,
        tags,
      };
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateSession(session.id, updatedSession);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
            error={errors.date}
          />
          
          <Select
            label="Game Type"
            placeholder="Select game type"
            options={gameTypes}
            value={gameType}
            onChange={setGameType}
            error={errors.gameType}
          />
          
          <Select
            label="Session Type"
            placeholder="Select session type"
            options={sessionTypes}
            value={sessionType}
            onChange={setSessionType}
            error={errors.sessionType}
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Select
            label="Location Type"
            placeholder="Live or Online"
            options={locationTypes}
            value={locationType}
            onChange={setLocationType}
            error={errors.locationType}
          />
          
          <Input
            label="Location"
            placeholder="Casino name or poker site"
            value={location}
            onChangeText={setLocation}
            error={errors.location}
            leftIcon={<MapPin size={20} color={colors.text.secondary} />}
          />
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Financial</Text>
          
          <Input
            label="Stakes"
            placeholder="e.g., 1/2, 2/5, $200 MTT"
            value={stakes}
            onChangeText={setStakes}
            error={errors.stakes}
          />
          
          <Input
            label="Buy-in ($)"
            placeholder="Total amount bought in"
            value={buyIn}
            onChangeText={setBuyIn}
            keyboardType="numeric"
            error={errors.buyIn}
            leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
          />
          
          <Input
            label="Cash Out ($)"
            placeholder="Total amount cashed out"
            value={cashOut}
            onChangeText={setCashOut}
            keyboardType="numeric"
            error={errors.cashOut}
            leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
          />
          
          <View style={styles.durationContainer}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationInputs}>
              <Input
                placeholder="Hours"
                value={hours}
                onChangeText={setHours}
                keyboardType="numeric"
                error={errors.hours}
                containerStyle={styles.durationInput}
                leftIcon={<Clock size={20} color={colors.text.secondary} />}
              />
              <Input
                placeholder="Minutes"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="numeric"
                error={errors.minutes}
                containerStyle={styles.durationInput}
              />
            </View>
            {errors.duration && (
              <Text style={styles.errorText}>{errors.duration}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes & Tags</Text>
          
          <Input
            label="Notes"
            placeholder="Any thoughts about this session"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.notesInput}
          />
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tags</Text>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add tags (e.g., 'good game', 'tough table')"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Cancel" 
            onPress={handleCancel} 
            variant="outline"
            style={styles.cancelButton}
            disabled={isLoading}
          />
          <Button 
            title="Save Changes" 
            onPress={handleSubmit} 
            style={styles.saveButton}
            loading={isLoading}
            disabled={isLoading}
          />
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
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: 6,
    fontSize: 14,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    color: colors.text.primary, // Ensure notes text is white/light
  },
  formGroup: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  backButton: {
    width: 120,
  },
  durationContainer: {
    marginBottom: 16,
  },
  durationInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationInput: {
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    color: colors.accent.danger,
    fontSize: 12,
    marginTop: 4,
  },
});