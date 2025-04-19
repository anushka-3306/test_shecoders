import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "react-native"
import { AuthProvider } from "./src/contexts/AuthContext"
import { ThemeProvider } from "./src/contexts/ThemeContext"
import { LocationProvider } from "./src/contexts/LocationContext"

// Screens
import SplashScreen from "./src/screens/SplashScreen"
import LoginScreen from "./src/screens/auth/LoginScreen"
import RegisterScreen from "./src/screens/auth/RegisterScreen"
import MainTabNavigator from "./src/navigation/MainTabNavigator"

const Stack = createStackNavigator()

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <StatusBar barStyle="dark-content" />
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export default App
