import firestore from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"

// Get reviews for a vendor
export const getReviewsByVendorId = async (vendorId) => {
  try {
    const reviewsSnapshot = await firestore()
      .collection("reviews")
      .where("vendorId", "==", vendorId)
      .orderBy("createdAt", "desc")
      .get()

    const reviews = []

    for (const doc of reviewsSnapshot.docs) {
      const reviewData = { id: doc.id, ...doc.data() }

      // Get user data for each review
      const userDoc = await firestore().collection("users").doc(reviewData.userId).get()

      if (userDoc.exists) {
        reviewData.user = {
          uid: userDoc.id,
          displayName: userDoc.data().displayName,
          photoURL: userDoc.data().photoURL,
        }
      } else {
        reviewData.user = {
          displayName: "Anonymous User",
          photoURL: null,
        }
      }

      reviews.push(reviewData)
    }

    return reviews
  } catch (error) {
    console.error("Error getting reviews:", error)
    throw error
  }
}

// Add a new review
export const addReview = async (reviewData, images = []) => {
  try {
    // Start a batch write
    const batch = firestore().batch()

    // Upload images if any
    let imageUrls = []
    if (images.length > 0) {
      imageUrls = await Promise.all(
        images.map(async (image, index) => {
          const reference = storage().ref(`reviews/${reviewData.vendorId}_${Date.now()}_${index}.jpg`)
          await reference.putFile(image.uri)
          return await reference.getDownloadURL()
        }),
      )
    }

    // Prepare review data
    const newReviewData = {
      ...reviewData,
      images: imageUrls,
      createdAt: firestore.FieldValue.serverTimestamp(),
      helpfulCount: 0,
      helpfulUsers: [],
    }

    // Create review document reference
    const reviewRef = firestore().collection("reviews").doc()
    batch.set(reviewRef, newReviewData)

    // Update vendor document with new rating and review count
    const vendorRef = firestore().collection("vendors").doc(reviewData.vendorId)
    const vendorDoc = await vendorRef.get()

    if (vendorDoc.exists) {
      const vendorData = vendorDoc.data()
      const currentReviewCount = vendorData.reviewCount || 0
      const currentRating = vendorData.rating || 0

      // Calculate new average rating
      const newRating = (currentRating * currentReviewCount + reviewData.rating) / (currentReviewCount + 1)

      // Calculate new hygiene rating if provided
      let newHygieneRating = vendorData.hygieneRating || 0
      if (reviewData.hygieneRating) {
        const currentHygieneReviewCount = vendorData.hygieneReviewCount || 0
        const currentHygieneRating = vendorData.hygieneRating || 0

        newHygieneRating =
          (currentHygieneRating * currentHygieneReviewCount + reviewData.hygieneRating) /
          (currentHygieneReviewCount + 1)

        batch.update(vendorRef, {
          hygieneRating: Number.parseFloat(newHygieneRating.toFixed(1)),
          hygieneReviewCount: currentHygieneReviewCount + 1,
        })
      }

      // Update vendor with new rating and review count
      batch.update(vendorRef, {
        rating: Number.parseFloat(newRating.toFixed(1)),
        reviewCount: currentReviewCount + 1,
      })
    }

    // Update user's review count
    const userRef = firestore().collection("users").doc(reviewData.userId)
    batch.update(userRef, {
      reviewCount: firestore.FieldValue.increment(1),
    })

    // Commit the batch
    await batch.commit()

    return { id: reviewRef.id, ...newReviewData }
  } catch (error) {
    console.error("Error adding review:", error)
    throw error
  }
}

// Mark a review as helpful
export const markReviewAsHelpful = async (reviewId, userId) => {
  try {
    const reviewRef = firestore().collection("reviews").doc(reviewId)
    const reviewDoc = await reviewRef.get()

    if (!reviewDoc.exists) {
      throw new Error("Review not found")
    }

    const reviewData = reviewDoc.data()

    // Check if user has already marked this review as helpful
    if (reviewData.helpfulUsers && reviewData.helpfulUsers.includes(userId)) {
      // User has already marked this review as helpful, so remove their mark
      await reviewRef.update({
        helpfulCount: firestore.FieldValue.increment(-1),
        helpfulUsers: firestore.FieldValue.arrayRemove(userId),
      })

      return { helpful: false }
    } else {
      // User has not marked this review as helpful yet
      await reviewRef.update({
        helpfulCount: firestore.FieldValue.increment(1),
        helpfulUsers: firestore.FieldValue.arrayUnion(userId),
      })

      return { helpful: true }
    }
  } catch (error) {
    console.error("Error marking review as helpful:", error)
    throw error
  }
}

// Delete a review
export const deleteReview = async (reviewId, vendorId, userId) => {
  try {
    // Start a batch write
    const batch = firestore().batch()

    // Get the review to be deleted
    const reviewRef = firestore().collection("reviews").doc(reviewId)
    const reviewDoc = await reviewRef.get()

    if (!reviewDoc.exists) {
      throw new Error("Review not found")
    }

    const reviewData = reviewDoc.data()

    // Verify that the user is the owner of the review
    if (reviewData.userId !== userId) {
      throw new Error("Not authorized to delete this review")
    }

    // Delete the review
    batch.delete(reviewRef)

    // Update vendor document with adjusted rating and review count
    const vendorRef = firestore().collection("vendors").doc(vendorId)
    const vendorDoc = await vendorRef.get()

    if (vendorDoc.exists) {
      const vendorData = vendorDoc.data()
      const currentReviewCount = vendorData.reviewCount || 0

      if (currentReviewCount > 1) {
        // Recalculate average rating without this review
        const currentRating = vendorData.rating || 0
        const newRating = (currentRating * currentReviewCount - reviewData.rating) / (currentReviewCount - 1)

        batch.update(vendorRef, {
          rating: Number.parseFloat(newRating.toFixed(1)),
          reviewCount: currentReviewCount - 1,
        })

        // Recalculate hygiene rating if provided in the review
        if (reviewData.hygieneRating) {
          const currentHygieneReviewCount = vendorData.hygieneReviewCount || 0

          if (currentHygieneReviewCount > 1) {
            const currentHygieneRating = vendorData.hygieneRating || 0
            const newHygieneRating =
              (currentHygieneRating * currentHygieneReviewCount - reviewData.hygieneRating) /
              (currentHygieneReviewCount - 1)

            batch.update(vendorRef, {
              hygieneRating: Number.parseFloat(newHygieneRating.toFixed(1)),
              hygieneReviewCount: currentHygieneReviewCount - 1,
            })
          } else {
            // If this was the only hygiene review, reset the hygiene rating
            batch.update(vendorRef, {
              hygieneRating: 0,
              hygieneReviewCount: 0,
            })
          }
        }
      } else {
        // If this was the only review, reset the rating
        batch.update(vendorRef, {
          rating: 0,
          reviewCount: 0,
        })
      }
    }

    // Update user's review count
    const userRef = firestore().collection("users").doc(userId)
    batch.update(userRef, {
      reviewCount: firestore.FieldValue.increment(-1),
    })

    // Commit the batch
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}
