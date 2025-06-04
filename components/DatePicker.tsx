import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Pressable,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  disabled?: boolean;
}

export default function DatePicker({ 
  label, 
  value, 
  onChange, 
  error,
  disabled = false
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  
  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  const handleDaySelect = (day: number) => {
    try {
      const newDate = new Date(selectedYear, selectedMonth, day);
      
      // Validate the date is not in the future
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      newDate.setHours(0, 0, 0, 0);
      
      if (newDate > currentDate) {
        // Don't allow selection of future dates
        return;
      }
      
      onChange(newDate);
      setShowPicker(false);
    } catch (e) {
      console.error('Error selecting date:', e);
    }
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getMonthDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];
    
    // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: 0, empty: true });
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, empty: false });
    }
    
    return days;
  };
  
  const changeMonth = (increment: number) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    // Prevent moving to future months/years
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Check if a day is in the future
  const isDayInFuture = (day: number) => {
    const currentDate = new Date();
    const selectedDate = new Date(selectedYear, selectedMonth, day);
    
    // Reset time parts for accurate comparison
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    return selectedDate > currentDate;
  };
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.pickerButton, 
          error ? styles.pickerError : null,
          disabled ? styles.pickerDisabled : null
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Calendar size={20} color={disabled ? colors.text.tertiary : colors.text.secondary} />
        <Text style={[
          styles.dateText,
          disabled ? styles.disabledText : null
        ]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={showPicker && !disabled}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
            </View>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {monthNames[selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
                <Text style={styles.monthButtonText}>→</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.daysHeader}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.dayName}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {getMonthDays().map((item, index) => {
                const isFutureDay = !item.empty && isDayInFuture(item.day);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      item.empty && styles.emptyCell,
                      isFutureDay && styles.futureDay,
                      !item.empty && 
                      !isFutureDay &&
                      value.getDate() === item.day && 
                      value.getMonth() === selectedMonth && 
                      value.getFullYear() === selectedYear && 
                      styles.selectedDay
                    ]}
                    onPress={() => !item.empty && !isFutureDay && handleDaySelect(item.day)}
                    disabled={item.empty || isFutureDay}
                  >
                    {!item.empty && (
                      <Text style={[
                        styles.dayText,
                        isFutureDay && styles.futureDayText,
                        !isFutureDay &&
                        value.getDate() === item.day && 
                        value.getMonth() === selectedMonth && 
                        value.getFullYear() === selectedYear && 
                        styles.selectedDayText
                      ]}>
                        {item.day}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.todayButton} 
                onPress={() => {
                  const today = new Date();
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                  onChange(today);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: 6,
    fontSize: 14,
  },
  pickerButton: {
    backgroundColor: colors.background.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerError: {
    borderColor: colors.accent.danger,
  },
  pickerDisabled: {
    backgroundColor: colors.background.secondary,
    opacity: 0.6,
  },
  dateText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 12,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  errorText: {
    color: colors.accent.danger,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '90%',
    maxWidth: 340,
    padding: 16,
  },
  calendarHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  calendarTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    color: colors.accent.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  monthYearText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  futureDay: {
    opacity: 0.5,
  },
  futureDayText: {
    color: colors.text.tertiary,
  },
  dayText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  selectedDay: {
    backgroundColor: colors.accent.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  todayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
  },
  todayButtonText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
});