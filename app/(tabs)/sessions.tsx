import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Filter } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import SessionCard from '@/components/SessionCard';
import Button from '@/components/Button';
import SegmentedControl from '@/components/SegmentedControl';
import Select from '@/components/Select';
import { gameTypes, sessionTypes, locationTypes } from '@/constants/gameTypes';

export default function SessionsScreen() {
  const router = useRouter();
  const { sessions, getFilteredSessions, filters, setFilters, clearFilters } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'profit'>('date');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Count active filters for indicator
    let count = 0;
    if (filters.gameType) count++;
    if (filters.sessionType) count++;
    if (filters.locationType) count++;
    if (filters.stakes) count++;
    if (filters.location) count++;
    if (filters.dateRange) count++;
    if (filters.status) count++;
    setActiveFilterCount(count);
  }, [filters]);

  const handleAddSession = () => {
    router.push('/new-session');
  };

  const handleSessionPress = (id: string) => {
    router.push(`/session/${id}`);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    setFilters({});
    setFilterModalVisible(false);
  };

  const filteredSessions = getFilteredSessions();
  const processedSessions = filteredSessions.sort((a, b) => {
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

    if (processedSessions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Sessions Match Filters</Text>
          <Text style={styles.emptyText}>Try adjusting your filters to see more sessions.</Text>
          <Button 
            title="Clear Filters" 
            onPress={handleClearFilters} 
            variant="outline"
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
          <TouchableOpacity 
            style={[styles.headerButton, activeFilterCount > 0 && styles.filterButtonActive]} 
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={activeFilterCount > 0 ? colors.accent.primary : colors.text.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterIndicator}>
                <Text style={styles.filterIndicatorText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddSession}>
            <Plus size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderContent()}

      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Filter Sessions</Text>
            
            <View style={styles.filterOptions}>
              <Select
                label="Game Type"
                placeholder="All Game Types"
                options={gameTypes}
                value={tempFilters.gameType}
                onChange={(value) => setTempFilters(prev => ({ ...prev, gameType: value }))}
              />
              
              <Select
                label="Session Type"
                placeholder="All Session Types"
                options={sessionTypes}
                value={tempFilters.sessionType}
                onChange={(value) => setTempFilters(prev => ({ ...prev, sessionType: value }))}
              />
              
              <Select
                label="Location Type"
                placeholder="All Location Types"
                options={locationTypes}
                value={tempFilters.locationType}
                onChange={(value) => setTempFilters(prev => ({ ...prev, locationType: value }))}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Clear"
                variant="outline"
                onPress={() => setTempFilters({})}
                style={styles.modalButton}
              />
              <Button
                title="Apply"
                onPress={handleApplyFilters}
                style={styles.modalButton}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
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
  filterButtonActive: {
    borderColor: colors.accent.primary,
    borderWidth: 1,
  },
  filterIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.accent.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIndicatorText: {
    color: colors.background.primary,
    fontSize: 10,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOptions: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
  },
});