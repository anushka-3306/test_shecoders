import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

// Screens
import HomeScreen from "../screens/HomeScreen"
import MapScreen from "../screens/MapScreen"
import SearchScreen from "../screens/SearchScreen"
import FoodTrailsScreen from "../screens/FoodTrailsScreen"
import ProfileScreen from "../screens/ProfileScreen"
import VendorDetailScreen from "../screens/VendorDetailScreen"
import ReviewScreen from "../screens/ReviewScreen"
import AddVendorScreen from "../screens/AddVendorScreen"

const Tab = createBottomTabNavigator()
const HomeStack = createStackNavigator()
const MapStack = createStackNavigator()
const TrailsStack = createStackNavigator()
const ProfileStack = createStackNavigator()

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="VendorDetail" component={VendorDetailScreen} />
      <HomeStack.Screen name="Review" component={ReviewScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
    </HomeStack.Navigator>
  )
}

const MapStackNavigator = () => {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapMain" component={MapScreen} />
      <MapStack.Screen name="VendorDetail" component={VendorDetailScreen} />
      <MapStack.Screen name="AddVendor" component={AddVendorScreen} />
    </MapStack.Navigator>
  )
}

const TrailsStackNavigator = () => {
  return (
    <TrailsStack.Navigator screenOptions={{ headerShown: false }}>
      <TrailsStack.Screen name="TrailsMain" component={FoodTrailsScreen} />
      <TrailsStack.Screen name="VendorDetail" component={VendorDetailScreen} />
    </TrailsStack.Navigator>
  )
}

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Review" component={ReviewScreen} />
    </ProfileStack.Navigator>
  )
}

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === "Trails") {
            iconName = focused ? "map-marker-path" : "map-marker-path"
          } else if (route.name === "Profile") {
            iconName = focused ? "account" : "account-outline"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Map" component={MapStackNavigator} />
      <Tab.Screen name="Trails" component={TrailsStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  )
}

export default MainTabNavigator
