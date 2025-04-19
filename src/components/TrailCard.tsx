import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const TrailCard = ({ trail, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: trail.coverImage }} style={styles.image} />

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {trail.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {trail.shortDescription}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="map-marker-path" size={14} color="#FF6B00" />
            <Text style={styles.statText}>{trail.stops.length} Stops</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="clock-outline" size={14} color="#FF6B00" />
            <Text style={styles.statText}>{trail.duration}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
})

export default TrailCard
