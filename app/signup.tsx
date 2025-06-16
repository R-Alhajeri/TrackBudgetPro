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
  ScrollView,
} from "react-native";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import useAuthStore from "../store/auth-store";
import useAppTheme from "../hooks/useAppTheme";
import useLanguageStore from "../store/language-store";
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const { signup, isAuthenticated } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("./(tabs)");
    }
  }, [isAuthenticated, router]);

  const validateInputs = () => {
    let isValid = true;

    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate name
    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    }

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
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else if (!/\d/.test(password)) {
      setPasswordError("Password must contain at least one number");
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError("Password must contain at least one special character");
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("Password must contain at least one uppercase letter");
      isValid = false;
    } else if (!/[a-z]/.test(password)) {
      setPasswordError("Password must contain at least one lowercase letter");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await signup(name, email, password);

      if (success) {
        router.replace("./(tabs)");
      } else {
        Alert.alert(
          "Signup Failed",
          "This email may already be in use or there was an error creating your account.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Signup Error",
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleBackToHome = () => {
    router.replace("./(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Back button that navigates to home */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToHome}
            testID="back-button"
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <User size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Sign up to start tracking your budget
          </Text>

          <View
            style={[
              styles.inputContainer,
              { borderColor: nameError ? colors.danger : colors.border },
            ]}
          >
            <User
              size={20}
              color={nameError ? colors.danger : colors.subtext}
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
              placeholder="Full Name"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError("");
              }}
              autoCapitalize="words"
              testID="name-input"
            />
          </View>
          {nameError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {nameError}
            </Text>
          ) : null}

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
            <Pressable
              onPress={togglePasswordVisibility}
              style={styles.eyeIcon}
            >
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

          <View
            style={[
              styles.inputContainer,
              {
                borderColor: confirmPasswordError
                  ? colors.danger
                  : colors.border,
              },
            ]}
          >
            <Lock
              size={20}
              color={confirmPasswordError ? colors.danger : colors.subtext}
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
              placeholder="Confirm Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              autoCapitalize="none"
              testID="confirm-password-input"
            />
            <Pressable
              onPress={toggleConfirmPasswordVisibility}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.subtext} />
              ) : (
                <Eye size={20} color={colors.subtext} />
              )}
            </Pressable>
          </View>
          {confirmPasswordError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {confirmPasswordError}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.signupButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleSignup}
            disabled={isLoading}
            testID="signup-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.subtext }]}>
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={() => router.push("./login")}
              testID="login-link"
            >
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.note, { color: colors.subtext }]}>
            {
              "By signing up, you agree to our Terms of Service and Privacy Policy"
            }
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  signupButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  signupButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
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
