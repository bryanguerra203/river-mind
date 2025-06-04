import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Edit2, 
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  Square,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/sessionStore';
import Button from '@/components/Button';
import { formatCurrency, formatDate, formatDuration, formatHourlyRate, formatTimeOnly } from '@/utils/formatters';
import EndSessionModal from '@/components/EndSessionModal';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { sessions, deleteSession } = useSessionStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  const session = sessions.find(s => s.id === id);
  
  if (!session) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Session not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </View>
    );
  }
  
  const profit = session.cashOut - session.buyIn;
  const isProfit = profit > 0;
  const hourlyRate = (profit / (session.duration / 60));
  const isActive = session.status === 'current';
  
  const handleEdit = () => {
    router.push(`/edit-session/${session.id}`);
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Add a small delay to show the loading state
              await new Promise(resolve => setTimeout(resolve, 500));
              deleteSession(session.id);
              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error deleting session:', error);
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  const handleEndSession = () => {
    setIsEnding(true);
  };
  
  const handleCloseEndModal = () => {
    setIsEnding(false);
  };
  
  // Format date safely
  let formattedDate;
  try {
    const date = new Date(session.date);
    if (!isNaN(date.getTime())) {
      formattedDate = formatDate(session.date);
    } else {
      formattedDate = "Unknown Date";
    }
  } catch (e) {
    formattedDate = "Unknown Date";
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.gameType}>
            {session.gameType} • {session.sessionType}
          </Text>
          <Text style={styles.location}>{session.location}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Edit2 size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profitCard}>
        <Text style={styles.profitLabel}>Session Profit</Text>
        <Text 
          style={[
            styles.profitAmount, 
            isProfit ? styles.positive : styles.negative
          ]}
        >
          {isProfit ? '+' : ''}{formatCurrency(profit)}
        </Text>
        
        <View style={styles.profitDetails}>
          <View style={styles.profitDetailItem}>
            <ArrowDown size={16} color={colors.accent.danger} />
            <Text style={styles.profitDetailLabel}>Buy-in</Text>
            <Text style={styles.profitDetailValue}>{formatCurrency(session.buyIn)}</Text>
          </View>
          
          <View style={styles.profitDetailItem}>
            <ArrowUp size={16} color={colors.accent.success} />
            <Text style={styles.profitDetailLabel}>Cash Out</Text>
            <Text style={styles.profitDetailValue}>{formatCurrency(session.cashOut)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={20} color={colors.text.secondary} />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
          </View>
        </View>
        
        <View style={styles.statCard}>
          <DollarSign size={20} color={colors.text.secondary} />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Hourly Rate</Text>
            <Text 
              style={[
                styles.statValue, 
                hourlyRate > 0 ? styles.positive : styles.negative
              ]}
            >
              {formatHourlyRate(hourlyRate)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Session Details</Text>
        
        <View style={styles.detailItem}>
          <Calendar size={20} color={colors.text.secondary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>
        </View>
        
        {/* Show start time for live sessions */}
        {isActive && session.startTime && (
          <View style={styles.detailItem}>
            <Play size={20} color={colors.accent.warning} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>{formatTimeOnly(session.startTime)}</Text>
            </View>
          </View>
        )}
        
        {/* Show start and end times for completed sessions that have them */}
        {!isActive && session.startTime && session.endTime && (
          <>
            <View style={styles.detailItem}>
              <Play size={20} color={colors.text.secondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Started</Text>
                <Text style={styles.detailValue}>{formatTimeOnly(session.startTime)}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Square size={20} color={colors.text.secondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ended</Text>
                <Text style={styles.detailValue}>{formatTimeOnly(session.endTime)}</Text>
              </View>
            </View>
          </>
        )}
        
        <View style={styles.detailItem}>
          <MapPin size={20} color={colors.text.secondary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {session.location} ({session.locationType})
            </Text>
          </View>
        </View>
        
        <View style={styles.detailItem}>
          <DollarSign size={20} color={colors.text.secondary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Stakes</Text>
            <Text style={styles.detailValue}>{session.stakes}</Text>
          </View>
        </View>
      </View>
      
      {session.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        </View>
      )}
      
      {session.tags && session.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsList}>
            {session.tags.map((tag, index) => (
              <View key={index} style={styles.tagItem}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.deleteContainer}>
        {isActive && (
          <Button 
            title="End Session" 
            onPress={handleEndSession} 
            style={[styles.actionButton, styles.endButton]}
          />
        )}
        <Button 
          title="Delete Session" 
          onPress={handleDelete} 
          variant="danger"
          style={styles.actionButton}
          loading={isDeleting}
          disabled={isDeleting}
        />
      </View>
      
      {isActive && (
        <EndSessionModal 
          visible={isEnding}
          onClose={handleCloseEndModal}
          session={session}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  gameType: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  profitCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  profitLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  profitAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
  profitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitDetailLabel: {
    color: colors.text.tertiary,
    marginLeft: 4,
    marginRight: 8,
  },
  profitDetailValue: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    marginLeft: 12,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
  },
  detailLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.text.primary,
    fontSize: 16,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    backgroundColor: colors.background.input,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  deleteContainer: {
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
  },
  endButton: {
    backgroundColor: colors.accent.warning,
    borderColor: colors.accent.warning,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  backButton: {
    width: 120,
  },
});