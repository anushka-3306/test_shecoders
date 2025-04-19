import { Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryButton, selectedCategory === category.name && styles.selectedCategoryButton]}
          onPress={() => onSelectCategory(category.name)}
        >
          <Text style={[styles.categoryText, selectedCategory === category.name && styles.selectedCategoryText]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#FF6B00",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  selectedCategoryText: {
    color: "#FFF",
    fontWeight: "bold",
  },
})

export default CategoryFilter
