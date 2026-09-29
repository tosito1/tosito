package com.toust.tosito.data.model

import com.google.firebase.Timestamp

// ─── Tipo de comida en el día ─────────────────────────────────────────────────
enum class MealType(val label: String, val emoji: String, val sortOrder: Int) {
    DESAYUNO("Desayuno",     "🌅", 0),
    ALMUERZO("Almuerzo",     "☀️",  1),
    MERIENDA("Merienda",     "🍎", 2),
    CENA("Cena",             "🌙", 3),
    SNACK("Snack",           "🍫", 4)
}

// ─── Producto / Ingrediente del catálogo ─────────────────────────────────────
data class Ingredient(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val unit: String = "g",            // g, ml, ud, etc.
    val pricePerUnit: Float = 0f,      // € por unidad base
    val calories: Float = 0f,          // kcal por 100g/ml
    val proteins: Float = 0f,          // g por 100g/ml
    val carbs: Float = 0f,             // g por 100g/ml
    val fats: Float = 0f,              // g por 100g/ml
    val fiber: Float = 0f,             // g por 100g/ml
    val category: IngredientCategory = IngredientCategory.OTRO,
    val createdAt: Timestamp? = null
)

enum class IngredientCategory(val label: String, val emoji: String) {
    CARNE("Carne",          "🥩"),
    PESCADO("Pescado",      "🐟"),
    VEGETAL("Vegetal",      "🥦"),
    FRUTA("Fruta",          "🍎"),
    LACTEO("Lácteo",        "🥛"),
    CEREAL("Cereal",        "🌾"),
    LEGUMBRE("Legumbre",    "🫘"),
    GRASA("Grasa/Aceite",   "🫙"),
    ESPECIA("Especia",      "🌿"),
    BEBIDA("Bebida",        "🧃"),
    OTRO("Otro",            "📦")
}

// ─── Ingrediente en una receta (con cantidad) ─────────────────────────────────
data class RecipeIngredient(
    val ingredientId: String = "",
    val ingredientName: String = "",   // cache del nombre para mostrar sin join
    val quantity: Float = 0f,          // en la unidad del ingrediente
    val unit: String = "g"
) {
    /** Calcula los macros escalados a la cantidad dada */
    fun scaleNutrition(ingredient: Ingredient): NutritionInfo {
        val factor = quantity / 100f   // macros se dan por 100g
        return NutritionInfo(
            calories = ingredient.calories * factor,
            proteins = ingredient.proteins * factor,
            carbs    = ingredient.carbs * factor,
            fats     = ingredient.fats * factor,
            fiber    = ingredient.fiber * factor,
            price    = ingredient.pricePerUnit * quantity / 100f
        )
    }
}

// ─── Resumen nutricional calculado ───────────────────────────────────────────
data class NutritionInfo(
    val calories: Float = 0f,
    val proteins: Float = 0f,
    val carbs:    Float = 0f,
    val fats:     Float = 0f,
    val fiber:    Float = 0f,
    val price:    Float = 0f
) {
    operator fun plus(other: NutritionInfo) = NutritionInfo(
        calories = calories + other.calories,
        proteins = proteins + other.proteins,
        carbs    = carbs    + other.carbs,
        fats     = fats     + other.fats,
        fiber    = fiber    + other.fiber,
        price    = price    + other.price
    )
    companion object { val EMPTY = NutritionInfo() }
}

// ─── Receta / Comida del catálogo ──────────────────────────────────────────────
data class Meal(
    val id: String = "",
    val userId: String = "",
    val name: String = "",
    val description: String = "",
    val type: MealType = MealType.ALMUERZO,
    val ingredients: List<RecipeIngredient> = emptyList(),
    // Totales calculados (se guardan en Firestore para consultas rápidas)
    val totalCalories: Float = 0f,
    val totalProteins: Float = 0f,
    val totalCarbs: Float = 0f,
    val totalFats: Float = 0f,
    val totalFiber: Float = 0f,
    val totalPrice: Float = 0f,
    val servings: Int = 1,
    val prepMinutes: Int = 0,
    val imageUrl: String = "",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
) {
    /** Recalcula los totales a partir de la lista de ingredientes e ingredientes del catálogo */
    fun calculateTotals(ingredientCatalog: Map<String, Ingredient>): Meal {
        val totals = ingredients.fold(NutritionInfo.EMPTY) { acc, ri ->
            val ing = ingredientCatalog[ri.ingredientId]
            if (ing != null) acc + ri.scaleNutrition(ing) else acc
        }
        return copy(
            totalCalories = totals.calories,
            totalProteins = totals.proteins,
            totalCarbs    = totals.carbs,
            totalFats     = totals.fats,
            totalFiber    = totals.fiber,
            totalPrice    = totals.price
        )
    }
}

// ─── Plan de comidas de un día ─────────────────────────────────────────────────
data class DayMealPlan(
    val id: String = "",
    val userId: String = "",
    val date: String = "",              // yyyy-MM-dd
    val plannedMeals: List<PlannedMeal> = emptyList(),
    val notes: String = "",
    val createdAt: Timestamp? = null
)

data class PlannedMeal(
    val mealId: String = "",
    val mealName: String = "",          // cache del nombre
    val mealType: MealType = MealType.ALMUERZO,
    val servings: Float = 1f,
    val isEaten: Boolean = false
)
