import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import useAuthStore from "../store/auth-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { login, isAuthenticated, userRole } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // If already authenticated, redirect to appropriate screen
  useEffect(() => {
    if (isAuthenticated) {
      // Always redirect to tabs, then navigate to admin if needed
      router.replace("/(tabs)");

      // We'll handle admin navigation from the settings screen instead
    }
  }, [isAuthenticated, userRole, router]);

  const validateInputs = () => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      }
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    // Check for too many login attempts
    if (loginAttempts >= 5) {
      Alert.alert(
        "Too Many Attempts",
        "You have made too many login attempts. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        const role = useAuthStore.getState().userRole;
        if (role === "admin") {
          router.replace("/(admin)" as any);
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setLoginAttempts((prev) => prev + 1);
        Alert.alert(
          "Login Failed",
          "Invalid email or password. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Login Error",
        "An unexpected error occurred. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBackToHome = () => {
    router.replace("./(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Removed in-content back button to avoid double arrow in header */}

        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <Lock size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Log in to your account to continue
        </Text>

        <View
          style={[
            styles.inputContainer,
            { borderColor: emailError ? colors.danger : colors.border },
          ]}
        >
          <Mail
            size={20}
            color={emailError ? colors.danger : colors.subtext}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.subtext}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="email-input"
          />
        </View>
        {emailError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {emailError}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            { borderColor: passwordError ? colors.danger : colors.border },
          ]}
        >
          <Lock
            size={20}
            color={passwordError ? colors.danger : colors.subtext}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.subtext}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            autoCapitalize="none"
            testID="password-input"
          />
          <Pressable onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            {showPassword ? (
              <EyeOff size={20} color={colors.subtext} />
            ) : (
              <Eye size={20} color={colors.subtext} />
            )}
          </Pressable>
        </View>
        {passwordError ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {passwordError}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.loginButton,
            { backgroundColor: colors.primary },
            isLoading && { opacity: 0.7 },
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          testID="login-button"
          accessibilityLabel="Login"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.loginButton,
            { backgroundColor: colors.danger, marginTop: 8 },
          ]}
          onPress={async () => {
            // Clear all persisted auth state and reload app
            await useAuthStore.persist.clearStorage();
            if (typeof window !== "undefined") {
              window.location.reload();
            } else if (Updates.reloadAsync) {
              await Updates.reloadAsync();
            }
          }}
          accessibilityLabel="Reset Demo Data"
        >
          <Text style={styles.loginButtonText}>Reset Demo Data</Text>
        </Pressable>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: colors.subtext }]}>
            {"Don't have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("./signup")}
            testID="signup-link"
          >
            <Text style={[styles.signupLink, { color: colors.primary }]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.note, { color: colors.subtext }]}>
          {
            "Note: This is a mock login for demonstration. For testing, use:\n\nAdmin: admin@example.com / admin123\nUser: user@example.com / user123"
          }
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 10,
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginLeft: 14,
  },
  eyeIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
    marginLeft: 4,
  },
  loginButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    marginRight: 4,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  note: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
