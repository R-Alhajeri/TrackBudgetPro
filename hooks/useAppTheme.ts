import { useColorScheme } from "react-native";
import useThemeStore, { ThemeType } from "../store/theme-store";
import colors from "../constants/colors";

export default function useAppTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const systemTheme = useColorScheme() as "light" | "dark" | null;

  // Determine if we should use dark mode
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  // Get the appropriate color scheme with fallback
  const themeColors = isDark ? colors.dark : colors.light;

  // Ensure colors are always defined
  if (!themeColors) {
    console.error("Theme colors are undefined, using fallback light colors");
    return {
      theme: theme || "light",
      colors: colors.light,
      isDark: false,
      toggleTheme,
    };
  }

  return {
    theme: theme || "light",
    colors: themeColors,
    isDark,
    toggleTheme,
  };
}
