import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Trash2, Download } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import * as FileSystem from 'expo-file-system';
import { formatDate, formatTimeOnly } from '@/utils/formatters';

export default function SettingsScreen() {
  const { clearAllSessions, sessions } = useSessionStore();

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

  const handleExportCSV = async () => {
    try {
      // Create CSV header
      const headers = [
        'Date',
        'Game Type',
        'Session Type',
        'Location',
        'Stakes',
        'Buy In',
        'Cash Out',
        'Profit',
        'Duration (minutes)',
        'Notes',
        'Tags'
      ].join(',');

      // Convert sessions to CSV rows
      const rows = sessions.map(session => [
        formatDate(session.date),
        session.gameType,
        session.sessionType,
        `${session.location} (${session.locationType})`,
        session.stakes,
        session.buyIn,
        session.cashOut,
        session.cashOut - session.buyIn,
        session.duration,
        `"${session.notes?.replace(/"/g, '""') || ''}"`,
        `"${session.tags?.join(';') || ''}"`
      ].join(','));

      const csvContent = [headers, ...rows].join('\n');
      
      // Create a temporary file
      const fileUri = `${FileSystem.cacheDirectory}poker_sessions_${new Date().toISOString().split('T')[0]}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      await Share.share({
        url: fileUri,
        title: 'Poker Sessions Export',
        message: 'Here is my poker sessions data export.'
      });

    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export sessions data.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExportCSV}
        >
          <Download size={20} color={colors.accent.primary} />
          <Text style={styles.exportButtonText}>Export Sessions as CSV</Text>
        </TouchableOpacity>
        <Text style={styles.exportDescription}>
          Export all your session data as a CSV file.
        </Text>

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
  exportButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  exportButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  exportDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    paddingHorizontal: 16,
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