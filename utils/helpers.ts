import { Platform } from 'react-native';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function calculateProfit(buyIn: number, cashOut: number): number {
  return cashOut - buyIn;
}

export function calculateHourlyRate(profit: number, durationMinutes: number): number {
  if (durationMinutes === 0) return 0;
  const hours = durationMinutes / 60;
  return profit / hours;
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function groupSessionsByDate(sessions: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  sessions.forEach(session => {
    // Ensure we have a valid date
    let dateStr;
    try {
      const date = new Date(session.date);
      if (isNaN(date.getTime())) {
        // If date is invalid, use current date
        dateStr = new Date().toLocaleDateString('en-US');
      } else {
        dateStr = date.toLocaleDateString('en-US');
      }
    } catch (e) {
      // If there's an error parsing the date, use current date
      dateStr = new Date().toLocaleDateString('en-US');
    }
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(session);
  });
  
  return grouped;
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}