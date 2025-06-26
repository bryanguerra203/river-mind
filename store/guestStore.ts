import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GuestState {
  isGuestMode: boolean;
  setGuestMode: (isGuest: boolean) => void;
  clearGuestMode: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuestMode: false,
      setGuestMode: (isGuest: boolean) => {
        try {
          set({ isGuestMode: isGuest });
        } catch (error) {
          console.error('Error setting guest mode:', error);
        }
      },
      clearGuestMode: () => {
        try {
          set({ isGuestMode: false });
        } catch (error) {
          console.error('Error clearing guest mode:', error);
        }
      },
    }),
    {
      name: 'guest-mode',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Guest store rehydrated:', state);
      },
      partialize: (state) => ({ isGuestMode: state.isGuestMode }),
    }
  )
); 