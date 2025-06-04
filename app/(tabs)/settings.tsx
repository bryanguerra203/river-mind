import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import Button from '@/components/Button';

export default function SettingsScreen() {
  const { clearAllSessions } = useSessionStore();

  const handleClearAllSessions = () => {
    Alert.alert(
      "Clear All Sessions",
      "Are you sure you want to delete all session data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: () => {
            clearAllSessions();
            Alert.alert("Success", "All sessions have been cleared.");
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.dangerButton}
          onPress={handleClearAllSessions}
        >
          <Trash2 size={20} color={colors.accent.danger} />
          <Text style={styles.dangerButtonText}>Clear All Sessions</Text>
        </TouchableOpacity>
        <Text style={styles.dangerDescription}>
          This will permanently delete all your session data.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Poker Tracker App</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerButtonText: {
    color: colors.accent.danger,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  dangerDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  infoText: {
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  versionText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
});