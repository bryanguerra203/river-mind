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
import { useRouter } from 'expo-router';
import { DollarSign, Clock, MapPin, Tag, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DatePicker from '@/components/DatePicker';
import { gameTypes, sessionTypes, locationTypes, defaultStakes, sessionStatuses } from '@/constants/gameTypes';
import { generateId } from '@/utils/helpers';

export default function NewSessionScreen() {
  const router = useRouter();
  const { addSession, addCustomStake, getAllStakes } = useSessionStore();
  
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
  const [allStakes, setAllStakes] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState('past');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Load all available stakes from store
    setAllStakes(getAllStakes());
  }, []);
  
  useEffect(() => {
    // Reset stakes if session type changes away from cash game
    if (sessionType !== 'cash') {
      setStakes('');
    }
  }, [sessionType]);
  
  useEffect(() => {
    // When session status changes to 'current' (Live), set date to today
    if (sessionStatus === 'current') {
      setDate(new Date());
    }
  }, [sessionStatus]);
  
  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag('');
    }
  };
  
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  const handleStakeSelect = (stake: string) => {
    setStakes(stake);
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!date) {
      newErrors.date = 'Date is required';
    } else if (sessionStatus === 'past') {
      // Check if date is in the future for past sessions
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
    
    if (sessionStatus === 'past') {
      if (!cashOut) newErrors.cashOut = 'Cash out is required';
      else if (isNaN(Number(cashOut))) newErrors.cashOut = 'Must be a number';
      if (!hours && !minutes) newErrors.duration = 'Duration is required';
      else if (hours && isNaN(Number(hours))) newErrors.hours = 'Hours must be a number';
      else if (minutes && isNaN(Number(minutes))) newErrors.minutes = 'Minutes must be a number';
      else if (minutes && Number(minutes) >= 60) newErrors.minutes = 'Minutes must be less than 60';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (sessionStatus === 'past' && !validateForm()) {
      return;
    }
    
    // For live sessions, validate basic required fields
    if (sessionStatus === 'current') {
      const newErrors: Record<string, string> = {};
      if (!gameType) newErrors.gameType = 'Game type is required';
      if (!sessionType) newErrors.sessionType = 'Session type is required';
      if (!locationType) newErrors.locationType = 'Location type is required';
      if (!location) newErrors.location = 'Location is required';
      if (!stakes) newErrors.stakes = 'Stakes are required';
      if (!buyIn) newErrors.buyIn = 'Buy-in is required';
      else if (isNaN(Number(buyIn))) newErrors.buyIn = 'Must be a number';
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const duration = sessionStatus === 'past' ? (Number(hours || 0) * 60) + Number(minutes || 0) : 0;
      const now = new Date();
      
      const newSession = {
        id: generateId(),
        date: date.toISOString(),
        gameType,
        sessionType,
        locationType,
        location,
        stakes,
        buyIn: Number(buyIn),
        cashOut: sessionStatus === 'past' ? Number(cashOut) : 0,
        duration,
        notes: sessionStatus === 'past' ? notes : '',
        tags: sessionStatus === 'past' ? tags : [],
        status: sessionStatus as 'past' | 'current',
        // Add start time for live sessions
        startTime: sessionStatus === 'current' ? now.toISOString() : undefined,
        endTime: sessionStatus === 'past' ? now.toISOString() : undefined,
      };
      
      // Add the session to the store
      addSession(newSession);
      
      // If this is a cash game and stakes isn't in the default list or already saved, save it as custom
      if (sessionType === 'cash' && !defaultStakes.some(s => s.name === stakes) && !allStakes.includes(stakes)) {
        addCustomStake(stakes);
      }
      
      // Small delay to ensure state updates and navigation happens smoothly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  // Prepare stake options for dropdown
  const stakeOptions = allStakes.map(stake => ({ id: stake, name: stake }));
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          
          <Select
            label="Session Type"
            placeholder="Select session type"
            options={sessionStatuses}
            value={sessionStatus}
            onChange={setSessionStatus}
          />
          
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
            error={errors.date}
            disabled={sessionStatus === 'current'}
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
            label="Session Format"
            placeholder="Select session format"
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
          
          {sessionType === 'cash' ? (
            <View>
              <Text style={styles.label}>Stakes</Text>
              <View style={styles.stakesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stakesScroll}
                >
                  {allStakes.map((stake, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.stakeButton,
                        stakes === stake && styles.selectedStakeButton
                      ]}
                      onPress={() => handleStakeSelect(stake)}
                    >
                      <Text
                        style={[
                          styles.stakeButtonText,
                          stakes === stake && styles.selectedStakeButtonText
                        ]}
                      >
                        {stake}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Input
                placeholder="Custom stakes (e.g., 10/20)"
                value={stakes}
                onChangeText={setStakes}
                error={errors.stakes}
                containerStyle={styles.customStakesInput}
              />
            </View>
          ) : (
            <Input
              label="Stakes"
              placeholder="e.g., 1/2, 2/5, $200 MTT"
              value={stakes}
              onChangeText={setStakes}
              error={errors.stakes}
            />
          )}
          
          <Input
            label="Buy-in ($)"
            placeholder="Total amount bought in"
            value={buyIn}
            onChangeText={setBuyIn}
            keyboardType="numeric"
            error={errors.buyIn}
            leftIcon={<DollarSign size={20} color={colors.text.secondary} />}
          />
          
          {sessionStatus === 'past' && (
            <>
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
            </>
          )}
        </View>
        
        {sessionStatus === 'past' && (
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
            
            <View style={styles.tagsContainer}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <Input
                  placeholder="Add a tag"
                  value={tag}
                  onChangeText={setTag}
                  containerStyle={styles.tagInput}
                  leftIcon={<Tag size={20} color={colors.text.secondary} />}
                />
                <Button 
                  title="Add" 
                  onPress={handleAddTag} 
                  variant="secondary"
                  size="small"
                  disabled={!tag.trim()}
                  style={styles.addTagButton}
                />
              </View>
              
              {tags.length > 0 && (
                <View style={styles.tagsList}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveTag(index)}
                        style={styles.removeTagButton}
                      >
                        <X size={16} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Cancel" 
            onPress={handleCancel} 
            variant="outline"
            style={styles.cancelButton}
            disabled={isLoading}
          />
          <Button 
            title={sessionStatus === 'past' ? "Save Session" : "Start Session"} 
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
    paddingTop: 60,
    paddingBottom: 200,
  },
  formSection: {
    marginBottom: 32,
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
    color: colors.text.primary,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    marginLeft: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tagItem: {
    backgroundColor: colors.background.input,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  stakesContainer: {
    marginBottom: 16,
  },
  stakesScroll: {
    paddingRight: 16,
  },
  stakeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.input,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedStakeButton: {
    backgroundColor: colors.accent.primary,
  },
  stakeButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  selectedStakeButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  customStakesInput: {
    marginTop: 8,
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