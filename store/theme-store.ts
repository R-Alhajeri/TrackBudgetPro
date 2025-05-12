import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the theme types
export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  resetTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        if (currentTheme === 'light') {
          set({ theme: 'dark' });
        } else if (currentTheme === 'dark') {
          set({ theme: 'light' });
        } else {
          // If system, check what the system is currently using and toggle to the opposite
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ theme: isDarkMode ? 'light' : 'dark' });
        }
      },
      
      resetTheme: () => set({ theme: 'system' }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useThemeStore;