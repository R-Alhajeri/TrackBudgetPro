import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAppTheme from "../hooks/useAppTheme";
import { getFirebaseSetupGuide, initializeFirebase } from "../lib/firebase";

export default function FirebaseSetupScreen() {
  const { colors } = useAppTheme();
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = async () => {
    // Validate inputs
    if (
      !apiKey ||
      !authDomain ||
      !projectId ||
      !storageBucket ||
      !messagingSenderId ||
      !appId
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all Firebase configuration fields."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Create Firebase config object
      const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      };

      // Save config to AsyncStorage
      await AsyncStorage.setItem(
        "firebase-config",
        JSON.stringify(firebaseConfig)
      );

      // Initialize Firebase with the provided config
      await initializeFirebase(firebaseConfig);

      Alert.alert(
        "Success",
        "Firebase configuration saved and initialized successfully!",
        [{ text: "OK", onPress: () => router.replace("../") }]
      );
    } catch (error) {
      console.error("Error saving Firebase config:", error);
      Alert.alert(
        "Error",
        "Failed to save or initialize Firebase configuration. Please check your details and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Firebase Setup",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Firebase Configuration
        </Text>
        <Text style={[styles.description, { color: colors.subtext }]}>
          Enter your Firebase project details below. You can find these in your
          Firebase console under Project Settings.
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>API Key</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
              placeholderTextColor={colors.subtext}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Auth Domain
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="your-project-id.firebaseapp.com"
              placeholderTextColor={colors.subtext}
              value={authDomain}
              onChangeText={setAuthDomain}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Project ID
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="your-project-id"
              placeholderTextColor={colors.subtext}
              value={projectId}
              onChangeText={setProjectId}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Storage Bucket
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="your-project-id.appspot.com"
              placeholderTextColor={colors.subtext}
              value={storageBucket}
              onChangeText={setStorageBucket}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Messaging Sender ID
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="123456789012"
              placeholderTextColor={colors.subtext}
              value={messagingSenderId}
              onChangeText={setMessagingSenderId}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>App ID</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholder="1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
              placeholderTextColor={colors.subtext}
              value={appId}
              onChangeText={setAppId}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleSaveConfig}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Saving..." : "Save and Initialize Firebase"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.helpText, { color: colors.subtext }]}>
            Need help? Check the Firebase setup guide in the settings menu.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  helpText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
