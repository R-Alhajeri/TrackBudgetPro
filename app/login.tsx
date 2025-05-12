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
import { AntDesign } from "@expo/vector-icons";
import useAuthStore from "@/store/auth-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { useRouter } from "expo-router";
import { loginWithBackend, guestLoginWithBackend } from "@/lib/auth-api";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { isAuthenticated, userRole } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [guestLoading, setGuestLoading] = useState(false);

  // If already authenticated, redirect to appropriate screen
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "admin") {
        router.replace("/(tabs)/admin");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, userRole, router]);

  const validateInputs = () => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setPasswordError("");

    // Validate email
    if (!email.trim()) {
      setEmailError(t("emailRequired"));
      isValid = false;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError(t("emailInvalid"));
        isValid = false;
      }
    }

    // Validate password
    if (!password) {
      setPasswordError(t("passwordRequired"));
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
      Alert.alert(t("loginTooManyAttempts"), t("loginTooManyAttempts"), [
        { text: "OK" },
      ]);
      return;
    }

    setIsLoading(true);
    console.log("Attempting login with email:", email);

    try {
      console.log("Calling loginWithBackend...");
      const success = await loginWithBackend(email, password);
      console.log("Login result:", success ? "Success" : "Failed");

      if (success) {
        const { userRole, token } = useAuthStore.getState();
        console.log("Login successful. User role:", userRole);
        console.log("Token received:", token ? "Yes" : "No");

        if (userRole === "admin") {
          router.replace("/(tabs)/admin");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setLoginAttempts((prev) => prev + 1);
        Alert.alert(t("loginFailed"), t("loginError"), [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert(t("loginError"), t("errorOccurred"), [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const success = await guestLoginWithBackend();
      if (success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(t("loginFailed"), t("errorOccurred"), [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert(t("loginError"), t("errorOccurred"), [{ text: "OK" }]);
    } finally {
      setGuestLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBackToHome = () => {
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Back button that navigates to home */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToHome}
          testID="back-button"
        >
          <AntDesign name="arrowleft" size={24} color={colors.text} />
        </TouchableOpacity>

        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <AntDesign name="lock" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {t("loginWelcome")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t("loginSubtitle")}
        </Text>

        <View
          style={[
            styles.inputContainer,
            { borderColor: emailError ? colors.danger : colors.border },
          ]}
        >
          <AntDesign
            name="mail"
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
            placeholder={t("emailRequired")}
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
          <AntDesign
            name="lock"
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
            placeholder={t("passwordRequired")}
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
              <AntDesign name="eyeo" size={20} color={colors.subtext} />
            ) : (
              <AntDesign name="eye" size={20} color={colors.subtext} />
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
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginButtonText}>{t("loginButton")}</Text>
          )}
        </Pressable>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: colors.subtext }]}>
            {t("signupPrompt")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/signup")}
            testID="signup-link"
          >
            <Text style={[styles.signupLink, { color: colors.primary }]}>
              {t("signupLink")}
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          style={[
            styles.loginButton,
            {
              backgroundColor: colors.card,
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.primary,
            },
            guestLoading && { opacity: 0.7 },
          ]}
          onPress={handleGuestLogin}
          disabled={guestLoading}
          testID="guest-login-button"
        >
          {guestLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.loginButtonText, { color: colors.primary }]}>
              {t("continueAsGuest")}
            </Text>
          )}
        </Pressable>

        <Text style={[styles.note, { color: colors.subtext }]}>
          {t("loginNote")}
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
