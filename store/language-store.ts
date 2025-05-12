import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LanguageState } from "@/types/language";
import { translations } from "@/constants/translations";
import { I18nManager } from "react-native";

const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      translations,

      t: (key) => {
        const { language, translations } = get();
        // Try current language
        if (translations[language] && translations[language][key]) {
          return translations[language][key];
        }
        // Fallback to English
        if (translations["en"] && translations["en"][key]) {
          return translations["en"][key];
        }
        // If not found, return the key
        return key;
      },

      setLanguage: (language) => {
        // Set RTL for Arabic
        const isRTL = language === "ar";
        if (I18nManager.isRTL !== isRTL) {
          // In a real app, you would need to restart the app here
          // for RTL changes to take effect properly
          I18nManager.forceRTL(isRTL);
          I18nManager.allowRTL(isRTL);
        }
        set({ language });
      },

      get isRTL() {
        return get().language === "ar";
      },

      resetLanguage: () => {
        // Reset to English and LTR
        if (I18nManager.isRTL) {
          I18nManager.forceRTL(false);
          I18nManager.allowRTL(false);
        }
        set({ language: "en" });
      },
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useLanguageStore;
