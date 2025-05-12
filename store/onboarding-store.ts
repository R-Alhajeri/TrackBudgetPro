import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  hydrate: () => Promise<void>;
}

export const ONBOARDING_KEY = "hasSeenOnboarding";

const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  setHasSeenOnboarding: (seen) => {
    set({ hasSeenOnboarding: seen });
    AsyncStorage.setItem(ONBOARDING_KEY, seen ? "1" : "0");
  },
  hydrate: async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ hasSeenOnboarding: value === "1" });
  },
}));

export default useOnboardingStore;
