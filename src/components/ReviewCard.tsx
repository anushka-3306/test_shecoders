import { View, Text, StyleSheet, Image } from "react-native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import { formatDistanceToNow } from "date-fns"

const ReviewCard = ({ review }) => {
  // Format the date to "X days/months ago" format
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: review.user.photoURL || "https://via.placeholder.com/40" }} style={styles.userImage} />
          <View>
            <Text style={styles.userName}>{review.user.displayName}</Text>
            <Text style={styles.reviewDate}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon key={star} name="star" size={16} color={star <= review.rating ? "#FF6B00" : "#E0E0E0"} />
          ))}
        </View>
      </View>

      <Text style={styles.reviewText}>{review.text}</Text>

      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.hygieneRating}>
          <Text style={styles.hygieneLabel}>Hygiene Rating:</Text>
          <Text style={styles.hygieneValue}>{review.hygieneRating}/5</Text>
        </View>

        <View style={styles.helpfulContainer}>
          <Icon name="thumb-up-outline" size={16} color="#666" />
          <Text style={styles.helpfulText}>Helpful ({review.helpfulCount})</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hygieneRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  hygieneLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  hygieneValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  helpfulContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpfulText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
})

export default ReviewCard
