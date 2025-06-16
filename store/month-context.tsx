import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import useBudgetStore from "./budget-store";

// Create a context for month selection
type MonthContextType = {
  activeMonth: string;
  setActiveMonth: (month: string) => void;
};

const MonthContext = createContext<MonthContextType | null>(null);

// Provider component that will wrap the app - ultra simplified
export const MonthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Always get a current date string for default value
  const defaultMonth = new Date().toISOString().slice(0, 7);

  // Use internal state with default value to avoid store dependency loop
  const [activeMonth, setActiveMonthState] = useState(defaultMonth);

  // Get the store's setSelectedMonth function but don't read selectedMonth to avoid loops
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);

  // Create a memoized setter function to avoid unnecessary re-renders
  const setActiveMonth = useCallback(
    (month: string) => {
      setActiveMonthState(month);
      setSelectedMonth(month);
    },
    [setSelectedMonth]
  );

  // Only sync once on mount from store to avoid infinite loops
  useEffect(() => {
    const storeSelectedMonth = useBudgetStore.getState().selectedMonth;
    if (storeSelectedMonth && storeSelectedMonth !== activeMonth) {
      setActiveMonthState(storeSelectedMonth);
    }
  }, []); // Empty dependency array - only run once on mount

  // Create the context value with useMemo to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeMonth,
      setActiveMonth,
    }),
    [activeMonth, setActiveMonth]
  );

  // Very simple, just provide the context value
  return (
    <MonthContext.Provider value={contextValue}>
      {children}
    </MonthContext.Provider>
  );
};

// Hook to use the month context - always returns a consistent shape
export const useMonthContext = () => {
  // Always call useContext unconditionally to avoid hook errors
  const context = useContext(MonthContext);

  // IMPORTANT: All hook calls must happen before any conditional logic
  // to avoid "rendered fewer hooks than expected" errors

  // We call useState here unconditionally to ensure consistent hook calls
  const [localMonth] = useState(new Date().toISOString().slice(0, 7));

  // Default implementation that works outside provider
  const defaultSetActiveMonth = useCallback((month: string) => {
    console.warn("setActiveMonth called outside Provider - no effect", month);
  }, []);

  // If no context, display a dev warning exactly once
  useEffect(() => {
    if (!context) {
      console.warn("useMonthContext must be used within a MonthProvider");
    }
  }, [context]);

  // Create stable return values using useMemo to avoid reference changes
  // This is crucial for maintaining hook consistency across renders
  const monthContextValue = useMemo(() => {
    return {
      activeMonth: context ? context.activeMonth : localMonth,
      setActiveMonth: context ? context.setActiveMonth : defaultSetActiveMonth,
    };
  }, [context, localMonth, defaultSetActiveMonth]);

  return monthContextValue;
};
