import firestore from "@react-native-firebase/firestore"

// Get all food trails
export const getFoodTrails = async () => {
  try {
    const trailsSnapshot = await firestore().collection("foodTrails").orderBy("createdAt", "desc").get()

    const trails = []
    trailsSnapshot.forEach((doc) => {
      trails.push({ id: doc.id, ...doc.data() })
    })

    return trails
  } catch (error) {
    console.error("Error getting food trails:", error)
    throw error
  }
}

// Get a specific food trail by ID
export const getFoodTrailById = async (trailId) => {
  try {
    const trailDoc = await firestore().collection("foodTrails").doc(trailId).get()

    if (!trailDoc.exists) {
      throw new Error("Food trail not found")
    }

    const trailData = { id: trailDoc.id, ...trailDoc.data() }

    // Get detailed vendor information for each stop
    const vendorDetails = await Promise.all(
      trailData.stops.map(async (stop) => {
        const vendorDoc = await firestore().collection("vendors").doc(stop.vendorId).get()

        if (vendorDoc.exists) {
          return {
            ...stop,
            vendor: { id: vendorDoc.id, ...vendorDoc.data() },
          }
        }

        return stop
      }),
    )

    trailData.stops = vendorDetails

    return trailData
  } catch (error) {
    console.error("Error getting food trail:", error)
    throw error
  }
}

// Get food trails by category
export const getFoodTrailsByCategory = async (category) => {
  try {
    const trailsSnapshot = await firestore()
      .collection("foodTrails")
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .get()

    const trails = []
    trailsSnapshot.forEach((doc) => {
      trails.push({ id: doc.id, ...doc.data() })
    })

    return trails
  } catch (error) {
    console.error("Error getting food trails by category:", error)
    throw error
  }
}

// Mark a food trail as completed by a user
export const markTrailAsCompleted = async (trailId, userId) => {
  try {
    // Update user's completed trails
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        completedTrails: firestore.FieldValue.arrayUnion(trailId),
      })

    // Update trail's completion count
    await firestore()
      .collection("foodTrails")
      .doc(trailId)
      .update({
        completionCount: firestore.FieldValue.increment(1),
      })

    return { success: true }
  } catch (error) {
    console.error("Error marking trail as completed:", error)
    throw error
  }
}

// Save a food trail to user's favorites
export const saveTrailToFavorites = async (trailId, userId) => {
  try {
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        favoriteTrails: firestore.FieldValue.arrayUnion(trailId),
      })

    return { success: true }
  } catch (error) {
    console.error("Error saving trail to favorites:", error)
    throw error
  }
}

// Remove a food trail from user's favorites
export const removeTrailFromFavorites = async (trailId, userId) => {
  try {
    await firestore()
      .collection("users")
      .doc(userId)
      .update({
        favoriteTrails: firestore.FieldValue.arrayRemove(trailId),
      })

    return { success: true }
  } catch (error) {
    console.error("Error removing trail from favorites:", error)
    throw error
  }
}
