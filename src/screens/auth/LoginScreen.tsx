"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../contexts/AuthContext"
import TextInput from "../../components/TextInput"
import LoadingSpinner from "../../components/LoadingSpinner"

const LoginScreen = () => {
  const navigation = useNavigation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.success) {
        navigation.navigate("Main")
      } else {
        Alert.alert("Login Failed", result.error)
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    navigation.navigate("Register")
  }

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    // navigation.navigate('ForgotPassword');
    Alert.alert("Coming Soon", "Password reset functionality will be available soon.")
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
            <Text style={styles.appName}>Khana Khazana</Text>
            <Text style={styles.tagline}>Mumbai Street Food Safety Mission</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email-outline"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              leftIcon="lock-outline"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => Alert.alert("Coming Soon", "Google Sign In will be available soon.")}
            >
              <Icon name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 16,
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#FF6B00",
  },
  loginButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 14,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  registerText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "bold",
  },
})

export default LoginScreen
