import { StyleProp, ViewStyle, TextStyle } from "react-native";

// Common border radius values
export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xLarge: 24,
  circle: 999,
};

// Common shadow styles
export const Shadows = {
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },

  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Spacing values for consistent padding/margin
export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

// Typography presets
export const Typography = {
  header: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  } as TextStyle,

  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  } as TextStyle,

  subtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
  } as TextStyle,

  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  } as TextStyle,

  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  } as TextStyle,

  largeTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  } as TextStyle,
};

// Animation presets for pressable components
export const PressableStates = {
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
};

// Common button styles
export const ButtonStyles = {
  primary: (backgroundColor: string) => ({
    backgroundColor,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...Shadows.medium,
  }),

  outline: (borderColor: string) => ({
    backgroundColor: "transparent",
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  }),
};

// Input field styles
export const InputStyles = {
  regular: (borderColor: string, backgroundColor: string) => ({
    borderWidth: 1,
    borderColor,
    backgroundColor,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    ...Shadows.small,
  }),
};

// Card styles
export const CardStyles = {
  regular: (backgroundColor: string) => ({
    backgroundColor,
    borderRadius: BorderRadius.large,
    padding: Spacing.m,
    width: "100%",
    alignSelf: "center",
    ...Shadows.small,
  }),

  elevated: (backgroundColor: string) => ({
    backgroundColor,
    borderRadius: BorderRadius.large,
    padding: Spacing.m,
    width: "100%",
    alignSelf: "center",
    ...Shadows.medium,
  }),
};
