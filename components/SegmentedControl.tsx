import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { colors } from '@/constants/colors';

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  style
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.option,
            value === option.value && styles.selectedOption
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text 
            style={[
              styles.optionText,
              value === option.value && styles.selectedOptionText
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedOption: {
    backgroundColor: colors.accent.primary,
  },
  optionText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});