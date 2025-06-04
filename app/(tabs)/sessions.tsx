import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import SessionCard from '@/components/SessionCard';
import Button from '@/components/Button';
import SegmentedControl from '@/components/SegmentedControl';

export default function SessionsScreen() {
  const router = useRouter();
  const { sessions } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'profit'>('date');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddSession = () => {
    router.push('/new-session');
  };

  const handleSessionPress = (id: string) => {
    router.push(`/session/${id}`);
  };

  const processedSessions = sessions.sort((a, b) => {
    if (sortBy === 'profit') {
      return (b.cashOut - b.buyIn) - (a.cashOut - a.buyIn);
    }
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch (e) {
      console.error("Error sorting by date:", e);
      return 0;
    }
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Sessions Yet</Text>
          <Text style={styles.emptyText}>Get started by adding your first poker session.</Text>
          <Button 
            title="Add Session" 
            onPress={handleAddSession} 
            style={styles.emptyButton}
          />
        </View>
      );
    }

    return (
      <>
        <View style={styles.filtersContainer}>
          <SegmentedControl
            options={[
              { label: 'Sort by Date', value: 'date' },
              { label: 'Sort by Profit', value: 'profit' }
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value as 'date' | 'profit')}
            style={styles.segmentedControl}
          />
        </View>

        <FlatList
          data={processedSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSessionPress(item.id)}>
              <SessionCard session={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Poker Sessions</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddSession}>
            <Plus size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderContent()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    width: 200,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  segmentedControl: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
});