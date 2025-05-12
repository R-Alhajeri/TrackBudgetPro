import { useColorScheme } from 'react-native';
import useThemeStore from '@/store/theme-store';
import Colors from '@/constants/colors';

export default function useAppTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, systemTheme } = useThemeStore();
  
  // Use the user's selected theme, or fall back to system theme
  const activeTheme = theme || systemTheme || 'light';
  
  // Get the appropriate color palette
  const colors = activeTheme === 'dark' ? Colors.dark : Colors.light;
  
  return {
    theme: activeTheme,
    colors,
    isDark: activeTheme === 'dark',
  };
}