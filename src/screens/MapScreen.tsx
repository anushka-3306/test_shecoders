"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"
import { searchVendors } from "../services/vendorService"
import { useLocation } from "../contexts/LocationContext"
import SearchBar from "../components/SearchBar"
import FilterModal from "../components/FilterModal"
import VendorPreviewCard from "../components/VendorPreviewCard"
import LoadingSpinner from "../components/LoadingSpinner"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.8
const SPACING_FOR_CARD_INSET = width * 0.1 - 10

const MapScreen = () => {
  const navigation = useNavigation()
  const { currentLocation } = useLocation()
  const mapRef = useRef(null)
  const scrollViewRef = useRef(null)

  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState({
    hygieneRating: 0,
    cuisine: [],
    priceRange: [0, 500],
    sortBy: "distance",
  })

  // Animation value for bottom sheet
  const bottomSheetAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (currentLocation) {
      loadVendors()
    }
  }, [currentLocation, filters])

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const vendorsData = await searchVendors({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: 5, // 5km radius
        minHygieneRating: filters.hygieneRating,
        cuisine: filters.cuisine.length > 0 ? filters.cuisine : null,
        priceRange: filters.priceRange,
        sortBy: filters.sortBy,
      })
      setVendors(vendorsData)
    } catch (error) {
      console.error("Error loading vendors:", error)
      Alert.alert("Error", "Failed to load vendors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkerPress = (vendor, index) => {
    setSelectedVendor(vendor)

    // Animate to the selected marker
    mapRef.current.animateToRegion(
      {
        latitude: vendor.location.latitude,
        longitude: vendor.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    )

    // Scroll to the corresponding card
    scrollViewRef.current.scrollTo({
      x: index * CARD_WIDTH,
      y: 0,
      animated: true,
    })

    // Animate bottom sheet up
    Animated.timing(bottomSheetAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const handleCardPress = (vendor) => {
    navigation.navigate("VendorDetail", { vendorId: vendor.id })
  }

  const handleAddVendor = () => {
    navigation.navigate("AddVendor")
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterModalVisible(false)
  }

  const handleSearchPress = () => {
    navigation.navigate("Search")
  }

  // Calculate bottom sheet translation based on animation value
  const translateY = bottomSheetAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
    extrapolate: "clamp",
  })

  if (isLoading && !currentLocation) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <SearchBar onPress={handleSearchPress} />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
          <Icon name="filter-variant" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {currentLocation && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {vendors.map((vendor, index) => (
              <Marker
                key={vendor.id}
                coordinate={{
                  latitude: vendor.location.latitude,
                  longitude: vendor.location.longitude,
                }}
                onPress={() => handleMarkerPress(vendor, index)}
              >
                <View
                  style={[
                    styles.markerContainer,
                    selectedVendor && selectedVendor.id === vendor.id && styles.selectedMarker,
                  ]}
                >
                  <View style={styles.markerInner}>
                    <Text style={styles.markerText}>{vendor.hygieneRating}</Text>
                  </View>
                </View>
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{vendor.name}</Text>
                    <Text style={styles.calloutSubtitle}>{vendor.cuisine}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        )}

        {/* Add Vendor Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddVendor}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Bottom Sheet with Vendor Cards */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={1}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20}
            snapToAlignment="center"
            contentContainerStyle={styles.scrollViewContent}
            onMomentumScrollEnd={(e) => {
              const index = Math.floor(e.nativeEvent.contentOffset.x / CARD_WIDTH)
              if (vendors[index]) {
                setSelectedVendor(vendors[index])
                mapRef.current.animateToRegion(
                  {
                    latitude: vendors[index].location.latitude,
                    longitude: vendors[index].location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  500,
                )
              }
            }}
          >
            {vendors.map((vendor, index) => (
              <TouchableOpacity key={vendor.id} style={styles.card} onPress={() => handleCardPress(vendor)}>
                <VendorPreviewCard vendor={vendor} />
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </Animated.View>
      </View>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  searchBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  filterButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    backgroundColor: "#FF6B00",
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  selectedMarker: {
    backgroundColor: "#FF3B00",
    borderColor: "#FFF",
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  markerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  calloutContainer: {
    width: 160,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  addButton: {
    position: "absolute",
    bottom: 200,
    right: 16,
    backgroundColor: "#FF6B00",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "transparent",
  },
  scrollViewContent: {
    paddingHorizontal: SPACING_FOR_CARD_INSET,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 10,
  },
})

export default MapScreen
