package com.toust.tosito.data.repository

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.toust.tosito.data.model.DayMealPlan
import com.toust.tosito.data.model.Ingredient
import com.toust.tosito.data.model.IngredientCategory
import com.toust.tosito.data.model.Meal
import com.toust.tosito.data.model.MealType
import com.toust.tosito.data.model.PlannedMeal
import com.toust.tosito.data.model.RecipeIngredient
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class MealRepository {

    private val tag = "MealRepository"
    private fun db() = FirebaseFirestore.getInstance()
    private fun mealsCol()       = db().collection("tose_meals")
    private fun ingredientsCol() = db().collection("tose_ingredients")
    private fun planCol()        = db().collection("tose_meal_plan")

    // ── Ingredientes del catálogo ─────────────────────────────────────────────

    suspend fun getAllIngredients(userId: String): List<Ingredient> {
        return try {
            val snap = ingredientsCol()
                .whereEqualTo("userId", userId)
                .orderBy("name", Query.Direction.ASCENDING)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapIngredient(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting ingredients", e); emptyList()
        }
    }

    suspend fun saveIngredient(ing: Ingredient, userId: String): String? {
        return try {
            val data = ingredientToMap(ing, userId)
            if (ing.id.isEmpty()) {
                val ref = ingredientsCol().add(data).await()
                ref.id
            } else {
                ingredientsCol().document(ing.id).set(data).await()
                ing.id
            }
        } catch (e: Exception) {
            Log.e(tag, "Error saving ingredient", e); null
        }
    }

    suspend fun deleteIngredient(id: String): Boolean = try {
        ingredientsCol().document(id).delete().await(); true
    } catch (e: Exception) { false }

    // ── Comidas del catálogo ──────────────────────────────────────────────────

    suspend fun getAllMeals(userId: String): List<Meal> {
        return try {
            val snap = mealsCol()
                .whereEqualTo("userId", userId)
                .orderBy("name", Query.Direction.ASCENDING)
                .get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapMeal(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting meals", e); emptyList()
        }
    }

    suspend fun saveMeal(meal: Meal, userId: String): String? {
        return try {
            val data = mealToMap(meal, userId)
            if (meal.id.isEmpty()) {
                val ref = mealsCol().add(data).await(); ref.id
            } else {
                mealsCol().document(meal.id).set(data).await(); meal.id
            }
        } catch (e: Exception) {
            Log.e(tag, "Error saving meal", e); null
        }
    }

    suspend fun deleteMeal(id: String): Boolean = try {
        mealsCol().document(id).delete().await(); true
    } catch (e: Exception) { false }

    // ── Plan diario ────────────────────────────────────────────────────────────

    suspend fun getDayPlan(userId: String, date: String): DayMealPlan? {
        return try {
            val snap = planCol()
                .whereEqualTo("userId", userId)
                .whereEqualTo("date", date)
                .limit(1).get().await()
            snap.documents.firstOrNull()?.let { doc ->
                doc.data?.let { mapDayPlan(doc.id, it) }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting day plan", e); null
        }
    }

    suspend fun getAllDayPlans(userId: String): List<DayMealPlan> {
        return try {
            val snap = planCol().whereEqualTo("userId", userId).get().await()
            snap.documents.mapNotNull { doc -> doc.data?.let { mapDayPlan(doc.id, it) } }
        } catch (e: Exception) {
            Log.e(tag, "Error getting all day plans", e); emptyList()
        }
    }

    suspend fun saveDayPlan(plan: DayMealPlan, userId: String): Boolean {
        return try {
            val data = dayPlanToMap(plan, userId)
            if (plan.id.isEmpty()) {
                planCol().add(data).await()
            } else {
                planCol().document(plan.id).set(data).await()
            }
            true
        } catch (e: Exception) {
            Log.e(tag, "Error saving day plan", e); false
        }
    }

    // ── Serialización ──────────────────────────────────────────────────────────

    private fun ingredientToMap(ing: Ingredient, userId: String): Map<String, Any> = mapOf(
        "userId"       to userId,
        "name"         to ing.name,
        "unit"         to ing.unit,
        "pricePerUnit" to ing.pricePerUnit,
        "calories"     to ing.calories,
        "proteins"     to ing.proteins,
        "carbs"        to ing.carbs,
        "fats"         to ing.fats,
        "fiber"        to ing.fiber,
        "category"     to ing.category.name,
        "createdAt"    to (ing.createdAt ?: Timestamp.now())
    )

    private fun mapIngredient(id: String, d: Map<String, Any?>): Ingredient = Ingredient(
        id           = id,
        userId       = d["userId"] as? String ?: "",
        name         = d["name"] as? String ?: "",
        unit         = d["unit"] as? String ?: "g",
        pricePerUnit = (d["pricePerUnit"] as? Double)?.toFloat() ?: 0f,
        calories     = (d["calories"] as? Double)?.toFloat() ?: 0f,
        proteins     = (d["proteins"] as? Double)?.toFloat() ?: 0f,
        carbs        = (d["carbs"] as? Double)?.toFloat() ?: 0f,
        fats         = (d["fats"] as? Double)?.toFloat() ?: 0f,
        fiber        = (d["fiber"] as? Double)?.toFloat() ?: 0f,
        category     = try { IngredientCategory.valueOf(d["category"] as? String ?: "") }
                       catch (e: Exception) { IngredientCategory.OTRO },
        createdAt    = d["createdAt"] as? Timestamp
    )

    private fun mealToMap(meal: Meal, userId: String): Map<String, Any> {
        val ingsData = meal.ingredients.map { ri ->
            mapOf("ingredientId"   to ri.ingredientId,
                  "ingredientName" to ri.ingredientName,
                  "quantity"       to ri.quantity,
                  "unit"           to ri.unit)
        }
        return mapOf(
            "userId"        to userId,
            "name"          to meal.name,
            "description"   to meal.description,
            "type"          to meal.type.name,
            "ingredients"   to ingsData,
            "totalCalories" to meal.totalCalories,
            "totalProteins" to meal.totalProteins,
            "totalCarbs"    to meal.totalCarbs,
            "totalFats"     to meal.totalFats,
            "totalFiber"    to meal.totalFiber,
            "totalPrice"    to meal.totalPrice,
            "servings"      to meal.servings,
            "prepMinutes"   to meal.prepMinutes,
            "updatedAt"     to Timestamp.now(),
            "createdAt"     to (meal.createdAt ?: Timestamp.now())
        )
    }

    @Suppress("UNCHECKED_CAST")
    private fun mapMeal(id: String, d: Map<String, Any?>): Meal {
        val ingsRaw = d["ingredients"] as? List<Map<String, Any?>> ?: emptyList()
        val ings = ingsRaw.map { ri ->
            RecipeIngredient(
                ingredientId   = ri["ingredientId"] as? String ?: "",
                ingredientName = ri["ingredientName"] as? String ?: "",
                quantity       = (ri["quantity"] as? Double)?.toFloat() ?: 0f,
                unit           = ri["unit"] as? String ?: "g"
            )
        }
        return Meal(
            id             = id,
            userId         = d["userId"] as? String ?: "",
            name           = d["name"] as? String ?: "",
            description    = d["description"] as? String ?: "",
            type           = try { MealType.valueOf(d["type"] as? String ?: "") } catch (e: Exception) { MealType.ALMUERZO },
            ingredients    = ings,
            totalCalories  = (d["totalCalories"] as? Double)?.toFloat() ?: 0f,
            totalProteins  = (d["totalProteins"] as? Double)?.toFloat() ?: 0f,
            totalCarbs     = (d["totalCarbs"] as? Double)?.toFloat() ?: 0f,
            totalFats      = (d["totalFats"] as? Double)?.toFloat() ?: 0f,
            totalFiber     = (d["totalFiber"] as? Double)?.toFloat() ?: 0f,
            totalPrice     = (d["totalPrice"] as? Double)?.toFloat() ?: 0f,
            servings       = (d["servings"] as? Long)?.toInt() ?: 1,
            prepMinutes    = (d["prepMinutes"] as? Long)?.toInt() ?: 0,
            createdAt      = d["createdAt"] as? Timestamp,
            updatedAt      = d["updatedAt"] as? Timestamp
        )
    }

    private fun dayPlanToMap(plan: DayMealPlan, userId: String): Map<String, Any> {
        val plannedData = plan.plannedMeals.map { pm ->
            mapOf("mealId"   to pm.mealId,
                  "mealName" to pm.mealName,
                  "mealType" to pm.mealType.name,
                  "servings" to pm.servings,
                  "isEaten"  to pm.isEaten)
        }
        return mapOf(
            "userId"       to userId,
            "date"         to plan.date,
            "plannedMeals" to plannedData,
            "notes"        to plan.notes,
            "createdAt"    to (plan.createdAt ?: Timestamp.now())
        )
    }

    @Suppress("UNCHECKED_CAST")
    private fun mapDayPlan(id: String, d: Map<String, Any?>): DayMealPlan {
        val pmsRaw = d["plannedMeals"] as? List<Map<String, Any?>> ?: emptyList()
        val pms = pmsRaw.map { pm ->
            PlannedMeal(
                mealId   = pm["mealId"] as? String ?: "",
                mealName = pm["mealName"] as? String ?: "",
                mealType = try { MealType.valueOf(pm["mealType"] as? String ?: "") } catch (e: Exception) { MealType.ALMUERZO },
                servings = (pm["servings"] as? Double)?.toFloat() ?: 1f,
                isEaten  = pm["isEaten"] as? Boolean ?: false
            )
        }
        return DayMealPlan(
            id           = id,
            userId       = d["userId"] as? String ?: "",
            date         = d["date"] as? String ?: "",
            plannedMeals = pms,
            notes        = d["notes"] as? String ?: "",
            createdAt    = d["createdAt"] as? Timestamp
        )
    }

    // ── Helpers de fecha ──────────────────────────────────────────────────────
    fun getTodayDate(): String = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        .format(Calendar.getInstance().time)

    fun formatDate(date: String): String {
        return try {
            val cal = Calendar.getInstance()
            cal.time = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(date) ?: return date
            val days   = listOf("Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado")
            val months = listOf("enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre")
            "${days[cal.get(Calendar.DAY_OF_WEEK)-1]}, ${cal.get(Calendar.DAY_OF_MONTH)} de ${months[cal.get(Calendar.MONTH)]}"
        } catch (e: Exception) { date }
    }
}
