import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Path, Line, Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { Session } from '@/types/session';
import { formatCurrency } from '@/utils/formatters';
import SegmentedControl from '@/components/SegmentedControl';

interface ProfitChartProps {
  sessions: Session[];
  height?: number;
}

export default function ProfitChart({ sessions, height = 200 }: ProfitChartProps) {
  const [timeRange, setTimeRange] = useState<'ytd' | 'all'>('ytd');
  
  if (sessions.length === 0) {
    return null;
  }

  // Filter sessions based on selected time range
  const filteredSessions = timeRange === 'ytd' 
    ? filterSessionsByYTD(sessions)
    : sessions;
  
  // If no sessions after filtering, show a message
  if (filteredSessions.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profit Over Time</Text>
          <SegmentedControl
            options={[
              { label: 'YTD', value: 'ytd' },
              { label: 'All Time', value: 'all' }
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value as 'ytd' | 'all')}
            style={styles.segmentedControl}
          />
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available for this time period</Text>
        </View>
      </View>
    );
  }

  // Sort sessions by date
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch (e) {
        console.error("Error parsing date for sorting:", e);
        return 0;
      }
    }
  );

  // Calculate cumulative profit for each session
  let cumulativeProfit = 0;
  const profitData = sortedSessions.map(session => {
    const sessionProfit = session.cashOut - session.buyIn;
    cumulativeProfit += sessionProfit;
    return {
      date: new Date(session.date),
      profit: sessionProfit,
      cumulativeProfit,
    };
  });

  // Find min and max values for scaling
  const maxProfit = Math.max(...profitData.map(d => d.cumulativeProfit), 0);
  const minProfit = Math.min(...profitData.map(d => d.cumulativeProfit), 0);
  
  // Calculate range and ensure it's not zero
  const range = Math.max(maxProfit - minProfit, 1);
  
  // Calculate the zero line position (as percentage from bottom)
  const zeroLinePosition = minProfit < 0 
    ? (Math.abs(minProfit) / range) * 100 
    : 0;

  // Width of each point
  const width = Dimensions.get('window').width - 64; // Account for padding
  const pointWidth = width / Math.max(profitData.length - 1, 1);

  // Generate points for the line
  const points = profitData.map((data, index) => {
    // Calculate y position (percentage from bottom)
    const yPercentage = ((data.cumulativeProfit - minProfit) / range) * 100;
    
    return {
      x: index * pointWidth,
      y: 100 - yPercentage, // Invert because SVG coordinates start from top
      value: data.cumulativeProfit,
      date: data.date,
    };
  });

  // Generate SVG path
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Generate area path (fill below the line)
  const areaPathData = `
    ${pathData} 
    L ${points[points.length - 1].x} ${zeroLinePosition > 0 ? 100 - zeroLinePosition : 100} 
    L ${points[0].x} ${zeroLinePosition > 0 ? 100 - zeroLinePosition : 100} 
    Z
  `;

  // Determine if overall profit is positive
  const isPositive = profitData[profitData.length - 1].cumulativeProfit >= 0;

  // Format date ranges for display
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const startDate = formatDate(profitData[0].date);
  const endDate = formatDate(profitData[profitData.length - 1].date);
  
  // For all-time view, show the full date of the first entry on the left
  const leftLabel = timeRange === 'all' 
    ? formatDate(profitData[0].date)
    : startDate;

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profit Over Time</Text>
        <SegmentedControl
          options={[
            { label: 'YTD', value: 'ytd' },
            { label: 'All Time', value: 'all' }
          ]}
          value={timeRange}
          onChange={(value) => setTimeRange(value as 'ytd' | 'all')}
          style={styles.segmentedControl}
        />
      </View>
      
      <View style={styles.profitHeader}>
        <Text style={styles.timeRangeText}>
          {timeRange === 'ytd' ? `${new Date().getFullYear()} Year to Date` : 'All Time'}
        </Text>
        <Text 
          style={[
            styles.totalProfit, 
            isPositive ? styles.positive : styles.negative
          ]}
        >
          {isPositive ? '+' : ''}{formatCurrency(cumulativeProfit)}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {/* Chart area */}
        <View style={styles.chart}>
          <Svg width={width} height={height - 80}>
            {/* Area fill */}
            <Path
              d={areaPathData}
              fill={isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}
            />
            
            {/* Zero line */}
            {minProfit < 0 && (
              <Line
                x1={0}
                y1={100 - zeroLinePosition}
                x2={width}
                y2={100 - zeroLinePosition}
                stroke={colors.border}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            )}
            
            {/* Line */}
            <Path
              d={pathData}
              fill="none"
              stroke={isPositive ? colors.accent.success : colors.accent.danger}
              strokeWidth="2"
            />
            
            {/* Points */}
            {points.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={isPositive ? colors.accent.success : colors.accent.danger}
              />
            ))}
          </Svg>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {profitData.length > 1 && (
            <>
              <Text style={styles.axisLabel}>{leftLabel}</Text>
              <Text style={styles.axisLabel}>{endDate}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// Helper function to filter sessions by Year to Date
function filterSessionsByYTD(sessions: Session[]): Session[] {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
  
  return sessions.filter(session => {
    try {
      const sessionDate = new Date(session.date);
      return sessionDate >= startOfYear && sessionDate.getFullYear() === currentYear;
    } catch (e) {
      console.error("Error parsing date for YTD filter:", e);
      // If date parsing fails, exclude the session
      return false;
    }
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentedControl: {
    width: 160,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalProfit: {
    fontSize: 18,
    fontWeight: '700',
  },
  positive: {
    color: colors.accent.success,
  },
  negative: {
    color: colors.accent.danger,
  },
  chartContainer: {
    flex: 1,
  },
  chart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
});