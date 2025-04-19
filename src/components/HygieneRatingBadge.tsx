import { View, Text, StyleSheet } from "react-native"

const HygieneRatingBadge = ({ rating, size = "medium" }) => {
  // Determine color based on rating
  const getColor = () => {
    if (rating >= 4) return "#4CAF50" // Green for high ratings
    if (rating >= 3) return "#FFC107" // Yellow for medium ratings
    return "#F44336" // Red for low ratings
  }

  // Determine size based on prop
  const getBadgeSize = () => {
    switch (size) {
      case "small":
        return {
          container: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
          text: { fontSize: 10 },
        }
      case "large":
        return {
          container: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
          text: { fontSize: 16 },
        }
      default: // medium
        return {
          container: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
          text: { fontSize: 12 },
        }
    }
  }

  const sizeStyles = getBadgeSize()
  const color = getColor()

  return (
    <View style={[styles.container, sizeStyles.container, { backgroundColor: color }]}>
      <Text style={[styles.text, sizeStyles.text]}>{rating.toFixed(1)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#4CAF50",
    alignSelf: "flex-start",
  },
  text: {
    color: "#FFF",
    fontWeight: "bold",
  },
})

export default HygieneRatingBadge
