package com.toust.tosito.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.toust.tosito.data.model.DayMealPlan
import com.toust.tosito.data.model.Ingredient
import com.toust.tosito.data.model.Meal
import com.toust.tosito.data.model.MealType
import com.toust.tosito.data.model.NutritionInfo
import com.toust.tosito.data.model.PlannedMeal
import com.toust.tosito.data.model.RecipeIngredient
import com.toust.tosito.data.repository.MealRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class MealViewModel(
    private val repository: MealRepository = MealRepository()
) : ViewModel() {

    private val userId get() = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    // ─── Tab ──────────────────────────────────────────────────────────────────
    private val _activeTab = MutableStateFlow(0) // 0=Hoy, 1=Catálogo, 2=Productos
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    // ─── Fecha seleccionada ───────────────────────────────────────────────────
    private val _selectedDate = MutableStateFlow(repository.getTodayDate())
    val selectedDate: StateFlow<String> = _selectedDate.asStateFlow()

    private val _formattedDate = MutableStateFlow("")
    val formattedDate: StateFlow<String> = _formattedDate.asStateFlow()

    // ─── Plan del día ──────────────────────────────────────────────────────────
    private val _dayPlan = MutableStateFlow<DayMealPlan?>(null)
    val dayPlan: StateFlow<DayMealPlan?> = _dayPlan.asStateFlow()

    // ─── Catálogo de comidas ──────────────────────────────────────────────────
    private val _allMeals = MutableStateFlow<List<Meal>>(emptyList())
    val allMeals: StateFlow<List<Meal>> = _allMeals.asStateFlow()

    // ─── Catálogo de ingredientes ─────────────────────────────────────────────
    private val _allIngredients = MutableStateFlow<List<Ingredient>>(emptyList())
    val allIngredients: StateFlow<List<Ingredient>> = _allIngredients.asStateFlow()

    /** Mapa id -> Ingredient para cálculos rápidos */
    val ingredientMap: Map<String, Ingredient> get() = _allIngredients.value.associateBy { it.id }

    // ─── Meal detalle abierto ─────────────────────────────────────────────────
    private val _detailMeal = MutableStateFlow<Meal?>(null)
    val detailMeal: StateFlow<Meal?> = _detailMeal.asStateFlow()

    // ─── Búsqueda ──────────────────────────────────────────────────────────────
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val filteredMeals: List<Meal>
        get() {
            val q = _searchQuery.value.lowercase()
            return if (q.isBlank()) _allMeals.value
            else _allMeals.value.filter { it.name.lowercase().contains(q) }
        }

    val filteredIngredients: List<Ingredient>
        get() {
            val q = _searchQuery.value.lowercase()
            return if (q.isBlank()) _allIngredients.value
            else _allIngredients.value.filter { it.name.lowercase().contains(q) }
        }

    // ─── Loading ───────────────────────────────────────────────────────────────
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // ─── Diálogos ─────────────────────────────────────────────────────────────
    private val _showMealDialog   = MutableStateFlow(false)
    val showMealDialog: StateFlow<Boolean> = _showMealDialog.asStateFlow()

    private val _editingMeal = MutableStateFlow<Meal?>(null)
    val editingMeal: StateFlow<Meal?> = _editingMeal.asStateFlow()

    private val _showIngredientDialog = MutableStateFlow(false)
    val showIngredientDialog: StateFlow<Boolean> = _showIngredientDialog.asStateFlow()

    private val _editingIngredient = MutableStateFlow<Ingredient?>(null)
    val editingIngredient: StateFlow<Ingredient?> = _editingIngredient.asStateFlow()

    // Dialog para añadir comida al plan del día
    private val _showAddToPlanDialog = MutableStateFlow(false)
    val showAddToPlanDialog: StateFlow<Boolean> = _showAddToPlanDialog.asStateFlow()

    private val _mealToAddToPlan = MutableStateFlow<Meal?>(null)
    val mealToAddToPlan: StateFlow<Meal?> = _mealToAddToPlan.asStateFlow()

    init {
        loadAll()
        viewModelScope.launch {
            _selectedDate.collect { date ->
                _formattedDate.value = repository.formatDate(date)
            }
        }
    }

    fun setTab(tab: Int) {
        _activeTab.value = tab
        _searchQuery.value = ""
    }

    fun setSearch(q: String) { _searchQuery.value = q }

    // ─── Carga ────────────────────────────────────────────────────────────────
    fun loadAll() {
        viewModelScope.launch {
            _isLoading.value = true
            _allIngredients.value = repository.getAllIngredients(userId)
            _allMeals.value = repository.getAllMeals(userId)
            _dayPlan.value = repository.getDayPlan(userId, _selectedDate.value)
            _formattedDate.value = repository.formatDate(_selectedDate.value)
            _isLoading.value = false
        }
    }

    fun loadDayPlan() {
        viewModelScope.launch {
            _dayPlan.value = repository.getDayPlan(userId, _selectedDate.value)
        }
    }

    // ─── Navegación de fecha ───────────────────────────────────────────────────
    fun goToPreviousDay() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val cal = Calendar.getInstance()
        cal.time = sdf.parse(_selectedDate.value) ?: return
        cal.add(Calendar.DAY_OF_MONTH, -1)
        _selectedDate.value = sdf.format(cal.time)
        loadDayPlan()
    }

    fun goToNextDay() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val cal = Calendar.getInstance()
        cal.time = sdf.parse(_selectedDate.value) ?: return
        cal.add(Calendar.DAY_OF_MONTH, 1)
        _selectedDate.value = sdf.format(cal.time)
        loadDayPlan()
    }

    fun goToToday() {
        _selectedDate.value = repository.getTodayDate()
        loadDayPlan()
    }

    fun isToday() = _selectedDate.value == repository.getTodayDate()

    // ─── Plan del día: añadir/quitar/marcar ───────────────────────────────────
    fun showAddToPlanDialog(meal: Meal) {
        _mealToAddToPlan.value = meal
        _showAddToPlanDialog.value = true
    }

    fun hideAddToPlanDialog() {
        _showAddToPlanDialog.value = false
        _mealToAddToPlan.value = null
    }

    fun addMealToPlan(meal: Meal, mealType: MealType, servings: Float = 1f) {
        viewModelScope.launch {
            val current = _dayPlan.value ?: DayMealPlan(date = _selectedDate.value)
            val newPlanned = PlannedMeal(
                mealId   = meal.id,
                mealName = meal.name,
                mealType = mealType,
                servings = servings,
                isEaten  = false
            )
            val updated = current.copy(plannedMeals = current.plannedMeals + newPlanned)
            if (repository.saveDayPlan(updated, userId)) {
                _dayPlan.value = updated
            }
            hideAddToPlanDialog()
        }
    }

    fun removeMealFromPlan(index: Int) {
        viewModelScope.launch {
            val current = _dayPlan.value ?: return@launch
            val updated = current.copy(plannedMeals = current.plannedMeals.toMutableList().also { it.removeAt(index) })
            if (repository.saveDayPlan(updated, userId)) _dayPlan.value = updated
        }
    }

    fun toggleEaten(index: Int) {
        viewModelScope.launch {
            val current = _dayPlan.value ?: return@launch
            val pms = current.plannedMeals.toMutableList()
            val pm = pms[index]
            pms[index] = pm.copy(isEaten = !pm.isEaten)
            val updated = current.copy(plannedMeals = pms)
            if (repository.saveDayPlan(updated, userId)) _dayPlan.value = updated
        }
    }

    // ─── Comidas del catálogo ─────────────────────────────────────────────────
    fun showCreateMealDialog() {
        _editingMeal.value = null
        _showMealDialog.value = true
    }

    fun showEditMealDialog(meal: Meal) {
        _editingMeal.value = meal
        _showMealDialog.value = true
    }

    fun hideMealDialog() {
        _showMealDialog.value = false
        _editingMeal.value = null
    }

    fun openDetailMeal(meal: Meal) { _detailMeal.value = meal }
    fun closeDetailMeal() { _detailMeal.value = null }

    fun saveMeal(meal: Meal) {
        viewModelScope.launch {
            _isLoading.value = true
            // Calcular totales antes de guardar
            val mealWithTotals = meal.calculateTotals(ingredientMap)
            repository.saveMeal(mealWithTotals, userId)
            _allMeals.value = repository.getAllMeals(userId)
            hideMealDialog()
            _isLoading.value = false
        }
    }

    fun deleteMeal(meal: Meal) {
        viewModelScope.launch {
            repository.deleteMeal(meal.id)
            _allMeals.value = repository.getAllMeals(userId)
            if (_detailMeal.value?.id == meal.id) _detailMeal.value = null
        }
    }

    // ─── Ingredientes ─────────────────────────────────────────────────────────
    fun showCreateIngredientDialog() {
        _editingIngredient.value = null
        _showIngredientDialog.value = true
    }

    fun showEditIngredientDialog(ing: Ingredient) {
        _editingIngredient.value = ing
        _showIngredientDialog.value = true
    }

    fun hideIngredientDialog() {
        _showIngredientDialog.value = false
        _editingIngredient.value = null
    }

    fun saveIngredient(ing: Ingredient) {
        viewModelScope.launch {
            _isLoading.value = true
            repository.saveIngredient(ing, userId)
            _allIngredients.value = repository.getAllIngredients(userId)
            hideIngredientDialog()
            _isLoading.value = false
        }
    }

    fun deleteIngredient(ing: Ingredient) {
        viewModelScope.launch {
            repository.deleteIngredient(ing.id)
            _allIngredients.value = repository.getAllIngredients(userId)
        }
    }

    // ─── Estadísticas del día ──────────────────────────────────────────────────
    fun getDayNutrition(): NutritionInfo {
        val plan = _dayPlan.value ?: return NutritionInfo.EMPTY
        return plan.plannedMeals.fold(NutritionInfo.EMPTY) { acc, pm ->
            val meal = _allMeals.value.firstOrNull { it.id == pm.mealId }
                ?: return@fold acc
            acc + NutritionInfo(
                calories = meal.totalCalories * pm.servings,
                proteins = meal.totalProteins * pm.servings,
                carbs    = meal.totalCarbs    * pm.servings,
                fats     = meal.totalFats     * pm.servings,
                fiber    = meal.totalFiber    * pm.servings,
                price    = meal.totalPrice    * pm.servings
            )
        }
    }

    fun getEatenCount()   = _dayPlan.value?.plannedMeals?.count { it.isEaten } ?: 0
    fun getTotalPlanned() = _dayPlan.value?.plannedMeals?.size ?: 0

    /** Devuelve las comidas del plan por tipo */
    fun getMealsByType(type: MealType): List<Pair<Int, PlannedMeal>> {
        return _dayPlan.value?.plannedMeals
            ?.withIndex()
            ?.filter { (_, pm) -> pm.mealType == type }
            ?.map { (i, pm) -> Pair(i, pm) } ?: emptyList()
    }

    /** Encuentra la receta del catálogo para un PlannedMeal */
    fun findRecipe(pm: PlannedMeal): Meal? = _allMeals.value.firstOrNull { it.id == pm.mealId }

    fun calculateMealNutrition(meal: Meal): NutritionInfo {
        return meal.ingredients.fold(NutritionInfo.EMPTY) { acc, ri ->
            val ing = ingredientMap[ri.ingredientId]
            if (ing != null) acc + ri.scaleNutrition(ing) else acc
        }
    }

    // ─── Comidas Inteligentes ──────────────────────────────────────────────────
    fun generateMagicMenu(targetCalories: Float = 2000f) {
        val currentPlan = _dayPlan.value ?: return
        val all = _allMeals.value
        if (all.isEmpty()) return
        
        viewModelScope.launch {
            val plan = mutableListOf<PlannedMeal>()
            
            // Un plato por cada tipo principal si existe
            listOf(MealType.DESAYUNO, MealType.ALMUERZO, MealType.MERIENDA, MealType.CENA).forEach { type ->
                val typeMeals = all.filter { it.type == type }
                if (typeMeals.isNotEmpty()) {
                    val randomMeal = typeMeals.random()
                    plan.add(PlannedMeal(
                        mealId = randomMeal.id,
                        mealName = randomMeal.name,
                        mealType = type,
                        servings = 1f,
                        isEaten = false
                    ))
                }
            }
            
            // Guardar el nuevo plan
            val newPlan = currentPlan.copy(plannedMeals = plan)
            if (repository.saveDayPlan(newPlan, userId)) {
                _dayPlan.value = newPlan
            }
        }
    }

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    fun scanBarcode(barcode: String) {
        if (barcode.isBlank()) return
        _isScanning.value = true
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val url = java.net.URL("https://world.openfoodfacts.org/api/v0/product/$barcode.json")
                val response = url.readText()
                val json = org.json.JSONObject(response)
                if (json.getInt("status") == 1) {
                    val product = json.getJSONObject("product")
                    val name = product.optString("product_name", "Producto Escaneado")
                    val nutriments = product.optJSONObject("nutriments")
                    
                    var cal = 0f; var prot = 0f; var carbs = 0f; var fat = 0f
                    if (nutriments != null) {
                        cal = nutriments.optDouble("energy-kcal_100g", 0.0).toFloat()
                        prot = nutriments.optDouble("proteins_100g", 0.0).toFloat()
                        carbs = nutriments.optDouble("carbohydrates_100g", 0.0).toFloat()
                        fat = nutriments.optDouble("fat_100g", 0.0).toFloat()
                    }
                    
                    val scannedIngredient = Ingredient(
                        name = name,
                        unit = "g",
                        calories = cal,
                        proteins = prot,
                        carbs = carbs,
                        fats = fat,
                        category = com.toust.tosito.data.model.IngredientCategory.OTRO
                    )
                    
                    kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                        _editingIngredient.value = scannedIngredient
                        _showIngredientDialog.value = true
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("MealViewModel", "Error al escanear código de barras", e)
            } finally {
                _isScanning.value = false
            }
        }
    }
}
