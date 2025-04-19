import { Text, StyleSheet, TouchableOpacity } from "react-native"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

const SearchBar = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Icon name="magnify" size={20} color="#666" />
      <Text style={styles.placeholder}>Search for vendors, dishes, areas...</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
  },
  placeholder: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
})

export default SearchBar
