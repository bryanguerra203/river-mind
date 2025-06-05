import { useSessionStore } from '@/store/sessionStore';
import { Session } from '@/types/session';
import { generateId } from '@/utils/helpers';

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateProfit = () => {
  const isWin = Math.random() < 0.6;
  const baseAmount = randomNumber(50, 500);
  return isWin ? baseAmount : -baseAmount;
};

const generateDuration = () => randomNumber(60, 480);
const generateStake = () => {
  const stakes = ['1/2', '2/5', '5/10', '10/20', '25/50'];
  return stakes[Math.floor(Math.random() * stakes.length)];
};
const generateLocation = () => {
  const locations = [
    'Bellagio', 'Aria', 'Wynn', 'Venetian', 'MGM Grand',
    'Caesars Palace', 'Mandalay Bay', 'Wynn Encore', 'Resorts World', 'Park MGM'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};
const generateGameType = () => {
  const gameTypes = ["Hold'em", 'Omaha', 'PLO', 'Mixed'];
  return gameTypes[Math.floor(Math.random() * gameTypes.length)];
};
const generateSessionType = () => {
  const sessionTypes = ['cash', 'tournament', 'sit-n-go'];
  return sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
};
const generateLocationType = () => {
  const locationTypes = ['casino', 'home', 'online'];
  return locationTypes[Math.floor(Math.random() * locationTypes.length)];
};
const generateTags = () => {
  const allTags = ['deep stack', 'short stack', 'rush', 'grind', 'final table', 'bubble', 'satellite'];
  const numTags = randomNumber(0, 3);
  const tags: string[] = [];
  for (let i = 0; i < numTags; i++) {
    const tag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
};

const generateSessions = (count: number) => {
  const sessions: Session[] = [];
  const startDate = new Date('2024-06-01');
  const endDate = new Date('2025-06-4');
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const usedDates = new Set<string>();
  let i = 0;
  while (i < count && usedDates.size < totalDays) {
    const randomDay = Math.floor(Math.random() * totalDays);
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + randomDay);
    const dateString = currentDate.toISOString().split('T')[0];
    if (!usedDates.has(dateString)) {
      usedDates.add(dateString);
      const buyIn = randomNumber(100, 1000);
      const profit = generateProfit();
      const cashOut = buyIn + profit;
      const session: Session = {
        id: generateId(),
        date: currentDate.toISOString(),
        gameType: generateGameType(),
        sessionType: generateSessionType(),
        locationType: generateLocationType(),
        location: generateLocation(),
        stakes: generateStake(),
        buyIn,
        cashOut,
        duration: generateDuration(),
        notes: `Load test session ${i + 1}`,
        tags: generateTags(),
        status: 'past',
      };
      sessions.push(session);
      i++;
    }
  }
  return sessions;
};

export function loadTestSessionsIfEmpty() {
  const { sessions, addSession } = useSessionStore.getState();
  if (sessions.length === 0) {
    const testSessions = generateSessions(200);
    testSessions.forEach(addSession);
    // Optionally, you can log or alert here
    // console.log('Loaded 500 test sessions');
  }
} 