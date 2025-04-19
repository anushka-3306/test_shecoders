"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Share,
  Linking,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation, useRoute } from "@react-navigation/native"
import { getVendorById, addVendorToFavorites, removeVendorFromFavorites } from "../services/vendorService"
import { getReviewsByVendorId } from "../services/reviewService"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import ReviewCard from "../components/ReviewCard"
import HygieneRatingBadge from "../components/HygieneRatingBadge"
import MenuItemCard from "../components/MenuItemCard"
import MapView, { Marker } from "react-native-maps"

const VendorDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { vendorId } = route.params
  const { user } = useAuth()

  const [vendor, setVendor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadVendorData()
  }, [vendorId])

  const loadVendorData = async () => {
    setIsLoading(true)
    try {
      const vendorData = await getVendorById(vendorId)
      setVendor(vendorData)

      // Check if this vendor is in user's favorites
      if (user && vendorData.favoriteUsers && vendorData.favoriteUsers.includes(user.uid)) {
        setIsFavorite(true)
      }

      // Load reviews
      const reviewsData = await getReviewsByVendorId(vendorId)
      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading vendor data:", error)
      Alert.alert("Error", "Failed to load vendor information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save vendors to your favorites", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ])
      return
    }

    try {
      if (isFavorite) {
        await removeVendorFromFavorites(vendorId, user.uid)
      } else {
        await addVendorToFavorites(vendorId, user.uid)
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Error", "Failed to update favorites")
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${vendor.name} on Khana Khazana! They serve amazing ${vendor.cuisine} food with a hygiene rating of ${vendor.hygieneRating}/5.`,
        url: `https://khanakhazana.app/vendor/${vendorId}`,
      })
    } catch (error) {
      console.error("Error sharing vendor:", error)
    }
  }

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.location.latitude},${vendor.location.longitude}`
    Linking.openURL(url)
  }

  const handleWriteReview = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to write a review", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ])
      return
    }

    navigation.navigate("Review", { vendorId: vendorId })
  }

  if (isLoading || !vendor) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: vendor.images[0] }} style={styles.headerImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleFavoriteToggle}>
              <Icon name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF6B00" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share-variant" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vendor Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <HygieneRatingBadge rating={vendor.hygieneRating} />
          </View>

          <Text style={styles.cuisine}>{vendor.cuisine}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FF6B00" />
              <Text style={styles.statText}>
                {vendor.rating.toFixed(1)} ({vendor.reviewCount})
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="map-marker" size={16} color="#FF6B00" />
              <Text style={styles.statText}>{vendor.address.area}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={16} color="#FF6B00" />
              <Text style={styles.statText}>
                {vendor.isOpen ? "Open Now" : "Closed"} • {vendor.operatingHours}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleDirections}>
              <Icon name="directions" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleWriteReview}>
              <Icon name="pencil" size={20} color="#FF6B00" />
              <Text style={styles.secondaryButtonText}>Write Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "overview" && styles.activeTab]}
            onPress={() => setActiveTab("overview")}
          >
            <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "menu" && styles.activeTab]}
            onPress={() => setActiveTab("menu")}
          >
            <Text style={[styles.tabText, activeTab === "menu" && styles.activeTabText]}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text style={[styles.tabText, activeTab === "reviews" && styles.activeTabText]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Hygiene Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hygiene Information</Text>
              <View style={styles.hygieneContainer}>
                <View style={styles.hygieneItem}>
                  <Icon name="hand-water" size={24} color="#FF6B00" />
                  <Text style={styles.hygieneLabel}>Cleanliness</Text>
                  <Text style={styles.hygieneValue}>{vendor.hygiene.cleanliness}/5</Text>
                </View>
                <View style={styles.hygieneItem}>
                  <Icon name="food-apple" size={24} color="#FF6B00" />
                  <Text style={styles.hygieneLabel}>Ingredients</Text>
                  <Text style={styles.hygieneValue}>{vendor.hygiene.ingredients}/5</Text>
                </View>
                <View style={styles.hygieneItem}>
                  <Icon name="water" size={24} color="#FF6B00" />
                  <Text style={styles.hygieneLabel}>Water Safety</Text>
                  <Text style={styles.hygieneValue}>{vendor.hygiene.waterSafety}/5</Text>
                </View>
              </View>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>{vendor.description}</Text>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.addressText}>{vendor.address.full}</Text>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: vendor.location.latitude,
                    longitude: vendor.location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: vendor.location.latitude,
                      longitude: vendor.location.longitude,
                    }}
                    title={vendor.name}
                  />
                </MapView>
              </View>
            </View>

            {/* Photos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <FlatList
                horizontal
                data={vendor.images}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => <Image source={{ uri: item }} style={styles.galleryImage} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContainer}
              />
            </View>
          </View>
        )}

        {activeTab === "menu" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            {vendor.menu.map((item, index) => (
              <MenuItemCard key={index} item={item} />
            ))}
          </View>
        )}

        {activeTab === "reviews" && (
          <View style={styles.tabContent}>
            <View style={styles.reviewHeaderContainer}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            </View>

            {reviews.length > 0 ? (
              reviews.map((review, index) => <ReviewCard key={index} review={review} />)
            ) : (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  imageContainer: {
    position: "relative",
    height: 250,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  headerActions: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
  },
  actionButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 16,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  cuisine: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#FF6B00",
  },
  secondaryButtonText: {
    color: "#FF6B00",
    fontWeight: "bold",
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  tabContent: {
    padding: 16,
    backgroundColor: "#FFF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  hygieneContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
  },
  hygieneItem: {
    alignItems: "center",
  },
  hygieneLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    marginBottom: 4,
  },
  hygieneValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  addressText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  galleryContainer: {
    paddingRight: 16,
  },
  galleryImage: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  reviewHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  writeReviewButton: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#FF6B00",
  },
  writeReviewText: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "bold",
  },
  noReviewsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 24,
  },
})

export default VendorDetailScreen
