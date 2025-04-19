"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"
import { getFoodTrails } from "../services/trailService"
import LoadingSpinner from "../components/LoadingSpinner"
import TrailCard from "../components/TrailCard"

const { width } = Dimensions.get("window")

const FoodTrailsScreen = () => {
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [featuredTrail, setFeaturedTrail] = useState(null)
  const [popularTrails, setPopularTrails] = useState([])
  const [beginnerTrails, setBeginnerTrails] = useState([])
  const [culturalTrails, setCulturalTrails] = useState([])

  useEffect(() => {
    loadTrails()
  }, [])

  const loadTrails = async () => {
    setIsLoading(true)
    try {
      const trailsData = await getFoodTrails()

      // Set featured trail
      setFeaturedTrail(trailsData.find((trail) => trail.featured))

      // Filter trails by category
      setPopularTrails(trailsData.filter((trail) => trail.category === "popular"))
      setBeginnerTrails(trailsData.filter((trail) => trail.category === "beginner"))
      setCulturalTrails(trailsData.filter((trail) => trail.category === "cultural"))
    } catch (error) {
      console.error("Error loading food trails:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrailPress = (trail) => {
    navigation.navigate("TrailDetail", { trailId: trail.id })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Trails</Text>
        <Text style={styles.subtitle}>Curated journeys through Mumbai's street food</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured Trail */}
        {featuredTrail && (
          <TouchableOpacity style={styles.featuredContainer} onPress={() => handleTrailPress(featuredTrail)}>
            <Image source={{ uri: featuredTrail.coverImage }} style={styles.featuredImage} />
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredContent}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
                <Text style={styles.featuredTitle}>{featuredTrail.name}</Text>
                <Text style={styles.featuredDescription}>{featuredTrail.shortDescription}</Text>
                <View style={styles.featuredStats}>
                  <View style={styles.featuredStat}>
                    <Icon name="map-marker-path" size={16} color="#FFF" />
                    <Text style={styles.featuredStatText}>{featuredTrail.stops.length} Stops</Text>
                  </View>
                  <View style={styles.featuredStat}>
                    <Icon name="clock-outline" size={16} color="#FFF" />
                    <Text style={styles.featuredStatText}>{featuredTrail.duration}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Popular Trails */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Trails</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={popularTrails}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TrailCard trail={item} onPress={() => handleTrailPress(item)} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trailList}
          />
        </View>

        {/* Beginner-Friendly Trails */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Beginner-Friendly</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={beginnerTrails}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TrailCard trail={item} onPress={() => handleTrailPress(item)} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trailList}
          />
        </View>

        {/* Cultural Experiences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cultural Experiences</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={culturalTrails}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TrailCard trail={item} onPress={() => handleTrailPress(item)} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trailList}
          />
        </View>

        {/* Food Trail Guide */}
        <View style={styles.guideContainer}>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>New to Mumbai Street Food?</Text>
            <Text style={styles.guideText}>
              Our beginner's guide helps you navigate Mumbai's vibrant street food scene safely and confidently.
            </Text>
            <TouchableOpacity style={styles.guideButton}>
              <Text style={styles.guideButtonText}>Read the Guide</Text>
            </TouchableOpacity>
          </View>
          <Image source={require("../assets/food-guide.jpg")} style={styles.guideImage} />
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  featuredContainer: {
    height: 250,
    width: "100%",
    marginBottom: 24,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  featuredContent: {
    padding: 16,
  },
  featuredBadge: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: "#FFF",
    marginBottom: 12,
  },
  featuredStats: {
    flexDirection: "row",
  },
  featuredStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  featuredStatText: {
    color: "#FFF",
    marginLeft: 4,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B00",
  },
  trailList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  guideContainer: {
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
  guideContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  guideText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  guideButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  guideButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  guideImage: {
    width: 120,
    height: "100%",
    resizeMode: "cover",
  },
})

export default FoodTrailsScreen
