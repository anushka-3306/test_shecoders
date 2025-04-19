import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import HygieneRatingBadge from "./HygieneRatingBadge"

const VendorCard = ({ vendor }) => {
  const navigation = useNavigation()

  const handlePress = () => {
    navigation.navigate("VendorDetail", { vendorId: vendor.id })
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image source={{ uri: vendor.images[0] }} style={styles.image} />

      {/* Hygiene Rating Badge */}
      <View style={styles.badgeContainer}>
        <HygieneRatingBadge rating={vendor.hygieneRating} size="small" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {vendor.name}
        </Text>
        <Text style={styles.cuisine} numberOfLines={1}>
          {vendor.cuisine}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="star" size={14} color="#FF6B00" />
            <Text style={styles.statText}>{vendor.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="map-marker" size={14} color="#FF6B00" />
            <Text style={styles.statText} numberOfLines={1}>
              {vendor.address.area}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
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
    height: 120,
    resizeMode: "cover",
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
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
  cuisine: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
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

export default VendorCard
