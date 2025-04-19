"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"
import { searchVendors, getTopRatedVendors, getRecommendedVendors } from "../services/vendorService"
import { useAuth } from "../contexts/AuthContext"
import { useLocation } from "../contexts/LocationContext"
import SearchBar from "../components/SearchBar"
import VendorCard from "../components/VendorCard"
import CategoryFilter from "../components/CategoryFilter"
import LoadingSpinner from "../components/LoadingSpinner"

const HomeScreen = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { currentLocation } = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [topVendors, setTopVendors] = useState([])
  const [recommendedVendors, setRecommendedVendors] = useState([])
  const [nearbyVendors, setNearbyVendors] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = [
    { id: "all", name: "All" },
    { id: "chaat", name: "Chaat" },
    { id: "vada_pav", name: "Vada Pav" },
    { id: "pav_bhaji", name: "Pav Bhaji" },
    { id: "dosa", name: "Dosa" },
    { id: "juice", name: "Juice" },
    { id: "biryani", name: "Biryani" },
  ]

  useEffect(() => {
    loadData()
  }, [currentLocation, selectedCategory])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Fetch top rated vendors
      const topRated = await getTopRatedVendors(selectedCategory)
      setTopVendors(topRated)

      // Fetch personalized recommendations if user is logged in
      if (user) {
        const recommended = await getRecommendedVendors(user.uid, selectedCategory)
        setRecommendedVendors(recommended)
      }

      // Fetch nearby vendors based on current location
      if (currentLocation) {
        const nearby = await searchVendors({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 2, // 2km radius
          category: selectedCategory !== "All" ? selectedCategory : null,
        })
        setNearbyVendors(nearby)
      }
    } catch (error) {
      console.error("Error loading home data:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
  }

  const handleSearch = () => {
    navigation.navigate("Search")
  }

  if (isLoading && !refreshing) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Khana Khazana</Text>
          <Text style={styles.subtitle}>Mumbai Street Food</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="account-circle" size={40} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      <SearchBar onPress={handleSearch} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* Top Rated Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={topVendors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <VendorCard vendor={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorList}
          />
        </View>

        {/* Recommended Section - Only show if user is logged in */}
        {user && recommendedVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={recommendedVendors}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <VendorCard vendor={item} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorList}
            />
          </View>
        )}

        {/* Nearby Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby You</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={nearbyVendors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <VendorCard vendor={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vendorList}
          />
        </View>

        {/* Food Trails Promotion */}
        <TouchableOpacity style={styles.foodTrailsPromo} onPress={() => navigation.navigate("Trails")}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Explore Food Trails</Text>
            <Text style={styles.promoDescription}>Discover curated food journeys for newcomers to Mumbai</Text>
            <View style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Explore Now</Text>
            </View>
          </View>
          <Image source={require("../assets/food-trail-promo.jpg")} style={styles.promoImage} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  profileButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B00",
  },
  vendorList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  foodTrailsPromo: {
    margin: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  promoContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  promoButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  promoButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  promoImage: {
    width: 120,
    height: "100%",
    resizeMode: "cover",
  },
})

export default HomeScreen
