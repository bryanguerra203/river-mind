import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Plus, Filter, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import { useGuestStore } from '@/store/guestStore';
import { Session } from '@/types/session';
import { formatDate, formatCurrency, formatDuration } from '@/utils/formatters';
import SessionCard from '@/components/SessionCard';
import Button from '@/components/Button';
import SegmentedControl from '@/components/SegmentedControl';
import GuestModePrompt from '@/components/GuestModePrompt';
import { trackScreenRender, trackListPerformance, trackFunctionExecution } from '@/utils/performance';
import { gameTypes } from '@/constants/gameTypes';

export default function SessionsScreen() {
  const router = useRouter();
  const { sessions, stats, initializeStats } = useSessionStore();
  const { isGuestMode } = useGuestStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'profit'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gameType: [] as string[],
    sessionType: [] as string[],
    locationType: [] as string[],
    tags: [] as string[],
    year: '',
    month: '',
    profitStatus: '',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const listTrackerRef = useRef<ReturnType<typeof trackListPerformance> | null>(null);

  useEffect(() => {
    // Initialize stats from stored sessions
    initializeStats();
    
    // Simulate a small delay to show loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [initializeStats]);

  const handleAddSession = () => {
    router.push('/new-session');
  };

  const handleSessionPress = (id: string) => {
    router.push(`/session/${id}`);
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    console.log('Filter change:', key, value); // Debug log
    setTempFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('New filters:', newFilters); // Debug log
      return newFilters;
    });
  };

  const handleApplyFilters = async () => {
    console.log('Applying filters:', tempFilters); // Debug log
    const filterTracker = trackFunctionExecution('handleApplyFilters');
    setIsSorting(true);
    setFilters(tempFilters);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsSorting(false);
    setShowFilters(false);
    filterTracker.end();
  };

  const handleClearFilters = () => {
    console.log('Clearing filters'); // Debug log
    const clearedFilters = {
      gameType: [] as string[],
      sessionType: [] as string[],
      locationType: [] as string[],
      tags: [] as string[],
      year: '',
      month: '',
      profitStatus: '',
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gameType.length > 0) count++;
    if (filters.sessionType.length > 0) count++;
    if (filters.locationType.length > 0) count++;
    if (filters.tags.length > 0) count++;
    return count;
  };

  const filteredSessions = sessions.filter(session => {
    // Game Type filter
    if (filters.gameType.length > 0) {
      const hasGameType = filters.gameType.some(type => type === session.gameType);
      if (!hasGameType) return false;
    }

    // Session Type filter
    if (filters.sessionType.length > 0) {
      const hasSessionType = filters.sessionType.some(type => type === session.sessionType);
      if (!hasSessionType) return false;
    }

    // Location Type filter
    if (filters.locationType.length > 0) {
      const hasLocationType = filters.locationType.some(type => type === session.locationType);
      if (!hasLocationType) return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => session.tags?.includes(tag));
      if (!hasAllTags) return false;
    }

    // Year filter
    if (filters.year) {
      const sessionYear = new Date(session.date).getFullYear().toString();
      if (sessionYear !== filters.year) return false;
    }

    // Month filter
    if (filters.month) {
      const sessionMonth = new Date(session.date).getMonth() + 1;
      const filterMonth = parseInt(filters.month, 10);
      if (sessionMonth !== filterMonth) return false;
    }

    // Profit Status filter
    if (filters.profitStatus) {
      const profit = session.cashOut - session.buyIn;
      if (filters.profitStatus === 'profit' && profit <= 0) return false;
      if (filters.profitStatus === 'loss' && profit >= 0) return false;
    }

    return true;
  });

  const processedSessions = filteredSessions.sort((a, b) => {
    if (sortBy === 'profit') {
      const profitA = a.cashOut - a.buyIn;
      const profitB = b.cashOut - b.buyIn;
      return sortDirection === 'desc' ? profitB - profitA : profitA - profitB;
    } else {
      // Sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  const handleSortChange = async (value: string) => {
    const sortTracker = trackFunctionExecution('handleSortChange');
    setIsSorting(true);
    setSortBy(value as 'date' | 'profit');
    await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
    setIsSorting(false);
    sortTracker.end();
  };

  const handleSortDirectionChange = async () => {
    const sortTracker = trackFunctionExecution('handleSortDirectionChange');
    setIsSorting(true);
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay
    setIsSorting(false);
    sortTracker.end();
  };

  const getAllUniqueTags = () => {
    const tagSet = new Set<string>();
    sessions.forEach(session => {
      session.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // If in guest mode, show guest mode prompt
  if (isGuestMode) {
    return <GuestModePrompt pageName="Sessions" />;
  }

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Session Results</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Profit Status</Text>
                <View style={styles.profitStatusContainer}>
                  {[
                    { label: 'All', value: '' },
                    { label: 'Profit', value: 'profit' },
                    { label: 'Loss', value: 'loss' }
                  ].map(status => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.profitStatusButton,
                        tempFilters.profitStatus === status.value && styles.profitStatusButtonActive
                      ]}
                      onPress={() => handleFilterChange('profitStatus', status.value)}
                    >
                      <Text style={[
                        styles.profitStatusButtonText,
                        tempFilters.profitStatus === status.value && styles.profitStatusButtonTextActive
                      ]}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Time Period</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
                  <View style={styles.yearContainer}>
                    <TouchableOpacity
                      style={[styles.yearButton, !tempFilters.year && styles.yearButtonActive]}
                      onPress={() => handleFilterChange('year', '')}
                    >
                      <Text style={[styles.yearButtonText, !tempFilters.year && styles.yearButtonTextActive]}>All</Text>
                    </TouchableOpacity>
                    {['2023', '2024', '2025'].map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[styles.yearButton, tempFilters.year === year && styles.yearButtonActive]}
                        onPress={() => handleFilterChange('year', year)}
                      >
                        <Text style={[styles.yearButtonText, tempFilters.year === year && styles.yearButtonTextActive]}>{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
                  <View style={styles.monthContainer}>
                    <TouchableOpacity
                      style={[styles.monthButton, !tempFilters.month && styles.monthButtonActive]}
                      onPress={() => handleFilterChange('month', '')}
                    >
                      <Text style={[styles.monthButtonText, !tempFilters.month && styles.monthButtonTextActive]}>All</Text>
                    </TouchableOpacity>
                    {[
                      { label: 'Jan', value: '1' }, { label: 'Feb', value: '2' }, { label: 'Mar', value: '3' },
                      { label: 'Apr', value: '4' }, { label: 'May', value: '5' }, { label: 'Jun', value: '6' },
                      { label: 'Jul', value: '7' }, { label: 'Aug', value: '8' }, { label: 'Sep', value: '9' },
                      { label: 'Oct', value: '10' }, { label: 'Nov', value: '11' }, { label: 'Dec', value: '12' }
                    ].map(month => (
                      <TouchableOpacity
                        key={month.value}
                        style={[
                          styles.monthButton,
                          tempFilters.month === month.value && styles.monthButtonActive
                        ]}
                        onPress={() => handleFilterChange('month', month.value)}
                      >
                        <Text style={[
                          styles.monthButtonText,
                          tempFilters.month === month.value && styles.monthButtonTextActive
                        ]}>
                          {month.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Game Details</Text>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Game Type</Text>
                <View style={styles.gameTypeContainer}>
                  {gameTypes.map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.gameTypeButton,
                        tempFilters.gameType.includes(type.id) && styles.gameTypeButtonActive
                      ]}
                      onPress={() => {
                        const newTypes = tempFilters.gameType.includes(type.id)
                          ? tempFilters.gameType.filter(t => t !== type.id)
                          : [...tempFilters.gameType, type.id];
                        handleFilterChange('gameType', newTypes);
                      }}
                    >
                      <Text style={[
                        styles.gameTypeButtonText,
                        tempFilters.gameType.includes(type.id) && styles.gameTypeButtonTextActive
                      ]}>
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Session Type</Text>
                <View style={styles.sessionTypeContainer}>
                  {[
                    { label: 'All', value: '' },
                    { label: 'Cash', value: 'cash' },
                    { label: 'Tournament', value: 'tournament' },
                    { label: 'Sit & Go', value: 'sit-n-go' }
                  ].map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.sessionTypeButton, tempFilters.sessionType.includes(type.value) && styles.sessionTypeButtonActive]}
                      onPress={() => {
                        const newTypes = tempFilters.sessionType.includes(type.value)
                          ? tempFilters.sessionType.filter(t => t !== type.value)
                          : [...tempFilters.sessionType, type.value];
                        handleFilterChange('sessionType', newTypes);
                      }}
                    >
                      <Text style={[styles.sessionTypeButtonText, tempFilters.sessionType.includes(type.value) && styles.sessionTypeButtonTextActive]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Location Type</Text>
                <View style={styles.locationTypeContainer}>
                  {[
                    { label: 'All', value: '' },
                    { label: 'Casino', value: 'casino' },
                    { label: 'Home', value: 'home' },
                    { label: 'Online', value: 'online' }
                  ].map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.locationTypeButton, tempFilters.locationType.includes(type.value) && styles.locationTypeButtonActive]}
                      onPress={() => {
                        const newTypes = tempFilters.locationType.includes(type.value)
                          ? tempFilters.locationType.filter(t => t !== type.value)
                          : [...tempFilters.locationType, type.value];
                        handleFilterChange('locationType', newTypes);
                      }}
                    >
                      <Text style={[styles.locationTypeButtonText, tempFilters.locationType.includes(type.value) && styles.locationTypeButtonTextActive]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {getAllUniqueTags().map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      tempFilters.tags.includes(tag) && styles.tagButtonActive
                    ]}
                    onPress={() => {
                      const newTags = tempFilters.tags.includes(tag)
                        ? tempFilters.tags.filter(t => t !== tag)
                        : [...tempFilters.tags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                  >
                    <Text style={[
                      styles.tagText,
                      tempFilters.tags.includes(tag) && styles.tagTextActive
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderItem = ({ item }: { item: any }) => {
    if (listTrackerRef.current) {
      listTrackerRef.current.addItem();
    }
    
    return (
      <TouchableOpacity onPress={() => handleSessionPress(item.id)}>
        <SessionCard session={item} />
      </TouchableOpacity>
    );
  };

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
          <View style={styles.sortContainer}>
            <View style={styles.sortTypeContainer}>
              <SegmentedControl
                options={[
                  { label: 'Date', value: 'date' },
                  { label: 'Profit', value: 'profit' }
                ]}
                value={sortBy}
                onChange={handleSortChange}
                style={styles.segmentedControl}
              />
            </View>
            <TouchableOpacity 
              style={styles.sortDirectionButton}
              onPress={handleSortDirectionChange}
            >
              <Text style={styles.sortDirectionText}>
                {sortDirection === 'desc' ? '↓' : '↑'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sessionCount}>
            {processedSessions.length} {processedSessions.length === 1 ? 'session' : 'sessions'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={processedSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              if (listTrackerRef.current) {
                listTrackerRef.current.end();
              }
            }}
            onScrollBeginDrag={() => {
              listTrackerRef.current = trackListPerformance('SessionsList');
            }}
          />
          {isSorting && (
            <View style={styles.sortingOverlay}>
              <BlurView
                style={styles.blurView}
                intensity={20}
                tint="dark"
              >
                <ActivityIndicator size="large" color={colors.text.primary} />
                <Text style={styles.sortingText}>Sorting sessions...</Text>
              </BlurView>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Poker Sessions</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleFilterPress}>
            <Filter size={20} color={colors.text.primary} />
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddSession}>
            <Plus size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderContent()}
      {renderFilterModal()}
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
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.accent.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  yearScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  yearContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  yearButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  yearButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  monthScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  monthContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  monthButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  monthButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  gameTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameTypeButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  gameTypeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  gameTypeButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionTypeButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  sessionTypeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  sessionTypeButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  locationTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationTypeButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  locationTypeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  locationTypeButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  tagText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  tagTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
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
  sessionCount: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'right',
  },
  profitStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  profitStatusButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  profitStatusButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  profitStatusButtonText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  profitStatusButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortTypeContainer: {
    flex: 1,
  },
  sortDirectionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortDirectionText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  sortingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortingText: {
    color: colors.text.primary,
    fontSize: 16,
    marginTop: 12,
  },
});