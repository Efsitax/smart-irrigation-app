// src/stores/theme-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (t: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (t) => set({ theme: t })
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);