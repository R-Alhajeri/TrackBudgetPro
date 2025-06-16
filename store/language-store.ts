import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import { LanguageState, LanguageCode, Translation } from "../types/language";
import translations from "../constants/translations";

// Get device language and check if it's supported
const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.locale.split("-")[0]; // Get language code without region
  return (
    deviceLocale === "es" || deviceLocale === "ar" ? deviceLocale : "en"
  ) as LanguageCode;
};

const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: getDeviceLanguage(),
      isRTL: ["ar", "he", "ur"].includes(getDeviceLanguage()), // Initialize based on device language

      setLanguage: (language) => {
        // Check if the language is RTL
        const isRTL = ["ar", "he", "ur"].includes(language);
        set({ language, isRTL });

        // Update React Native's I18nManager for proper RTL layout
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
          // Note: In production, you might want to restart the app for RTL changes to take full effect
          // Updates.reloadAsync(); // Uncomment if using expo-updates
        }
      },

      t: (key, params?) => {
        const { language } = get();

        // Safely access translations
        if (!translations || !translations[language]) {
          console.warn(
            `Translation object not available for language: ${language}`
          );
          return key as string; // Return the key as fallback
        }

        let translation =
          translations[language][key] ||
          translations.en[key] ||
          (key as string);

        // Handle string interpolation with parameters
        if (params && typeof translation === "string") {
          // Replace {{key}} patterns with values from params
          Object.entries(params).forEach(([paramKey, paramValue]) => {
            const pattern = new RegExp(`{{${paramKey}}}`, "g");
            translation = translation.replace(pattern, String(paramValue));
          });
        }

        // Return the translation or the key if translation is not found
        return translation as string;
      },

      resetLanguage: () => {
        set({ language: "en", isRTL: false });
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Initialize RTL when store is rehydrated
        if (state) {
          const isRTL = ["ar", "he", "ur"].includes(state.language);
          I18nManager.allowRTL(isRTL);
          if (I18nManager.isRTL !== isRTL) {
            I18nManager.forceRTL(isRTL);
          }
        }
      },
    }
  )
);

export default useLanguageStore;
