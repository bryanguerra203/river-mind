import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Linking, Image, ScrollView } from 'react-native';
import { Trash2, Download, Mail, LogOut } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { useGuestStore } from '@/store/guestStore';
import * as FileSystem from 'expo-file-system';
import { formatDate, formatTimeOnly } from '@/utils/formatters';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import GuestModePrompt from '@/components/GuestModePrompt';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { clearAllSessions, sessions } = useSessionStore();
  const { isGuestMode } = useGuestStore();

  const handleClearAllSessions = () => {
    Alert.alert(
      "Clear All Sessions",
      "Are you sure you want to delete all session data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await clearAllSessions();
              Alert.alert("Success", "All sessions have been cleared.");
            } catch (error: any) {
              console.error('Error clearing sessions:', error);
              Alert.alert(
                "Error",
                "Failed to clear sessions. Please try again."
              );
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const handleContactUs = async () => {
    try {
      const url = 'mailto:developerrivermind@gmail.com';
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open email client');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Could not open email client');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear the session store first
              useSessionStore.getState().clearStore();
              
              // Clear guest mode
              useGuestStore.getState().clearGuestMode();
              
              // Then sign out from Supabase
              const { error } = await supabase.auth.signOut();
              if (error) throw error;

              // Navigate to login screen
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filterSessionsYTD = () => {
    const currentYear = new Date().getFullYear();
    return sessions.filter(session => new Date(session.date).getFullYear() === currentYear);
  };

  const handleExportCSV = async (sessionsToExport: typeof sessions) => {
    try {
      // Create CSV header
      const headers = [
        'Day',
        'Year',
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
      const rows = sessionsToExport.map(session => [
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
        message: `Here is my poker sessions data export (${sessionsToExport.length} sessions).`
      });

    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export sessions data.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action is irreversible. All your data will be permanently deleted and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call Supabase Edge Function to delete all user data
              const { data, error } = await supabase.functions.invoke('delete-user-data', {
                // No body needed, JWT will be used for user context
                method: 'POST',
              });
              if (error) throw error;

              // Sign out from Supabase
              await supabase.auth.signOut();

              // Clear all local state and cache
              useSessionStore.getState().clearStore();
              useGuestStore.getState().clearGuestMode();
              await AsyncStorage.clear();

              // Navigate to login
              router.replace('/login');
            } catch (err: any) {
              console.error('Error deleting account:', err);
              Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
            }
          }
        }
      ]
    );
  };

  // If in guest mode, show guest mode prompt
  if (isGuestMode) {
    return <GuestModePrompt pageName="Settings" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <View style={styles.exportButtons}>
          <View style={styles.exportOption}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => handleExportCSV(sessions)}
            >
              <Download size={20} color={colors.accent.primary} />
              <Text style={styles.exportButtonText}>Export All Sessions</Text>
            </TouchableOpacity>
            <Text style={styles.exportDescription}>
              Download a CSV file containing all your poker sessions.
            </Text>
          </View>

          <View style={styles.exportOption}>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => handleExportCSV(filterSessionsYTD())}
            >
              <Download size={20} color={colors.accent.primary} />
              <Text style={styles.exportButtonText}>Export YTD Sessions</Text>
            </TouchableOpacity>
            <Text style={styles.exportDescription}>
              Download a CSV file containing your sessions from {new Date().getFullYear()}.
            </Text>
          </View>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleClearAllSessions}
          >
            <Trash2 size={20} color={colors.accent.danger} />
            <Text style={styles.dangerButtonText}>Clear All Sessions</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            Permanently delete all your session data. This action cannot be undone.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <View style={styles.supportOption}>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactUs}
          >
            <Mail size={20} color={colors.accent.primary} />
            <Text style={styles.contactButtonText}>Contact Us</Text>
          </TouchableOpacity>
          <Text style={styles.contactDescription}>
            Have questions or feedback? Send us an email and we'll get back to you.
          </Text>
        </View>

        <View style={styles.supportOption}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.accent.danger} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.logoutDescription}>
            Sign out of your account. You can log back in at any time.
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Image 
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.infoText}>RiverMind</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delete Account</Text>
        <TouchableOpacity 
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Trash2 size={20} color={colors.accent.danger} />
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteAccountDescription}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  exportButtons: {
    gap: 20,
  },
  exportOption: {
    marginBottom: 4,
  },
  exportButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 20,
  },
  dangerSection: {
    marginTop: 24,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 20,
  },
  supportOption: {
    marginBottom: 4,
  },
  contactButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  contactButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  contactDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutButtonText: {
    color: colors.accent.danger,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  infoText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 8,
  },
  deleteAccountButtonText: {
    color: colors.accent.danger,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  deleteAccountDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    lineHeight: 20,
    textAlign: 'left',
  },
});