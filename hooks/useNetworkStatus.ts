import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? false);
      });
    } catch (error) {
      console.error('Error setting up network listener:', error);
      // Default to online if we can't determine network status
      setIsOnline(true);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from network listener:', error);
        }
      }
    };
  }, []);

  return isOnline;
} 