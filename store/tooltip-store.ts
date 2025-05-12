import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TooltipState {
  rateLimitBannerShown: boolean;
  setRateLimitBannerShown: (shown: boolean) => void;
}

const useTooltipStore = create<TooltipState>()(
  persist(
    (set) => ({
      rateLimitBannerShown: false,
      setRateLimitBannerShown: (shown: boolean) =>
        set({ rateLimitBannerShown: shown }),
    }),
    {
      name: "tooltip-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useTooltipStore;
