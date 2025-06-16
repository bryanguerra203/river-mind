import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder = 'Add tags...' }: TagInputProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const sessions = useSessionStore(state => state.sessions);

  // Get all unique tags from sessions
  const getAllTags = () => {
    const tagSet = new Set<string>();
    sessions.forEach(session => {
      session.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Filter tags based on input
  useEffect(() => {
    const allTags = getAllTags();
    if (inputValue.trim()) {
      const filtered = allTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      // Show all available tags that haven't been selected yet
      const availableTags = allTags.filter(tag => !value.includes(tag));
      setFilteredTags(availableTags);
    }
  }, [inputValue, value]);

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleAddTag(inputValue.trim());
    }
  };

  const renderTagModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Tags</Text>
            <TouchableOpacity 
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type to search or add new tag"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={handleInputSubmit}
              returnKeyType="done"
            />
            {inputValue.trim() && (
              <TouchableOpacity 
                onPress={() => setInputValue('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.tagsList}>
            {filteredTags.map((tag, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.tagOption,
                  pressed && styles.tagOptionPressed
                ]}
                onPress={() => handleAddTag(tag)}
                android_ripple={{ color: colors.accent.primary }}
              >
                <Text style={styles.tagOptionText}>{tag}</Text>
                <Ionicons name="add-circle-outline" size={20} color={colors.text.primary} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButtonContainer}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </View>
        <Text style={styles.addButtonText}>Add tag</Text>
      </TouchableOpacity>

      <ScrollView 
        horizontal 
        style={styles.tagsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {value.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveTag(tag)}
              style={styles.removeTagButton}
            >
              <Ionicons name="close" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {renderTagModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  addButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    color: colors.text.primary,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
  tagsList: {
    maxHeight: 300,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tagOptionPressed: {
    backgroundColor: colors.accent.primary + '40',
  },
  tagOptionText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    minHeight: 32,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    color: colors.text.primary,
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    padding: 4,
  },
}); 