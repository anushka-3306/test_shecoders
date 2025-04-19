import firestore from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import { getDistance } from "geolib"

// Get vendor by ID
export const getVendorById = async (vendorId) => {
  try {
    const vendorDoc = await firestore().collection("vendors").doc(vendorId).get()

    if (!vendorDoc.exists) {
      throw new Error("Vendor not found")
    }

    return { id: vendorDoc.id, ...vendorDoc.data() }
  } catch (error) {
    console.error("Error getting vendor:", error)
    throw error
  }
}

// Search vendors with various filters
export const searchVendors = async ({
  latitude,
  longitude,
  radius = 5, // Default 5km radius
  query = "",
  minHygieneRating = 0,
  cuisine = null,
  priceRange = [0, 1000],
  sortBy = "distance", // 'distance', 'rating', or 'hygieneRating'
}) => {
  try {
    let vendorsQuery = firestore().collection("vendors")

    // Apply text search if provided
    if (query) {
      // Firebase doesn't support full-text search natively
      // This is a simple implementation that checks if the name contains the query
      vendorsQuery = vendorsQuery.where(
        "searchKeywords",
        "array-contains-any",
        query
          .toLowerCase()
          .split(" ")
          .filter((word) => word.length > 2),
      )
    }

    // Apply hygiene rating filter
    if (minHygieneRating > 0) {
      vendorsQuery = vendorsQuery.where("hygieneRating", ">=", minHygieneRating)
    }

    // Apply cuisine filter
    if (cuisine && cuisine.length > 0) {
      vendorsQuery = vendorsQuery.where("cuisine", "in", cuisine)
    }

    // Get vendors
    const vendorsSnapshot = await vendorsQuery.get()

    // Process results with additional filtering and sorting
    const vendors = []

    vendorsSnapshot.forEach((doc) => {
      const vendor = { id: doc.id, ...doc.data() }

      // Calculate distance from user
      if (latitude && longitude) {
        const distance =
          getDistance(
            { latitude, longitude },
            { latitude: vendor.location.latitude, longitude: vendor.location.longitude },
          ) / 1000 // Convert to km

        vendor.distance = distance

        // Filter by radius
        if (distance <= radius) {
          // Filter by price range
          const avgPrice = vendor.priceRange.avg
          if (avgPrice >= priceRange[0] && avgPrice <= priceRange[1]) {
            vendors.push(vendor)
          }
        }
      } else {
        vendors.push(vendor)
      }
    })

    // Sort results
    switch (sortBy) {
      case "distance":
        vendors.sort((a, b) => a.distance - b.distance)
        break
      case "rating":
        vendors.sort((a, b) => b.rating - a.rating)
        break
      case "hygieneRating":
        vendors.sort((a, b) => b.hygieneRating - a.hygieneRating)
        break
      default:
        vendors.sort((a, b) => a.distance - b.distance)
    }

    return vendors
  } catch (error) {
    console.error("Error searching vendors:", error)
    throw error
  }
}

// Get top rated vendors
export const getTopRatedVendors = async (category = "All") => {
  try {
    let query = firestore().collection("vendors").orderBy("rating", "desc").limit(10)

    if (category !== "All") {
      query = firestore()
        .collection("vendors")
        .where("categories", "array-contains", category.toLowerCase())
        .orderBy("rating", "desc")
        .limit(10)
    }

    const snapshot = await query.get()

    const vendors = []
    snapshot.forEach((doc) => {
      vendors.push({ id: doc.id, ...doc.data() })
    })

    return vendors
  } catch (error) {
    console.error("Error getting top rated vendors:", error)
    throw error
  }
}

// Get recommended vendors based on user preferences
export const getRecommendedVendors = async (userId, category = "All") => {
  try {
    // Get user profile to check preferences
    const userDoc = await firestore().collection("users").doc(userId).get()

    if (!userDoc.exists) {
      throw new Error("User not found")
    }

    const userProfile = userDoc.data()

    // Get user's dietary preferences and favorite cuisines
    const { dietaryPreferences = [], favoriteCuisines = [] } = userProfile

    let query = firestore().collection("vendors")

    // Apply category filter if not 'All'
    if (category !== "All") {
      query = query.where("categories", "array-contains", category.toLowerCase())
    }

    // Get vendors
    const snapshot = await query.limit(20).get()

    let vendors = []
    snapshot.forEach((doc) => {
      vendors.push({ id: doc.id, ...doc.data() })
    })

    // Score vendors based on user preferences
    vendors = vendors.map((vendor) => {
      let score = 0

      // Higher score for matching dietary preferences
      if (dietaryPreferences.includes("vegetarian") && vendor.isVegetarian) {
        score += 3
      }

      // Higher score for favorite cuisines
      if (favoriteCuisines.includes(vendor.cuisine)) {
        score += 2
      }

      // Higher score for high hygiene rating
      score += vendor.hygieneRating

      // Higher score for high user rating
      score += vendor.rating

      return { ...vendor, recommendationScore: score }
    })

    // Sort by recommendation score
    vendors.sort((a, b) => b.recommendationScore - a.recommendationScore)

    // Return top 10 recommended vendors
    return vendors.slice(0, 10)
  } catch (error) {
    console.error("Error getting recommended vendors:", error)
    throw error
  }
}

// Add vendor to favorites
export const addVendorToFavorites = async (vendorId, userId) => {
  try {
    // Update user's favorite vendors
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        favoriteVendors: firestore.FieldValue.arrayUnion(vendorId),
      })

    // Update vendor's favorite count
    await firestore()
      .collection("vendors")
      .doc(vendorId)
      .update({
        favoriteCount: firestore.FieldValue.increment(1),
        favoriteUsers: firestore.FieldValue.arrayUnion(userId),
      })

    return true
  } catch (error) {
    console.error("Error adding vendor to favorites:", error)
    throw error
  }
}

// Remove vendor from favorites
export const removeVendorFromFavorites = async (vendorId, userId) => {
  try {
    // Update user's favorite vendors
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        favoriteVendors: firestore.FieldValue.arrayRemove(vendorId),
      })

    // Update vendor's favorite count
    await firestore()
      .collection("vendors")
      .doc(vendorId)
      .update({
        favoriteCount: firestore.FieldValue.increment(-1),
        favoriteUsers: firestore.FieldValue.arrayRemove(userId),
      })

    return true
  } catch (error) {
    console.error("Error removing vendor from favorites:", error)
    throw error
  }
}

// Add a new vendor
export const addVendor = async (vendorData, images) => {
  try {
    // Upload images to Firebase Storage
    const imageUrls = await Promise.all(
      images.map(async (image, index) => {
        const reference = storage().ref(`vendors/${Date.now()}_${index}.jpg`)
        await reference.putFile(image.uri)
        return await reference.getDownloadURL()
      }),
    )

    // Prepare vendor data with images
    const newVendorData = {
      ...vendorData,
      images: imageUrls,
      createdAt: firestore.FieldValue.serverTimestamp(),
      rating: 0,
      reviewCount: 0,
      favoriteCount: 0,
      favoriteUsers: [],
      // Create search keywords from name and cuisine
      searchKeywords: [
        ...vendorData.name.toLowerCase().split(" "),
        vendorData.cuisine.toLowerCase(),
        ...vendorData.address.area.toLowerCase().split(" "),
      ].filter((word) => word.length > 2),
    }

    // Add to Firestore
    const docRef = await firestore().collection("vendors").add(newVendorData)

    return { id: docRef.id, ...newVendorData }
  } catch (error) {
    console.error("Error adding vendor:", error)
    throw error
  }
}

// Update an existing vendor
export const updateVendor = async (vendorId, vendorData, newImages = []) => {
  try {
    let updatedImageUrls = [...(vendorData.images || [])]

    // Upload any new images
    if (newImages.length > 0) {
      const newImageUrls = await Promise.all(
        newImages.map(async (image, index) => {
          const reference = storage().ref(`vendors/${vendorId}_${Date.now()}_${index}.jpg`)
          await reference.putFile(image.uri)
          return await reference.getDownloadURL()
        }),
      )

      updatedImageUrls = [...updatedImageUrls, ...newImageUrls]
    }

    // Prepare updated vendor data
    const updatedVendorData = {
      ...vendorData,
      images: updatedImageUrls,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      // Update search keywords
      searchKeywords: [
        ...vendorData.name.toLowerCase().split(" "),
        vendorData.cuisine.toLowerCase(),
        ...vendorData.address.area.toLowerCase().split(" "),
      ].filter((word) => word.length > 2),
    }

    // Update in Firestore
    await firestore().collection("vendors").doc(vendorId).update(updatedVendorData)

    return { id: vendorId, ...updatedVendorData }
  } catch (error) {
    console.error("Error updating vendor:", error)
    throw error
  }
}
