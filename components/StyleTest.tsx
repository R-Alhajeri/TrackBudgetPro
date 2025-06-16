import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  BorderRadius,
  Shadows,
  Typography,
  PressableStates,
  ButtonStyles,
} from "../constants/styleGuide";
import useAppTheme from "../hooks/useAppTheme";

/**
 * A test component to verify that the styleGuide is working correctly
 */
const StyleTest: React.FC = () => {
  const { colors, isDark } = useAppTheme();

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card },
          Shadows.small,
        ]}
      >
        <Text
          style={[styles.heading, { color: colors.text }, Typography.header]}
        >
          Style Guide Test
        </Text>

        <Text
          style={[
            styles.subheading,
            { color: colors.subtext },
            Typography.subtitle,
          ]}
        >
          Typography Samples
        </Text>

        <View style={styles.typographyContainer}>
          <Text style={[{ color: colors.text }, Typography.header]}>
            Header Typography
          </Text>
          <Text style={[{ color: colors.text }, Typography.title]}>
            Title Typography
          </Text>
          <Text style={[{ color: colors.text }, Typography.subtitle]}>
            Subtitle Typography
          </Text>
          <Text style={[{ color: colors.text }, Typography.body]}>
            Body Typography
          </Text>
          <Text style={[{ color: colors.text }, Typography.caption]}>
            Caption Typography
          </Text>
          <Text style={[{ color: colors.text }, Typography.small]}>
            Small Typography
          </Text>
        </View>

        <Text
          style={[
            styles.subheading,
            { color: colors.subtext },
            Typography.subtitle,
          ]}
        >
          Color Samples
        </Text>

        <View style={styles.colorContainer}>
          <ColorSample name="Primary" color={colors.primary} />
          <ColorSample name="Primary Variant" color={colors.primaryVariant} />
          <ColorSample name="Primary Light" color={colors.primaryLight} />
          <ColorSample name="Secondary" color={colors.secondary} />
          <ColorSample name="Background" color={colors.background} />
          <ColorSample name="Card" color={colors.card} />
          <ColorSample name="Card Elevated" color={colors.cardElevated} />
          <ColorSample name="Text" color={colors.text} />
          <ColorSample name="Subtext" color={colors.subtext} />
          <ColorSample name="Border" color={colors.border} />
          <ColorSample name="Success" color={colors.success} />
          <ColorSample name="Danger" color={colors.danger} />
        </View>

        <Text
          style={[
            styles.subheading,
            { color: colors.subtext },
            Typography.subtitle,
          ]}
        >
          Shadows & Borders
        </Text>

        <View style={styles.shadowsContainer}>
          <View
            style={[
              styles.shadowSample,
              { backgroundColor: colors.cardElevated },
              Shadows.small,
            ]}
          >
            <Text style={{ color: colors.text }}>Small Shadow</Text>
          </View>

          <View
            style={[
              styles.shadowSample,
              { backgroundColor: colors.cardElevated },
              Shadows.medium,
            ]}
          >
            <Text style={{ color: colors.text }}>Medium Shadow</Text>
          </View>

          <View
            style={[
              styles.shadowSample,
              { backgroundColor: colors.cardElevated },
              Shadows.large,
            ]}
          >
            <Text style={{ color: colors.text }}>Large Shadow</Text>
          </View>
        </View>

        <View style={styles.borderContainer}>
          <View
            style={[
              styles.borderSample,
              { borderColor: colors.border, borderRadius: BorderRadius.small },
            ]}
          >
            <Text style={{ color: colors.text }}>Small Border Radius</Text>
          </View>

          <View
            style={[
              styles.borderSample,
              { borderColor: colors.border, borderRadius: BorderRadius.medium },
            ]}
          >
            <Text style={{ color: colors.text }}>Medium Border Radius</Text>
          </View>

          <View
            style={[
              styles.borderSample,
              { borderColor: colors.border, borderRadius: BorderRadius.large },
            ]}
          >
            <Text style={{ color: colors.text }}>Large Border Radius</Text>
          </View>
        </View>

        <Text
          style={[
            styles.subheading,
            { color: colors.subtext },
            Typography.subtitle,
          ]}
        >
          Button Styles
        </Text>

        <View style={styles.buttonContainer}>
          <View
            style={[
              ButtonStyles.primary(colors.primary),
              { marginVertical: 8 },
            ]}
          >
            <Text style={[{ color: "white" }, Typography.subtitle]}>
              Primary Button
            </Text>
          </View>

          <View
            style={[
              ButtonStyles.outline(colors.primary),
              { marginVertical: 8 },
            ]}
          >
            <Text style={[{ color: colors.primary }, Typography.subtitle]}>
              Outline Button
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// A simple component to display color samples
const ColorSample: React.FC<{ name: string; color: string }> = ({
  name,
  color,
}) => {
  const { colors } = useAppTheme(); // Move hook call to top-level of component
  return (
    <View style={styles.colorSample}>
      <View style={[styles.colorBox, { backgroundColor: color }]} />
      <Text style={[styles.colorName, { color: colors.text }]}>
        {name}: {color}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: BorderRadius.medium,
    padding: 16,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  subheading: {
    marginTop: 24,
    marginBottom: 12,
  },
  typographyContainer: {
    marginVertical: 12,
  },
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorSample: {
    width: "48%",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  colorName: {
    flex: 1,
    fontSize: 12,
  },
  shadowsContainer: {
    marginVertical: 12,
  },
  shadowSample: {
    padding: 16,
    borderRadius: BorderRadius.medium,
    marginBottom: 16,
    alignItems: "center",
  },
  borderContainer: {
    marginVertical: 12,
  },
  borderSample: {
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonContainer: {
    marginVertical: 12,
  },
});

export default StyleTest;
