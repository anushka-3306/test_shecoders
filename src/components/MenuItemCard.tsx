import { View, Text, StyleSheet, Image } from "react-native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const MenuItemCard = ({ item }) => {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{item.name}</Text>
          {item.isVegetarian && (
            <View style={styles.vegBadge}>
              <Icon name="circle" size={12} color="#4CAF50" />
            </View>
          )}
        </View>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {item.popularityBadge && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>{item.popularityBadge}</Text>
          </View>
        )}
      </View>

      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  vegBadge: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 4,
    padding: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  popularBadge: {
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  popularText: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
})

export default MenuItemCard
