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
      setGuestMode: (isGuest: boolean) => set({ isGuestMode: isGuest }),
      clearGuestMode: () => set({ isGuestMode: false }),
    }),
    {
      name: 'guest-mode',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 