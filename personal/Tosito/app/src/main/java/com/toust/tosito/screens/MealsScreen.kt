package com.toust.tosito.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.tosito.data.model.*
import com.toust.tosito.ui.viewmodel.MealViewModel

// ─── Paleta ────────────────────────────────────────────────────────────────────
private val MBg       = Color(0xFF0C1018)
private val MBg2      = Color(0xFF131A24)
private val MCard     = Color(0xFF1C2330)
private val MCard2    = Color(0xFF222A38)
private val MBorder   = Color(0xFF2E3A4E)
private val MTeal     = Color(0xFF14B8A6)
private val MGreen    = Color(0xFF22C55E)
private val MOrange   = Color(0xFFF97316)
private val MAmber    = Color(0xFFF59E0B)
private val MRed      = Color(0xFFEF4444)
private val MPurple   = Color(0xFF8B5CF6)
private val MBlue     = Color(0xFF3B82F6)
private val MMuted    = Color(0xFF7A8BA8)
private val MText     = Color(0xFFE2EEFF)

private val TealGrad   = Brush.linearGradient(listOf(MTeal, MGreen))
private val OrangeGrad = Brush.linearGradient(listOf(MOrange, MAmber))
private val BgGrad     = Brush.verticalGradient(listOf(MBg, MBg2))
private val PurpleGrad = Brush.linearGradient(listOf(MPurple, MBlue))

fun ingCatColor(c: IngredientCategory): Color = when (c) {
    IngredientCategory.CARNE    -> MRed
    IngredientCategory.PESCADO  -> MBlue
    IngredientCategory.VEGETAL  -> MGreen
    IngredientCategory.FRUTA    -> MOrange
    IngredientCategory.LACTEO   -> Color(0xFF93C5FD)
    IngredientCategory.CEREAL   -> MAmber
    IngredientCategory.LEGUMBRE -> Color(0xFFA78BFA)
    IngredientCategory.GRASA    -> Color(0xFFFBBF24)
    IngredientCategory.ESPECIA  -> Color(0xFF34D399)
    IngredientCategory.BEBIDA   -> MTeal
    IngredientCategory.OTRO     -> MMuted
}

fun mealTypeColor(t: MealType): Color = when (t) {
    MealType.DESAYUNO -> MAmber
    MealType.ALMUERZO -> MTeal
    MealType.MERIENDA -> MOrange
    MealType.CENA     -> MPurple
    MealType.SNACK    -> MBlue
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MealsScreen(
    userId: String = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: ""
) {
    val vm: MealViewModel = viewModel()
    val activeTab         by vm.activeTab.collectAsState()
    val showMealDialog    by vm.showMealDialog.collectAsState()
    val editingMeal       by vm.editingMeal.collectAsState()
    val showIngDialog     by vm.showIngredientDialog.collectAsState()
    val editingIng        by vm.editingIngredient.collectAsState()
    val showAddToPlan     by vm.showAddToPlanDialog.collectAsState()
    val mealToAdd         by vm.mealToAddToPlan.collectAsState()
    val detailMeal        by vm.detailMeal.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(BgGrad)) {

        // Detail overlay tiene prioridad
        if (detailMeal != null) {
            MealDetailScreen(vm = vm, meal = detailMeal!!)
        } else {
            Column(modifier = Modifier.fillMaxSize()) {
                MealsHeader()
                MealsTabRow(activeTab = activeTab, onTabSelected = { vm.setTab(it) })
                AnimatedContent(
                    targetState = activeTab,
                    transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(200)) },
                    label = "meals_tab"
                ) { tab ->
                    when (tab) {
                        0 -> TodayTab(vm = vm)
                        1 -> CatalogTab(vm = vm)
                        2 -> IngredientsTab(vm = vm)
                    }
                }
            }

            // FAB contextual
            val fabLabel = when (activeTab) { 1 -> "Nueva comida"; 2 -> "Nuevo producto"; else -> "" }
            if (activeTab > 0) {
                FloatingActionButton(
                    onClick = { if (activeTab == 1) vm.showCreateMealDialog() else vm.showCreateIngredientDialog() },
                    modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                    shape = CircleShape,
                    containerColor = if (activeTab == 1) MTeal else MOrange,
                    elevation = FloatingActionButtonDefaults.elevation(6.dp)
                ) { Icon(Icons.Default.Add, fabLabel, tint = Color.White) }
            }
        }
    }

    // Diálogos
    if (showMealDialog) {
        MealDialog(meal = editingMeal, vm = vm, onDismiss = { vm.hideMealDialog() }, onSave = { vm.saveMeal(it) })
    }
    if (showIngDialog) {
        IngredientDialog(ing = editingIng, onDismiss = { vm.hideIngredientDialog() }, onSave = { vm.saveIngredient(it) })
    }
    if (showAddToPlan && mealToAdd != null) {
        AddToPlanDialog(meal = mealToAdd!!, onDismiss = { vm.hideAddToPlanDialog() }, onAdd = { t, s -> vm.addMealToPlan(mealToAdd!!, t, s) })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MealsHeader() {
    Row(modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 16.dp, top = 20.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(TealGrad),
            contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Restaurant, null, tint = Color.White, modifier = Modifier.size(24.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text("Comidas", style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 26.sp))
            Text("Planificación y nutrición", style = MaterialTheme.typography.bodySmall.copy(color = MMuted))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MealsTabRow(activeTab: Int, onTabSelected: (Int) -> Unit) {
    val tabs = listOf("📅 Hoy", "🍽 Catálogo", "🥦 Productos")
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)
        .clip(RoundedCornerShape(14.dp)).background(MCard).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        tabs.forEachIndexed { i, label ->
            val sel = activeTab == i
            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                .background(if (sel) TealGrad else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent)))
                .clickable { onTabSelected(i) }.padding(vertical = 10.dp),
                contentAlignment = Alignment.Center) {
                Text(label, style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = if (sel) FontWeight.ExtraBold else FontWeight.Normal,
                    color = if (sel) Color.White else MMuted, fontSize = 11.sp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0: HOY
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TodayTab(vm: MealViewModel) {
    val formattedDate by vm.formattedDate.collectAsState()
    val dayPlan       by vm.dayPlan.collectAsState()
    val isLoading     by vm.isLoading.collectAsState()
    val isToday = vm.isToday()
    val dayNutrition  = vm.getDayNutrition()
    val eaten = vm.getEatenCount()
    val total = vm.getTotalPlanned()
    
    val gymVm: com.toust.tosito.ui.viewmodel.GymViewModel = viewModel()
    val gymRoutine by gymVm.currentRoutine.collectAsState()
    val hasTrainingToday = isToday && gymRoutine?.exercises?.isNotEmpty() == true

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 100.dp)) {
        // Navegación de día
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { vm.goToPreviousDay() }) {
                    Icon(Icons.Default.ArrowBack, null, tint = MText)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(formattedDate, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MText))
                    if (isToday) Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(MTeal.copy(0.15f)).padding(horizontal = 10.dp, vertical = 2.dp)) {
                        Text("Hoy", style = MaterialTheme.typography.labelSmall.copy(color = MTeal, fontWeight = FontWeight.Bold))
                    }
                }
                IconButton(onClick = { vm.goToNextDay() }) {
                    Icon(Icons.Default.ArrowForward, null, tint = MText)
                }
            }
        }

        // Macros del día
        if (dayPlan?.plannedMeals?.isNotEmpty() == true) {
            item { DayMacroCard(nutrition = dayNutrition, eaten = eaten, total = total) }
        }

        // Smart Banner de Entreno
        if (hasTrainingToday) {
            item {
                Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MTeal.copy(0.15f)),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(MTeal, MGreen)))
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text("💪", fontSize = 28.sp)
                        Column {
                            Text("¡Hoy se entrena!", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = MText))
                            Text("Asegúrate de consumir suficiente proteína en tus comidas para una buena recuperación muscular.", style = MaterialTheme.typography.bodySmall.copy(color = MText.copy(0.8f)))
                        }
                    }
                }
            }
        }

        // Por tipo de comida
        MealType.values().forEach { type ->
            val items = vm.getMealsByType(type)
            item {
                MealTypeSection(
                    type = type, items = items, vm = vm,
                    onAddFromCatalog = { vm.setTab(1) }
                )
            }
        }

        if (dayPlan?.plannedMeals.isNullOrEmpty() && !isLoading) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("🍽️", fontSize = 52.sp, textAlign = TextAlign.Center)
                    Text("Sin comidas planificadas", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MText))
                    Text("Ve al Catálogo y añade comidas a tu día", style = MaterialTheme.typography.bodyMedium.copy(color = MMuted), textAlign = TextAlign.Center)
                    Button(onClick = { vm.setTab(1) }, colors = ButtonDefaults.buttonColors(containerColor = MTeal), shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Default.Restaurant, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Ver catálogo")
                    }
                }
            }
        }
        
        item {
            Button(
                onClick = { vm.generateMagicMenu(2000f) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MOrange),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("✨ Generador Mágico de Menú", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun DayMacroCard(nutrition: NutritionInfo, eaten: Int, total: Int) {
    Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
        Box(modifier = Modifier.fillMaxWidth().background(TealGrad).padding(20.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Resumen del día", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.White))
                    Text("$eaten/$total comidas", style = MaterialTheme.typography.labelMedium.copy(color = Color.White.copy(0.8f)))
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    MacroItem("Kcal", "%.0f".format(nutrition.calories), Color.White)
                    MacroItem("Prot", "%.1fg".format(nutrition.proteins), Color(0xFF86EFAC))
                    MacroItem("HC", "%.1fg".format(nutrition.carbs), Color(0xFFFDE68A))
                    MacroItem("Grasa", "%.1fg".format(nutrition.fats), Color(0xFFFCA5A5))
                    if (nutrition.price > 0) MacroItem("Precio", "%.2f€".format(nutrition.price), Color(0xFFBADA55))
                }
            }
        }
    }
}

@Composable
fun MacroItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold, color = color))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.7f)))
    }
}

@Composable
fun MealTypeSection(type: MealType, items: List<Pair<Int, PlannedMeal>>, vm: MealViewModel, onAddFromCatalog: () -> Unit) {
    val color = mealTypeColor(type)
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(type.emoji, fontSize = 18.sp)
                Text(type.label, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = color))
            }
        }
        Spacer(Modifier.height(4.dp))
        if (items.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                .background(color.copy(0.05f)).border(1.dp, color.copy(0.15f), RoundedCornerShape(12.dp))
                .clickable { onAddFromCatalog() }.padding(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Add, null, tint = color.copy(0.6f), modifier = Modifier.size(16.dp))
                    Text("Añadir ${type.label.lowercase()}", style = MaterialTheme.typography.bodySmall.copy(color = MMuted))
                }
            }
        } else {
            items.forEach { (index, pm) ->
                val recipe = vm.findRecipe(pm)
                PlannedMealCard(pm = pm, recipe = recipe, color = color,
                    onToggle = { vm.toggleEaten(index) },
                    onRemove = { vm.removeMealFromPlan(index) },
                    onDetail = { recipe?.let { vm.openDetailMeal(it) } })
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
fun PlannedMealCard(pm: PlannedMeal, recipe: Meal?, color: Color, onToggle: () -> Unit, onRemove: () -> Unit, onDetail: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = if (pm.isEaten) color.copy(0.1f) else MCard2),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(color.copy(0.3f), color.copy(0.05f))))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(36.dp).clip(CircleShape)
                .background(if (pm.isEaten) color else color.copy(0.15f))
                .border(2.dp, if (pm.isEaten) color else color.copy(0.3f), CircleShape)
                .clickable { onToggle() }, contentAlignment = Alignment.Center) {
                if (pm.isEaten) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f).clickable { onDetail() }) {
                Text(pm.mealName, style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Bold, color = if (pm.isEaten) MMuted else MText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (recipe != null) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (recipe.totalCalories > 0)
                            MSmallBadge("%.0f kcal".format(recipe.totalCalories * pm.servings), MOrange)
                        if (recipe.totalProteins > 0)
                            MSmallBadge("%.1fg prot".format(recipe.totalProteins * pm.servings), MGreen)
                        if (recipe.totalPrice > 0)
                            MSmallBadge("%.2f€".format(recipe.totalPrice * pm.servings), MAmber)
                    }
                }
                if (pm.servings != 1f) Text("x${pm.servings} raciones", style = MaterialTheme.typography.labelSmall.copy(color = MMuted))
            }
            IconButton(onClick = onRemove, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Default.Delete, null, tint = MRed.copy(0.6f), modifier = Modifier.size(15.dp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: CATÁLOGO DE COMIDAS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CatalogTab(vm: MealViewModel) {
    val isLoading   by vm.isLoading.collectAsState()
    val searchQuery by vm.searchQuery.collectAsState()
    val meals = vm.filteredMeals

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 120.dp)) {
        item {
            OutlinedTextField(value = searchQuery, onValueChange = { vm.setSearch(it) },
                label = { Text("Buscar comidas…") },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = MMuted) },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(16.dp), singleLine = true)
        }
        if (isLoading) {
            item { repeat(3) { Box(modifier = Modifier.fillMaxWidth().height(80.dp).padding(horizontal = 16.dp, vertical = 5.dp).clip(RoundedCornerShape(16.dp)).background(MCard)) } }
        } else if (meals.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(48.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("🍳", fontSize = 52.sp)
                    Text("Sin comidas", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MText))
                    Text("Crea tu primera receta", style = MaterialTheme.typography.bodyMedium.copy(color = MMuted))
                    Button(onClick = { vm.showCreateMealDialog() }, colors = ButtonDefaults.buttonColors(containerColor = MTeal), shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Crear receta")
                    }
                }
            }
        } else {
            items(meals, key = { it.id }) { meal ->
                MealCatalogCard(meal = meal, vm = vm)
            }
        }
    }
}

@Composable
fun MealCatalogCard(meal: Meal, vm: MealViewModel) {
    val color = mealTypeColor(meal.type)
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MCard2),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(color.copy(0.3f), color.copy(0.05f))))
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(50.dp).clip(RoundedCornerShape(14.dp)).background(color.copy(0.15f)), contentAlignment = Alignment.Center) {
                Text(meal.type.emoji, fontSize = 22.sp)
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f).clickable { vm.openDetailMeal(meal) }) {
                Text(meal.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = MText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (meal.description.isNotBlank()) Text(meal.description, style = MaterialTheme.typography.bodySmall.copy(color = MMuted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                    MSmallBadge(meal.type.label, color)
                    if (meal.totalCalories > 0) MSmallBadge("%.0f kcal".format(meal.totalCalories), MOrange)
                    if (meal.totalPrice > 0) MSmallBadge("%.2f€".format(meal.totalPrice), MAmber)
                    if (meal.ingredients.isNotEmpty()) MSmallBadge("${meal.ingredients.size} ing.", MTeal)
                }
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                IconButton(onClick = { vm.showAddToPlanDialog(meal) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.CalendarToday, null, tint = MTeal, modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = { vm.showEditMealDialog(meal) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Edit, null, tint = MMuted, modifier = Modifier.size(15.dp))
                }
                IconButton(onClick = { vm.deleteMeal(meal) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, null, tint = MRed.copy(0.7f), modifier = Modifier.size(15.dp))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: PRODUCTOS / INGREDIENTES
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun IngredientsTab(vm: MealViewModel) {
    val isLoading   by vm.isLoading.collectAsState()
    val searchQuery by vm.searchQuery.collectAsState()
    val ings = vm.filteredIngredients

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 120.dp)) {
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = searchQuery, onValueChange = { vm.setSearch(it) },
                    label = { Text("Buscar productos…") },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = MMuted) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp), singleLine = true)
                    
                var showBarcode by remember { mutableStateOf(false) }
                IconButton(onClick = { showBarcode = true }, modifier = Modifier.padding(top = 8.dp).size(50.dp).clip(RoundedCornerShape(16.dp)).background(MOrange.copy(0.15f))) {
                    Icon(Icons.Default.QrCodeScanner, null, tint = MOrange)
                }
                
                if (showBarcode) {
                    var code by remember { mutableStateOf("") }
                    val isScanning by vm.isScanning.collectAsState()
                    AlertDialog(
                        onDismissRequest = { showBarcode = false },
                        title = { Text("Escanear Código (OpenFoodFacts)") },
                        text = {
                            Column {
                                Text("Introduce el código de barras del producto:")
                                Spacer(Modifier.height(8.dp))
                                OutlinedTextField(value = code, onValueChange = { code = it }, singleLine = true)
                                if (isScanning) LinearProgressIndicator(modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                            }
                        },
                        confirmButton = {
                            Button(onClick = { vm.scanBarcode(code); showBarcode = false }) { Text("Buscar") }
                        },
                        dismissButton = {
                            TextButton(onClick = { showBarcode = false }) { Text("Cancelar") }
                        }
                    )
                }
            }
        }
        if (isLoading) {
            item { repeat(3) { Box(modifier = Modifier.fillMaxWidth().height(80.dp).padding(horizontal = 16.dp, vertical = 5.dp).clip(RoundedCornerShape(16.dp)).background(MCard)) } }
        } else if (ings.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(48.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("🛒", fontSize = 52.sp)
                    Text("Sin productos", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MText))
                    Text("Añade ingredientes para calcular nutrición y precio automáticamente", style = MaterialTheme.typography.bodyMedium.copy(color = MMuted), textAlign = TextAlign.Center)
                    Button(onClick = { vm.showCreateIngredientDialog() }, colors = ButtonDefaults.buttonColors(containerColor = MOrange), shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Añadir producto")
                    }
                }
            }
        } else {
            items(ings, key = { it.id }) { ing ->
                IngredientCard(ing = ing, onEdit = { vm.showEditIngredientDialog(ing) }, onDelete = { vm.deleteIngredient(ing) })
            }
        }
    }
}

@Composable
fun IngredientCard(ing: Ingredient, onEdit: () -> Unit, onDelete: () -> Unit) {
    val color = ingCatColor(ing.category)
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MCard2),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(color.copy(0.3f), color.copy(0.05f))))) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(color.copy(0.12f)), contentAlignment = Alignment.Center) {
                Text(ing.category.emoji, fontSize = 20.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(ing.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold, color = MText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 3.dp)) {
                    if (ing.calories > 0) MSmallBadge("%.0f kcal".format(ing.calories), MOrange)
                    if (ing.proteins > 0) MSmallBadge("%.1fg P".format(ing.proteins), MGreen)
                    if (ing.carbs > 0) MSmallBadge("%.1fg HC".format(ing.carbs), MAmber)
                    if (ing.pricePerUnit > 0) MSmallBadge("%.2f€/100${ing.unit}".format(ing.pricePerUnit), MTeal)
                }
            }
            IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Edit, null, tint = MMuted, modifier = Modifier.size(15.dp)) }
            IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Delete, null, tint = MRed.copy(0.7f), modifier = Modifier.size(15.dp)) }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DETALLE DE COMIDA
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun MealDetailScreen(vm: MealViewModel, meal: Meal) {
    val color = mealTypeColor(meal.type)
    val nutrition = vm.calculateMealNutrition(meal)
    val ingMap = vm.ingredientMap

    LazyColumn(modifier = Modifier.fillMaxSize().background(BgGrad),
        contentPadding = PaddingValues(bottom = 80.dp)) {
        item {
            // Header con back
            Row(modifier = Modifier.fillMaxWidth().padding(start = 8.dp, end = 16.dp, top = 16.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { vm.closeDetailMeal() }) {
                    Icon(Icons.Default.ArrowBack, null, tint = MText)
                }
                Text(meal.name, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = MText),
                    maxLines = 2, modifier = Modifier.weight(1f))
                IconButton(onClick = { vm.showEditMealDialog(meal) }) {
                    Icon(Icons.Default.Edit, null, tint = color)
                }
            }
        }
        // Macros card
        item {
            Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
                Box(modifier = Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(color, color.copy(0.7f)))).padding(20.dp)) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(meal.type.label, style = MaterialTheme.typography.labelLarge.copy(color = Color.White.copy(0.8f)))
                            if (meal.prepMinutes > 0) Text("⏱ ${meal.prepMinutes}m", style = MaterialTheme.typography.labelLarge.copy(color = Color.White.copy(0.8f)))
                        }
                        if (meal.description.isNotBlank()) Text(meal.description, style = MaterialTheme.typography.bodyMedium.copy(color = Color.White.copy(0.85f)))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            MacroItem("Kcal", "%.0f".format(nutrition.calories), Color.White)
                            MacroItem("Prot", "%.1fg".format(nutrition.proteins), Color(0xFF86EFAC))
                            MacroItem("HC", "%.1fg".format(nutrition.carbs), Color(0xFFFDE68A))
                            MacroItem("Grasa", "%.1fg".format(nutrition.fats), Color(0xFFFCA5A5))
                            MacroItem("Fibra", "%.1fg".format(nutrition.fiber), Color(0xFF6EE7B7))
                        }
                        if (nutrition.price > 0) {
                            Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                                .background(Color.Black.copy(0.2f)).padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Coste estimado", style = MaterialTheme.typography.bodyMedium.copy(color = Color.White))
                                Text("%.2f €".format(nutrition.price), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                            }
                        }
                    }
                }
            }
        }
        // Ingredientes
        item {
            Text("  Ingredientes (${meal.ingredients.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = MText),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
        }
        items(meal.ingredients) { ri ->
            val ing = ingMap[ri.ingredientId]
            val riNutrition = ing?.let { ri.scaleNutrition(it) }
            Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MCard2),
                border = CardDefaults.outlinedCardBorder()) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    val ingColor = ing?.let { ingCatColor(it.category) } ?: MMuted
                    Box(modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(ingColor.copy(0.12f)), contentAlignment = Alignment.Center) {
                        Text(ing?.category?.emoji ?: "📦", fontSize = 18.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(ri.ingredientName, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = MText))
                        Text("${ri.quantity}${ri.unit}", style = MaterialTheme.typography.labelSmall.copy(color = MMuted))
                        if (riNutrition != null && riNutrition.calories > 0) {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 3.dp)) {
                                MSmallBadge("%.0f kcal".format(riNutrition.calories), MOrange)
                                MSmallBadge("%.1fg P".format(riNutrition.proteins), MGreen)
                                if (riNutrition.price > 0) MSmallBadge("%.2f€".format(riNutrition.price), MAmber)
                            }
                        }
                    }
                }
            }
        }
        if (meal.ingredients.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("Sin ingredientes añadidos", style = MaterialTheme.typography.bodyMedium.copy(color = MMuted), textAlign = TextAlign.Center)
                }
            }
        }
        // Botón añadir al plan
        item {
            Spacer(Modifier.height(16.dp))
            Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(16.dp)).background(TealGrad).clickable { vm.showAddToPlanDialog(meal) }.padding(18.dp),
                contentAlignment = Alignment.Center) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarToday, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Text("Añadir al plan del día", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: AÑADIR AL PLAN
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun AddToPlanDialog(meal: Meal, onDismiss: () -> Unit, onAdd: (MealType, Float) -> Unit) {
    var selectedType by remember { mutableStateOf(meal.type) }
    var servings     by remember { mutableStateOf(1f) }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = MCard),
            border = CardDefaults.outlinedCardBorder()) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("📅 Añadir al plan", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = MText))
                Text(meal.name, style = MaterialTheme.typography.bodyLarge.copy(color = MTeal, fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                // Tipo de comida
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Momento del día", style = MaterialTheme.typography.labelLarge.copy(color = MMuted))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        MealType.values().forEach { type ->
                            val sel = selectedType == type
                            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                .background(if (sel) Brush.linearGradient(listOf(mealTypeColor(type), mealTypeColor(type).copy(0.7f))) else Brush.linearGradient(listOf(MCard2, MCard2)))
                                .border(1.dp, if (sel) Color.Transparent else MBorder, RoundedCornerShape(10.dp))
                                .clickable { selectedType = type }.padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(type.emoji, fontSize = 14.sp)
                                    Text(type.label.take(3), style = MaterialTheme.typography.labelSmall.copy(
                                        color = if (sel) Color.White else MMuted, fontWeight = FontWeight.Bold, fontSize = 9.sp))
                                }
                            }
                        }
                    }
                }
                // Raciones
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Raciones", style = MaterialTheme.typography.labelLarge.copy(color = MMuted))
                        Text("x${"%.1f".format(servings)}", style = MaterialTheme.typography.labelLarge.copy(color = MText, fontWeight = FontWeight.Bold))
                    }
                    Slider(value = servings, onValueChange = { servings = (it * 2).toInt() / 2f },
                        valueRange = 0.5f..5f,
                        colors = SliderDefaults.colors(thumbColor = MTeal, activeTrackColor = MTeal))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = MMuted) }
                    Button(onClick = { onAdd(selectedType, servings) }, modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MTeal), shape = RoundedCornerShape(12.dp)) {
                        Text("Añadir", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: COMIDA / RECETA
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealDialog(meal: Meal?, vm: MealViewModel, onDismiss: () -> Unit, onSave: (Meal) -> Unit) {
    val allIngredients by vm.allIngredients.collectAsState()

    var name        by remember(meal) { mutableStateOf(meal?.name ?: "") }
    var description by remember(meal) { mutableStateOf(meal?.description ?: "") }
    var mealType    by remember(meal) { mutableStateOf(meal?.type ?: MealType.ALMUERZO) }
    var prepMinutes by remember(meal) { mutableStateOf(meal?.prepMinutes?.toString() ?: "") }
    var ingredients by remember(meal) { mutableStateOf<List<RecipeIngredient>>(meal?.ingredients ?: emptyList()) }
    var showTypeMenu by remember { mutableStateOf(false) }
    var showIngMenu  by remember { mutableStateOf(false) }
    var selectedIng  by remember { mutableStateOf<Ingredient?>(null) }
    var ingQty       by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = MCard),
            border = CardDefaults.outlinedCardBorder()) {
            LazyColumn(modifier = Modifier.padding(22.dp).heightIn(max = 580.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Text(if (meal?.id?.isNotEmpty() == true) "✏️ Editar receta" else "🍳 Nueva receta",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = MText))
                }
                item { OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre de la comida") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp)) }
                item { OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Descripción (opcional)") }, modifier = Modifier.fillMaxWidth(), maxLines = 2, shape = RoundedCornerShape(12.dp)) }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(modifier = Modifier.weight(1f)) {
                            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                                .background(MCard2).border(1.dp, MBorder, RoundedCornerShape(12.dp))
                                .clickable { showTypeMenu = true }.padding(14.dp)) {
                                Column {
                                    Text("Tipo", style = MaterialTheme.typography.labelSmall.copy(color = MMuted))
                                    Text("${mealType.emoji} ${mealType.label}", style = MaterialTheme.typography.bodyMedium.copy(color = mealTypeColor(mealType), fontWeight = FontWeight.Bold))
                                }
                            }
                            DropdownMenu(expanded = showTypeMenu, onDismissRequest = { showTypeMenu = false }) {
                                MealType.values().forEach { t -> DropdownMenuItem(text = { Text("${t.emoji} ${t.label}") }, onClick = { mealType = t; showTypeMenu = false }) }
                            }
                        }
                        OutlinedTextField(value = prepMinutes, onValueChange = { prepMinutes = it },
                            label = { Text("Min. prep.") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                // Añadir ingrediente
                item {
                    Text("Ingredientes", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = MText))
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.weight(2f)) {
                            Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                                .background(MCard2).border(1.dp, MBorder, RoundedCornerShape(12.dp))
                                .clickable { showIngMenu = true }.padding(horizontal = 12.dp, vertical = 14.dp)) {
                                Text(selectedIng?.name ?: "Seleccionar producto", style = MaterialTheme.typography.bodyMedium.copy(
                                    color = if (selectedIng != null) MText else MMuted))
                            }
                            DropdownMenu(expanded = showIngMenu, onDismissRequest = { showIngMenu = false }) {
                                allIngredients.forEach { ing ->
                                    DropdownMenuItem(text = { Text("${ing.category.emoji} ${ing.name}") }, onClick = { selectedIng = ing; showIngMenu = false })
                                }
                            }
                        }
                        OutlinedTextField(value = ingQty, onValueChange = { ingQty = it },
                            label = { Text("Cant.") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        IconButton(onClick = {
                            val ing = selectedIng; val qty = ingQty.toFloatOrNull()
                            if (ing != null && qty != null && qty > 0) {
                                val newItem = RecipeIngredient(ing.id, ing.name, qty, ing.unit)
                                ingredients = ingredients + newItem
                                selectedIng = null; ingQty = ""
                            }
                        }) { Icon(Icons.Default.Add, null, tint = MTeal) }
                    }
                }
                // Lista de ingredientes añadidos
                items(ingredients) { ri ->
                    Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                        .background(MCard2).border(1.dp, MBorder, RoundedCornerShape(10.dp)).padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Text(ri.ingredientName, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall.copy(color = MText))
                        Text("${ri.quantity}${ri.unit}", style = MaterialTheme.typography.labelSmall.copy(color = MMuted))
                        IconButton(onClick = { ingredients = ingredients.filter { item -> item != ri } }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, null, tint = MRed.copy(0.7f), modifier = Modifier.size(14.dp))
                        }
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = MMuted) }
                        Button(onClick = {
                            if (name.trim().isNotBlank()) {
                                onSave(Meal(id = meal?.id ?: "", name = name.trim(), description = description.trim(),
                                    type = mealType, ingredients = ingredients.toList(), prepMinutes = prepMinutes.toIntOrNull() ?: 0,
                                    servings = meal?.servings ?: 1, createdAt = meal?.createdAt))
                            }
                        }, enabled = name.trim().isNotBlank(), modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = MTeal), shape = RoundedCornerShape(12.dp)) {
                            Text("Guardar", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: INGREDIENTE / PRODUCTO
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IngredientDialog(ing: Ingredient?, onDismiss: () -> Unit, onSave: (Ingredient) -> Unit) {
    var name         by remember(ing) { mutableStateOf(ing?.name ?: "") }
    var unit         by remember(ing) { mutableStateOf(ing?.unit ?: "g") }
    var price        by remember(ing) { mutableStateOf(ing?.pricePerUnit?.toString() ?: "") }
    var calories     by remember(ing) { mutableStateOf(ing?.calories?.toString() ?: "") }
    var proteins     by remember(ing) { mutableStateOf(ing?.proteins?.toString() ?: "") }
    var carbs        by remember(ing) { mutableStateOf(ing?.carbs?.toString() ?: "") }
    var fats         by remember(ing) { mutableStateOf(ing?.fats?.toString() ?: "") }
    var fiber        by remember(ing) { mutableStateOf(ing?.fiber?.toString() ?: "") }
    var category     by remember(ing) { mutableStateOf(ing?.category ?: IngredientCategory.OTRO) }
    var showCatMenu  by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = MCard),
            border = CardDefaults.outlinedCardBorder()) {
            LazyColumn(modifier = Modifier.padding(22.dp).heightIn(max = 560.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item { Text(if (ing?.id?.isNotEmpty() == true) "✏️ Editar producto" else "🥦 Nuevo producto",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = MText)) }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre") }, modifier = Modifier.weight(2f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = unit, onValueChange = { unit = it }, label = { Text("Unidad") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                item {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(MCard2).border(1.dp, MBorder, RoundedCornerShape(12.dp))
                            .clickable { showCatMenu = true }.padding(14.dp)) {
                            Column {
                                Text("Categoría", style = MaterialTheme.typography.labelSmall.copy(color = MMuted))
                                Text("${category.emoji} ${category.label}", style = MaterialTheme.typography.bodyMedium.copy(color = ingCatColor(category), fontWeight = FontWeight.Bold))
                            }
                        }
                        DropdownMenu(expanded = showCatMenu, onDismissRequest = { showCatMenu = false }) {
                            IngredientCategory.values().forEach { c -> DropdownMenuItem(text = { Text("${c.emoji} ${c.label}") }, onClick = { category = c; showCatMenu = false }) }
                        }
                    }
                }
                item { Text("Por 100${unit} / unidad", style = MaterialTheme.typography.labelMedium.copy(color = MMuted)) }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = calories, onValueChange = { calories = it }, label = { Text("Kcal") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = proteins, onValueChange = { proteins = it }, label = { Text("Prot g") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = carbs, onValueChange = { carbs = it }, label = { Text("HC g") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = fats, onValueChange = { fats = it }, label = { Text("Grasa g") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = fiber, onValueChange = { fiber = it }, label = { Text("Fibra g") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                        OutlinedTextField(value = price, onValueChange = { price = it }, label = { Text("Precio €") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = MMuted) }
                        Button(onClick = {
                            if (name.trim().isNotBlank()) {
                                onSave(Ingredient(id = ing?.id ?: "", name = name.trim(), unit = unit.trim(),
                                    pricePerUnit = price.toFloatOrNull() ?: 0f,
                                    calories = calories.toFloatOrNull() ?: 0f, proteins = proteins.toFloatOrNull() ?: 0f,
                                    carbs = carbs.toFloatOrNull() ?: 0f, fats = fats.toFloatOrNull() ?: 0f,
                                    fiber = fiber.toFloatOrNull() ?: 0f, category = category))
                            }
                        }, enabled = name.trim().isNotBlank(), modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = MOrange), shape = RoundedCornerShape(12.dp)) {
                            Text("Guardar", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MSmallBadge(text: String, color: Color) {
    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.14f)).padding(horizontal = 7.dp, vertical = 3.dp)) {
        Text(text, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.SemiBold))
    }
}
