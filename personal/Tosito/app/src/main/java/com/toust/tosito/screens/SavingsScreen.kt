package com.toust.tosito.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.core.app.NotificationManagerCompat
import android.content.Intent
import android.provider.Settings
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.ui.platform.LocalContext
import com.toust.tosito.data.model.*
import com.toust.tosito.ui.viewmodel.SavingsViewModel

// ─── Paleta ────────────────────────────────────────────────────────────────────
private val SBg      = Color(0xFF0B0F1A)
private val SBg2     = Color(0xFF111827)
private val SCard    = Color(0xFF1A2235)
private val SCard2   = Color(0xFF1F2C42)
private val SBorder  = Color(0xFF2A3A55)
private val SGreen   = Color(0xFF10B981)
private val SRed     = Color(0xFFEF4444)
private val SBlue    = Color(0xFF3B82F6)
private val SPurple  = Color(0xFF8B5CF6)
private val SAmber   = Color(0xFFF59E0B)
private val STeal    = Color(0xFF14B8A6)
private val SMuted   = Color(0xFF6B7FA3)
private val SText    = Color(0xFFE2EBF8)

private val GreenGrad  = Brush.linearGradient(listOf(SGreen, Color(0xFF34D399)))
private val RedGrad    = Brush.linearGradient(listOf(SRed, Color(0xFFF97316)))
private val BlueGrad   = Brush.linearGradient(listOf(SBlue, SPurple))
private val GoldGrad   = Brush.linearGradient(listOf(SAmber, Color(0xFFFBBF24)))
private val BgGrad     = Brush.verticalGradient(listOf(SBg, SBg2))

private fun categoryColor(cat: TransactionCategory): Color = when (cat) {
    TransactionCategory.SALARIO       -> SGreen
    TransactionCategory.FREELANCE     -> STeal
    TransactionCategory.INVERSION     -> SBlue
    TransactionCategory.REGALO        -> SPurple
    TransactionCategory.ALIMENTACION  -> SAmber
    TransactionCategory.TRANSPORTE    -> Color(0xFF60A5FA)
    TransactionCategory.OCIO          -> Color(0xFFA78BFA)
    TransactionCategory.ROPA          -> Color(0xFFF472B6)
    TransactionCategory.SALUD         -> Color(0xFF34D399)
    TransactionCategory.SUSCRIPCION   -> Color(0xFFFBBF24)
    TransactionCategory.HOGAR         -> Color(0xFF6EE7B7)
    TransactionCategory.EDUCACION     -> Color(0xFF93C5FD)
    TransactionCategory.VIAJE         -> Color(0xFFE879F9)
    TransactionCategory.RESTAURANTE   -> Color(0xFFFCA5A5)
    else                              -> SMuted
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SavingsScreen(
    userId: String = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: ""
) {
    val vm: SavingsViewModel = viewModel()
    val activeTab    by vm.activeTab.collectAsState()
    val showTxDialog by vm.showTransactionDialog.collectAsState()
    val editingTx    by vm.editingTransaction.collectAsState()
    val showGoalDlg  by vm.showGoalDialog.collectAsState()
    val editingGoal  by vm.editingGoal.collectAsState()
    val showDeposit  by vm.showAddToGoalDialog.collectAsState()
    val depositGoal  by vm.selectedGoalForDeposit.collectAsState()

    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var isNotificationAccessGranted by remember { 
        mutableStateOf(NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)) 
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                isNotificationAccessGranted = NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
                vm.loadAll() // Recargar datos por si han entrado gastos de fondo
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    Box(modifier = Modifier.fillMaxSize().background(BgGrad)) {
        Column(modifier = Modifier.fillMaxSize()) {
            SavingsHeader()
            
            if (!isNotificationAccessGranted) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                        .clickable {
                            context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                        },
                    colors = CardDefaults.cardColors(containerColor = SCard2),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(SAmber.copy(0.5f), SAmber.copy(0.1f))))
                ) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("🔔", fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Activar detección de gastos", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SAmber))
                            Text("Toca aquí para permitir leer notificaciones bancarias", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                        }
                    }
                }
            }

            SavingsTabRow(activeTab = activeTab, onTabSelected = { vm.setTab(it) })
            AnimatedContent(
                targetState = activeTab,
                transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(200)) },
                label = "savings_tab"
            ) { tab ->
                when (tab) {
                    0 -> SummaryTab(vm = vm)
                    1 -> TransactionsTab(vm = vm)
                    2 -> GoalsTab(vm = vm)
                    3 -> SubscriptionsTab(vm = vm)
                }
            }
        }

        // FAB contextual
        val fabVisible = activeTab > 0
        if (fabVisible) {
            FloatingActionButton(
                onClick = {
                    if (activeTab == 1) vm.showAddTransactionDialog()
                    else vm.showCreateGoalDialog()
                },
                modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
                shape = CircleShape,
                containerColor = if (activeTab == 1) STeal else SPurple,
                elevation = FloatingActionButtonDefaults.elevation(6.dp)
            ) { Icon(Icons.Default.Add, null, tint = Color.White) }
        }
    }

    if (showTxDialog && editingTx != null) {
        TransactionDialog(tx = editingTx!!, onDismiss = { vm.hideTransactionDialog() }, onSave = { vm.saveTransaction(it) })
    }
    if (showGoalDlg) {
        GoalDialog(goal = editingGoal, onDismiss = { vm.hideGoalDialog() }, onSave = { vm.saveGoal(it) })
    }
    if (showDeposit && depositGoal != null) {
        DepositDialog(goal = depositGoal!!, onDismiss = { vm.hideAddToGoalDialog() }, onDeposit = { vm.depositToGoal(depositGoal!!, it) })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SavingsHeader() {
    Row(modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 16.dp, top = 20.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(GreenGrad),
            contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Savings, null, tint = Color.White, modifier = Modifier.size(24.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text("Ahorros", style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 26.sp))
            Text("Finanzas personales", style = MaterialTheme.typography.bodySmall.copy(color = SMuted))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SavingsTabRow(activeTab: Int, onTabSelected: (Int) -> Unit) {
    val tabs = listOf("Resumen", "Transacciones", "Objetivos", "Suscripciones")
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)
        .clip(RoundedCornerShape(14.dp)).background(SCard).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        tabs.forEachIndexed { i, label ->
            val sel = activeTab == i
            Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                .background(if (sel) GreenGrad else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent)))
                .clickable { onTabSelected(i) }.padding(vertical = 10.dp),
                contentAlignment = Alignment.Center) {
                Text(label, style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = if (sel) FontWeight.ExtraBold else FontWeight.Normal,
                    color = if (sel) Color.White else SMuted, fontSize = 11.sp))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0: RESUMEN
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun SummaryTab(vm: SavingsViewModel) {
    val summary    by vm.summary.collectAsState()
    val transactions by vm.transactions.collectAsState()
    val isLoading  by vm.isLoading.collectAsState()
    val goals      by vm.goals.collectAsState()
    val selectedMonth by vm.selectedMonth.collectAsState()
    val monthTitle  = vm.getMonthTitle()
    val budgetLimit by vm.budgetLimit.collectAsState()
    var showBudgetDialog by remember { mutableStateOf(false) }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 100.dp)) {
        // Selector de mes
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { vm.previousMonth() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = SText) }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(monthTitle, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = SText))
                    if (vm.isCurrentMonth()) Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(SGreen.copy(0.15f)).padding(horizontal = 10.dp, vertical = 2.dp)) {
                        Text("Este mes", style = MaterialTheme.typography.labelSmall.copy(color = SGreen, fontWeight = FontWeight.Bold))
                    }
                }
                IconButton(onClick = { vm.nextMonth() }, enabled = !vm.isCurrentMonth()) {
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = if (vm.isCurrentMonth()) SMuted else SText)
                }
            }
        }

        // Export CSV Button
        item {
            val context = androidx.compose.ui.platform.LocalContext.current
            val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
                androidx.activity.result.contract.ActivityResultContracts.CreateDocument("text/csv")
            ) { uri ->
                if (uri != null) vm.saveCSVToUri(context, uri)
            }
            androidx.compose.material3.TextButton(
                onClick = { launcher.launch("Gastos_Tosito_${selectedMonth}.csv") },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 0.dp)
            ) {
                Text("📥 Exportar gastos del mes a CSV", color = STeal)
            }
        }

        // Balance card grande
        item {
            Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
                Box(modifier = Modifier.fillMaxWidth()
                    .background(if (summary.balance >= 0) GreenGrad else RedGrad)
                    .padding(24.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text("Balance mensual", style = MaterialTheme.typography.labelLarge.copy(color = Color.White.copy(0.8f), letterSpacing = 1.sp))
                        Spacer(Modifier.height(6.dp))
                        Text("%+.2f €".format(summary.balance),
                            style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 42.sp))
                        Spacer(Modifier.height(16.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            BalanceItem("Ingresos", "%.2f €".format(summary.totalIncome), Color(0xFF86EFAC), "📈")
                            Box(modifier = Modifier.width(1.dp).height(40.dp).background(Color.White.copy(0.3f)))
                            BalanceItem("Gastos", "%.2f €".format(summary.totalExpense), Color(0xFFFCA5A5), "📉")
                        }
                    }
                }
            }
        }

        // Botones rápidos
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp)).background(SGreen.copy(0.12f))
                    .border(1.dp, SGreen.copy(0.3f), RoundedCornerShape(16.dp))
                    .clickable { vm.showAddTransactionDialog(TransactionType.INCOME) }.padding(14.dp),
                    contentAlignment = Alignment.Center) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Add, null, tint = SGreen, modifier = Modifier.size(18.dp))
                        Text("Ingreso", style = MaterialTheme.typography.labelLarge.copy(color = SGreen, fontWeight = FontWeight.Bold))
                    }
                }
                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp)).background(SRed.copy(0.12f))
                    .border(1.dp, SRed.copy(0.3f), RoundedCornerShape(16.dp))
                    .clickable { vm.showAddTransactionDialog(TransactionType.EXPENSE) }.padding(14.dp),
                    contentAlignment = Alignment.Center) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Remove, null, tint = SRed, modifier = Modifier.size(18.dp))
                        Text("Gasto", style = MaterialTheme.typography.labelLarge.copy(color = SRed, fontWeight = FontWeight.Bold))
                    }
                }
                // BOTÓN DE TEST TEMPORAL
                val context = LocalContext.current
                Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(16.dp)).background(SBlue.copy(0.12f))
                    .border(1.dp, SBlue.copy(0.3f), RoundedCornerShape(16.dp))
                    .clickable { 
                        val manager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            val channel = android.app.NotificationChannel("test_wallet", "Test", android.app.NotificationManager.IMPORTANCE_DEFAULT)
                            manager.createNotificationChannel(channel)
                        }
                        val notif = android.app.Notification.Builder(context, "test_wallet")
                            .setSmallIcon(android.R.drawable.ic_dialog_info)
                            .setContentTitle("Asadero Benlalua")
                            .setContentText("7,5 euros con mastercard debito joven **6742")
                            .setAutoCancel(true)
                            .build()
                        manager.notify(999, notif)
                    }.padding(14.dp),
                    contentAlignment = Alignment.Center) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Test", style = MaterialTheme.typography.labelLarge.copy(color = SBlue, fontWeight = FontWeight.Bold))
                    }
                }
            }
        }

        // Configuración de Presupuesto
        item {
            Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                .clickable { showBudgetDialog = true },
                shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = SCard2)) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(SBlue.copy(0.15f)), contentAlignment = Alignment.Center) {
                            Text("⚙️", fontSize = 18.sp)
                        }
                        Column {
                            Text("Presupuesto Mensual", style = MaterialTheme.typography.bodyLarge.copy(color = SText, fontWeight = FontWeight.Bold))
                            Text("%.2f € de límite".format(budgetLimit), style = MaterialTheme.typography.labelMedium.copy(color = SMuted))
                        }
                    }
                    Icon(Icons.Default.Edit, null, tint = SMuted, modifier = Modifier.size(18.dp))
                }
            }
        }

        // Top categorías
        val topCats = vm.getTopExpenseCategories()
        if (topCats.isNotEmpty()) {
            item { SectionTitle("📉 Distribución de Gastos") }
            item {
                ExpenseDonutChart(expenses = topCats, total = summary.totalExpense)
                Spacer(Modifier.height(16.dp))
            }
            item {
                Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SCard),
                    border = CardDefaults.outlinedCardBorder()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        topCats.forEach { (cat, amount) ->
                            val fraction = if (summary.totalExpense > 0) (amount / summary.totalExpense).toFloat() else 0f
                            val animFrac by animateFloatAsState(fraction, spring(Spring.DampingRatioMediumBouncy), label = "")
                            val color = categoryColor(cat)
                            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text(cat.emoji, fontSize = 18.sp, modifier = Modifier.width(28.dp))
                                Column(modifier = Modifier.weight(1f).padding(horizontal = 10.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(cat.label, style = MaterialTheme.typography.labelMedium.copy(color = SText))
                                        Text("%.2f €".format(amount), style = MaterialTheme.typography.labelMedium.copy(color = color, fontWeight = FontWeight.Bold))
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    LinearProgressIndicator(progress = { animFrac }, modifier = Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),
                                        color = color, trackColor = color.copy(0.12f))
                                }
                                Text("${(fraction * 100).toInt()}%", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                            }
                        }
                    }
                }
            }
        }

        // Últimas transacciones
        val recent = vm.getRecentTransactions(5)
        if (recent.isNotEmpty()) {
            item { SectionTitle("🕐 Últimas transacciones") }
            items(recent) { tx ->
                TransactionCard(tx = tx, onEdit = { vm.showEditTransactionDialog(tx) }, onDelete = { vm.deleteTransaction(tx) }, compact = true)
            }
            item {
                TextButton(onClick = { vm.setTab(1) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Ver todas →", style = MaterialTheme.typography.labelLarge.copy(color = STeal, fontWeight = FontWeight.Bold))
                }
            }
        }

        // Objetivos rápidos
        val activeGoals = goals.filter { !it.isCompleted }.take(2)
        if (activeGoals.isNotEmpty()) {
            item { SectionTitle("🎯 Objetivos activos") }
            items(activeGoals) { goal ->
                GoalCardCompact(goal = goal, onDeposit = { vm.showAddToGoalDialog(goal) })
            }
            item {
                TextButton(onClick = { vm.setTab(2) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Ver todos →", style = MaterialTheme.typography.labelLarge.copy(color = SPurple, fontWeight = FontWeight.Bold))
                }
            }
        }
    }

    if (showBudgetDialog) {
        var input by remember { mutableStateOf(budgetLimit.toString()) }
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showBudgetDialog = false },
            containerColor = SCard,
            title = { Text("Configurar Presupuesto", color = SText) },
            text = {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    label = { Text("Límite mensual (€)") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = SText, unfocusedTextColor = SText
                    )
                )
            },
            confirmButton = {
                Button(onClick = {
                    input.toDoubleOrNull()?.let { vm.updateBudgetLimit(it) }
                    showBudgetDialog = false
                }, colors = ButtonDefaults.buttonColors(containerColor = SBlue)) {
                    Text("Guardar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showBudgetDialog = false }) { Text("Cancelar", color = SMuted) }
            }
        )
    }
}

@Composable
fun BalanceItem(label: String, value: String, color: Color, emoji: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(emoji, fontSize = 20.sp)
        Text(value, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = color))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.7f)))
    }
}

@Composable
fun SectionTitle(title: String) {
    Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = SText),
        modifier = Modifier.padding(start = 20.dp, top = 16.dp, bottom = 4.dp))
}

@Composable
fun ExpenseDonutChart(expenses: List<Pair<TransactionCategory, Double>>, total: Double) {
    if (total <= 0) return
    
    // Sort expenses by amount descending just in case
    val sorted = expenses.sortedByDescending { it.second }
    
    Box(modifier = Modifier.fillMaxWidth().height(220.dp).padding(vertical = 16.dp), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.Canvas(modifier = Modifier.size(170.dp)) {
            // Fondo
            drawCircle(color = SCard, style = Stroke(width = 50f))
            
            var startAngle = -90f
            sorted.forEach { (cat, amount) ->
                val sweepAngle = ((amount / total) * 360).toFloat()
                val color = categoryColor(cat)
                
                // Si el sweepAngle es muy pequeño, apenas se ve. Lo dibujamos normal.
                drawArc(
                    color = color,
                    startAngle = startAngle,
                    sweepAngle = sweepAngle - 2f, // Pequeño espacio
                    useCenter = false,
                    style = Stroke(width = 50f, cap = StrokeCap.Round)
                )
                startAngle += sweepAngle
            }
        }
        
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Total", style = MaterialTheme.typography.labelSmall.copy(color = SMuted, letterSpacing = 1.sp))
            Text("%.0f€".format(total), style = MaterialTheme.typography.headlineMedium.copy(color = SText, fontWeight = FontWeight.ExtraBold))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: TRANSACCIONES
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TransactionsTab(vm: SavingsViewModel) {
    val filterType by vm.filterType.collectAsState()
    val txs by vm.filteredTransactions.collectAsState()
    val isLoading by vm.isLoading.collectAsState()

    val timeFilter by vm.timeFilter.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 120.dp)) {
        // Filtros de tipo
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(top = 8.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = filterType == null, onClick = { vm.setFilter(null) }, label = { Text("Todos") })
                FilterChip(selected = filterType == TransactionType.INCOME, onClick = { vm.setFilter(TransactionType.INCOME) },
                    label = { Text("📈 Ingresos") })
                FilterChip(selected = filterType == TransactionType.EXPENSE, onClick = { vm.setFilter(TransactionType.EXPENSE) },
                    label = { Text("📉 Gastos") })
            }
        }
        // Filtros de tiempo
        item {
            androidx.compose.foundation.lazy.LazyRow(
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(com.toust.tosito.ui.viewmodel.TimeFilter.values()) { tf ->
                    FilterChip(
                        selected = timeFilter == tf,
                        onClick = { vm.setTimeFilter(tf) },
                        label = { Text(tf.label) }
                    )
                }
            }
        }

        if (!isLoading && txs.isNotEmpty()) {
            item {
                val expenses = txs.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
                val incomes = txs.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
                
                Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = SCard2),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(SBorder, Color.Transparent)))) {
                    Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        if (filterType == null || filterType == TransactionType.EXPENSE) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("📉 Gastos", style = MaterialTheme.typography.labelMedium.copy(color = SMuted))
                                Text("%.2f €".format(expenses), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = SRed))
                            }
                        }
                        if (filterType == null || filterType == TransactionType.INCOME) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("📈 Ingresos", style = MaterialTheme.typography.labelMedium.copy(color = SMuted))
                                Text("%.2f €".format(incomes), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold, color = SGreen))
                            }
                        }
                    }
                }
            }
        }

        if (isLoading) {
            item { repeat(4) { Box(modifier = Modifier.fillMaxWidth().height(72.dp).padding(horizontal = 16.dp, vertical = 4.dp).clip(RoundedCornerShape(14.dp)).background(SCard)) } }
        } else if (txs.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(48.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("💳", fontSize = 52.sp)
                    Text("Sin transacciones", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = SText))
                    Text("Añade tu primera transacción", style = MaterialTheme.typography.bodyMedium.copy(color = SMuted))
                }
            }
        } else {
            items(txs, key = { it.id }) { tx ->
                TransactionCard(tx = tx, onEdit = { vm.showEditTransactionDialog(tx) }, onDelete = { vm.deleteTransaction(tx) })
            }
        }
    }
}

@Composable
fun TransactionCard(tx: Transaction, onEdit: () -> Unit, onDelete: () -> Unit, compact: Boolean = false) {
    val isIncome = tx.type == TransactionType.INCOME
    val color = if (isIncome) SGreen else categoryColor(tx.category)

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = SCard2),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(color.copy(0.3f), color.copy(0.05f))))) {
        Row(modifier = Modifier.padding(if (compact) 12.dp else 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(color.copy(0.14f)), contentAlignment = Alignment.Center) {
                Text(tx.category.emoji, fontSize = 20.sp)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(tx.description.ifBlank { tx.category.label },
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    SSmallBadge(tx.category.label, color)
                    if (tx.date.isNotBlank()) Text(tx.date.takeLast(5), style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                }
            }
            Text(
                "${if (isIncome) "+" else "-"}%.2f €".format(tx.amount),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold,
                    color = if (isIncome) SGreen else SRed)
            )
            if (!compact) {
                Column {
                    IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) { Icon(Icons.Default.Edit, null, tint = SMuted, modifier = Modifier.size(14.dp)) }
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) { Icon(Icons.Default.Delete, null, tint = SRed.copy(0.7f), modifier = Modifier.size(14.dp)) }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: OBJETIVOS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun GoalsTab(vm: SavingsViewModel) {
    val goals     by vm.goals.collectAsState()
    val isLoading by vm.isLoading.collectAsState()
    val totalSaved  = vm.getTotalSaved()
    val totalTarget = vm.getTotalTarget()

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 120.dp)) {
        if (goals.isNotEmpty()) {
            item {
                Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
                    Box(modifier = Modifier.fillMaxWidth().background(BlueGrad).padding(20.dp)) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("Total ahorrado", style = MaterialTheme.typography.labelLarge.copy(color = Color.White.copy(0.8f)))
                            Text("%.2f €".format(totalSaved), style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                            val globalProgress = if (totalTarget > 0) (totalSaved / totalTarget).toFloat() else 0f
                            val animGlobal by animateFloatAsState(globalProgress, spring(Spring.DampingRatioMediumBouncy), label = "")
                            LinearProgressIndicator(progress = { animGlobal }, modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
                                color = Color.White, trackColor = Color.White.copy(0.2f))
                            Text("de %.2f € objetivo total".format(totalTarget), style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.7f)))
                        }
                    }
                }
            }
        }

        if (isLoading) {
            item { repeat(2) { Box(modifier = Modifier.fillMaxWidth().height(130.dp).padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(20.dp)).background(SCard)) } }
        } else if (goals.isEmpty()) {
            item {
                Column(modifier = Modifier.fillMaxWidth().padding(48.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("🎯", fontSize = 52.sp)
                    Text("Sin objetivos", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = SText))
                    Text("Crea tu primer objetivo de ahorro", style = MaterialTheme.typography.bodyMedium.copy(color = SMuted), textAlign = TextAlign.Center)
                    Button(onClick = { vm.showCreateGoalDialog() }, colors = ButtonDefaults.buttonColors(containerColor = SPurple), shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(6.dp))
                        Text("Crear objetivo")
                    }
                }
            }
        } else {
            val active    = goals.filter { !it.isCompleted }
            val completed = goals.filter {  it.isCompleted }
            if (active.isNotEmpty()) {
                item { SectionTitle("🎯 En curso") }
                items(active, key = { it.id }) { goal -> GoalCard(goal = goal, vm = vm) }
            }
            if (completed.isNotEmpty()) {
                item { SectionTitle("✅ Completados") }
                items(completed, key = { it.id }) { goal -> GoalCard(goal = goal, vm = vm) }
            }
        }
    }
}

@Composable
fun GoalCard(goal: SavingsGoal, vm: SavingsViewModel) {
    val progress by animateFloatAsState(goal.progress.toFloat(), spring(Spring.DampingRatioMediumBouncy), label = "")
    val accentColor = if (goal.isCompleted) SGreen else SPurple

    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = SCard),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(accentColor.copy(0.4f), accentColor.copy(0.05f))))) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(50.dp).clip(RoundedCornerShape(16.dp)).background(accentColor.copy(0.15f)), contentAlignment = Alignment.Center) {
                    Text(if (goal.isCompleted) "✅" else goal.emoji, fontSize = 24.sp)
                }
                Spacer(Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(goal.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = SText), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    if (goal.targetDate.isNotBlank()) Text("Meta: ${goal.targetDate}", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                }
                Column(horizontalAlignment = Alignment.End) {
                    IconButton(onClick = { vm.showEditGoalDialog(goal) }, modifier = Modifier.size(28.dp)) { Icon(Icons.Default.Edit, null, tint = SMuted, modifier = Modifier.size(14.dp)) }
                    IconButton(onClick = { vm.deleteGoal(goal) }, modifier = Modifier.size(28.dp)) { Icon(Icons.Default.Delete, null, tint = SRed.copy(0.7f), modifier = Modifier.size(14.dp)) }
                }
            }
            // Barra de progreso circular + valores
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                // Mini gráfico circular
                Box(modifier = Modifier.size(64.dp), contentAlignment = Alignment.Center) {
                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(color = accentColor.copy(0.1f))
                        drawArc(color = accentColor, startAngle = -90f, sweepAngle = 360f * progress,
                            useCenter = false, style = Stroke(width = 8f, cap = StrokeCap.Round))
                    }
                    Text("${(progress * 100).toInt()}%",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.ExtraBold, color = accentColor))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Ahorrado", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                        Text("%.2f €".format(goal.currentAmount), style = MaterialTheme.typography.labelMedium.copy(color = SGreen, fontWeight = FontWeight.Bold))
                    }
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                        color = accentColor, trackColor = accentColor.copy(0.12f))
                    Spacer(Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Objetivo", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                        Text("%.2f €".format(goal.targetAmount), style = MaterialTheme.typography.labelMedium.copy(color = SText, fontWeight = FontWeight.Bold))
                    }
                }
            }
            if (!goal.isCompleted) {
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                    .background(Brush.linearGradient(listOf(SPurple, SBlue))).clickable { vm.showAddToGoalDialog(goal) }.padding(12.dp),
                    contentAlignment = Alignment.Center) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Text("Añadir ahorro", style = MaterialTheme.typography.labelLarge.copy(color = Color.White, fontWeight = FontWeight.Bold))
                        Spacer(Modifier.weight(1f))
                        Text("Faltan %.2f €".format(goal.remaining), style = MaterialTheme.typography.labelSmall.copy(color = Color.White.copy(0.8f)))
                    }
                }
            }
        }
    }
}

@Composable
fun GoalCardCompact(goal: SavingsGoal, onDeposit: () -> Unit) {
    val progress by animateFloatAsState(goal.progress.toFloat(), spring(Spring.DampingRatioMediumBouncy), label = "")
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = SCard2),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(SPurple.copy(0.3f), SPurple.copy(0.05f))))) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(goal.emoji, fontSize = 24.sp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(goal.name, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SText))
                LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).height(5.dp).clip(CircleShape),
                    color = SPurple, trackColor = SPurple.copy(0.12f))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("%.2f €".format(goal.currentAmount), style = MaterialTheme.typography.labelSmall.copy(color = SGreen))
                    Text("%.2f €".format(goal.targetAmount), style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                }
            }
            Spacer(Modifier.width(8.dp))
            IconButton(onClick = onDeposit) { Icon(Icons.Default.Add, null, tint = SPurple) }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: TRANSACCIÓN
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionDialog(tx: Transaction, onDismiss: () -> Unit, onSave: (Transaction) -> Unit) {
    var type        by remember { mutableStateOf(tx.type) }
    var category    by remember { mutableStateOf(tx.category) }
    var amount      by remember { mutableStateOf(if (tx.amount > 0) tx.amount.toString() else "") }
    var description by remember { mutableStateOf(tx.description) }
    var date        by remember { mutableStateOf(tx.date) }
    var showCatMenu by remember { mutableStateOf(false) }
    val categories  = if (type == TransactionType.INCOME) incomeCategories else expenseCategories

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = SCard),
            border = CardDefaults.outlinedCardBorder()) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(if (tx.id.isEmpty()) "➕ Nueva transacción" else "✏️ Editar transacción",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = SText))
                // Tipo
                Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(SCard2).padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    TransactionType.values().forEach { t ->
                        val sel = type == t
                        Box(modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                            .background(if (sel && t == TransactionType.INCOME) GreenGrad else if (sel) RedGrad else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent)))
                            .clickable { type = t; category = if (t == TransactionType.INCOME) TransactionCategory.SALARIO else TransactionCategory.OTRO_GASTO }
                            .padding(vertical = 10.dp), contentAlignment = Alignment.Center) {
                            Text("${t.emoji} ${t.label}", style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = if (sel) FontWeight.ExtraBold else FontWeight.Normal,
                                color = if (sel) Color.White else SMuted))
                        }
                    }
                }
                // Importe
                OutlinedTextField(value = amount, onValueChange = { amount = it },
                    label = { Text("Importe (€)") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Text("€", style = MaterialTheme.typography.titleMedium.copy(color = if (type == TransactionType.INCOME) SGreen else SRed, fontWeight = FontWeight.Bold)) })
                // Categoría
                Box(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                        .background(SCard2).border(1.dp, SBorder, RoundedCornerShape(12.dp))
                        .clickable { showCatMenu = true }.padding(14.dp)) {
                        Column {
                            Text("Categoría", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                            Text("${category.emoji} ${category.label}", style = MaterialTheme.typography.bodyMedium.copy(color = categoryColor(category), fontWeight = FontWeight.Bold))
                        }
                    }
                    DropdownMenu(expanded = showCatMenu, onDismissRequest = { showCatMenu = false }) {
                        categories.forEach { c -> DropdownMenuItem(text = { Text("${c.emoji} ${c.label}") }, onClick = { category = c; showCatMenu = false }) }
                    }
                }
                // Descripción y fecha
                OutlinedTextField(value = description, onValueChange = { description = it },
                    label = { Text("Descripción (opcional)") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp))
                OutlinedTextField(value = date, onValueChange = { date = it },
                    label = { Text("Fecha (yyyy-MM-dd)") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp),
                    placeholder = { Text("2025-02-23", color = SMuted) })
                // Botones
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = SMuted) }
                    Button(onClick = {
                        val amt = amount.toDoubleOrNull() ?: return@Button
                        if (amt > 0) onSave(tx.copy(type = type, category = category, amount = amt, description = description.trim(), date = date.trim()))
                    }, enabled = amount.toDoubleOrNull()?.let { it > 0 } == true,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = if (type == TransactionType.INCOME) SGreen else SRed),
                        shape = RoundedCornerShape(12.dp)) {
                        Text("Guardar", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: OBJETIVO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun GoalDialog(goal: SavingsGoal?, onDismiss: () -> Unit, onSave: (SavingsGoal) -> Unit) {
    val emojiOptions = listOf("🎯","✈️","🏠","🚗","💻","📱","🎓","💍","🏖️","🎸","🛒","💊","🌍","🏋️")
    val colorOptions = listOf("#8B5CF6","#3B82F6","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6","#F97316")

    var name          by remember(goal) { mutableStateOf(goal?.name ?: "") }
    var targetAmount  by remember(goal) { mutableStateOf(goal?.targetAmount?.toString() ?: "") }
    var currentAmount by remember(goal) { mutableStateOf(goal?.currentAmount?.toString() ?: "") }
    var targetDate    by remember(goal) { mutableStateOf(goal?.targetDate ?: "") }
    var selectedEmoji by remember(goal) { mutableStateOf(goal?.emoji ?: "🎯") }
    var selectedColor by remember(goal) { mutableStateOf(goal?.color ?: "#8B5CF6") }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = SCard),
            border = CardDefaults.outlinedCardBorder()) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(if (goal?.id?.isNotEmpty() == true) "✏️ Editar objetivo" else "🎯 Nuevo objetivo",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = SText))
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre del objetivo") },
                    modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = targetAmount, onValueChange = { targetAmount = it },
                        label = { Text("Objetivo (€)") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    OutlinedTextField(value = currentAmount, onValueChange = { currentAmount = it },
                        label = { Text("Ahorrado (€)") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                }
                OutlinedTextField(value = targetDate, onValueChange = { targetDate = it },
                    label = { Text("Fecha objetivo (yyyy-MM-dd)") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp))
                // Emojis
                Text("Icono", style = MaterialTheme.typography.labelMedium.copy(color = SMuted))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    emojiOptions.take(7).forEach { emoji ->
                        Box(modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp))
                            .background(if (selectedEmoji == emoji) SPurple.copy(0.3f) else SCard2)
                            .border(1.dp, if (selectedEmoji == emoji) SPurple else SBorder, RoundedCornerShape(10.dp))
                            .clickable { selectedEmoji = emoji }, contentAlignment = Alignment.Center) {
                            Text(emoji, fontSize = 18.sp)
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    emojiOptions.drop(7).forEach { emoji ->
                        Box(modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp))
                            .background(if (selectedEmoji == emoji) SPurple.copy(0.3f) else SCard2)
                            .border(1.dp, if (selectedEmoji == emoji) SPurple else SBorder, RoundedCornerShape(10.dp))
                            .clickable { selectedEmoji = emoji }, contentAlignment = Alignment.Center) {
                            Text(emoji, fontSize = 18.sp)
                        }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = SMuted) }
                    Button(onClick = {
                        val target = targetAmount.toDoubleOrNull() ?: return@Button
                        if (name.isNotBlank() && target > 0) {
                            onSave(SavingsGoal(id = goal?.id ?: "", name = name.trim(),
                                targetAmount = target, currentAmount = currentAmount.toDoubleOrNull() ?: 0.0,
                                targetDate = targetDate.trim(), emoji = selectedEmoji,
                                color = selectedColor, createdAt = goal?.createdAt))
                        }
                    }, enabled = name.isNotBlank() && (targetAmount.toDoubleOrNull() ?: 0.0) > 0,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = SPurple), shape = RoundedCornerShape(12.dp)) {
                        Text("Guardar", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO: AÑADIR AHORRO A OBJETIVO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun DepositDialog(goal: SavingsGoal, onDismiss: () -> Unit, onDeposit: (Double) -> Unit) {
    var amount by remember { mutableStateOf("") }
    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = SCard),
            border = CardDefaults.outlinedCardBorder()) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("💰 Añadir ahorro", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = SText))
                Text("${goal.emoji} ${goal.name}", style = MaterialTheme.typography.bodyLarge.copy(color = SPurple, fontWeight = FontWeight.Bold))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("Ahorrado", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                        Text("%.2f €".format(goal.currentAmount), style = MaterialTheme.typography.titleMedium.copy(color = SGreen, fontWeight = FontWeight.Bold))
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Faltan", style = MaterialTheme.typography.labelSmall.copy(color = SMuted))
                        Text("%.2f €".format(goal.remaining), style = MaterialTheme.typography.titleMedium.copy(color = SRed, fontWeight = FontWeight.Bold))
                    }
                }
                OutlinedTextField(value = amount, onValueChange = { amount = it },
                    label = { Text("Cantidad a añadir (€)") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Text("€", style = MaterialTheme.typography.titleMedium.copy(color = SPurple, fontWeight = FontWeight.Bold)) })
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancelar", color = SMuted) }
                    Button(onClick = { amount.toDoubleOrNull()?.let { if (it > 0) onDeposit(it) } },
                        enabled = (amount.toDoubleOrNull() ?: 0.0) > 0,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = SPurple), shape = RoundedCornerShape(12.dp)) {
                        Text("Añadir", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun SSmallBadge(text: String, color: Color) {
    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.14f)).padding(horizontal = 7.dp, vertical = 3.dp)) {
        Text(text, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.SemiBold))
    }
}

@Composable
fun SubscriptionsTab(vm: SavingsViewModel) {
    val recurring by vm.recurring.collectAsState()
    
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), contentPadding = PaddingValues(bottom = 100.dp, top = 16.dp)) {
        item {
            Text("Suscripciones y Gastos Fijos", style = MaterialTheme.typography.titleLarge.copy(color = SText, fontWeight = FontWeight.Bold))
            Text("Se cobrarán automáticamente cada mes el día que indiques.", style = MaterialTheme.typography.bodySmall.copy(color = SMuted))
            Spacer(Modifier.height(16.dp))
        }

        if (recurring.isEmpty()) {
            item {
                Text("No tienes ninguna suscripción registrada.", style = MaterialTheme.typography.bodyMedium.copy(color = SMuted), modifier = Modifier.padding(16.dp))
            }
        } else {
            items(recurring) { sub ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = SCard2),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(if (sub.type == TransactionType.INCOME) SGreen.copy(0.2f) else SRed.copy(0.2f)), contentAlignment = Alignment.Center) {
                            Text(sub.category.emoji, fontSize = 20.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(sub.name, style = MaterialTheme.typography.bodyLarge.copy(color = SText, fontWeight = FontWeight.Bold))
                            Text("Día ${sub.dayOfMonth} de cada mes", style = MaterialTheme.typography.bodySmall.copy(color = SMuted))
                        }
                        Text("${if (sub.type == TransactionType.INCOME) "+" else "-"}${sub.amount}€", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = if (sub.type == TransactionType.INCOME) SGreen else SRed))
                        IconButton(onClick = { vm.deleteRecurring(sub.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = SRed)
                        }
                    }
                }
            }
        }
        
        item {
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    vm.saveRecurring(com.toust.tosito.data.model.RecurringTransaction(
                        userId = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "",
                        name = "Suscripción Nueva",
                        amount = 10.0,
                        type = TransactionType.EXPENSE,
                        category = com.toust.tosito.data.model.TransactionCategory.SUSCRIPCION,
                        dayOfMonth = 1
                    ))
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = STeal),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, null)
                Spacer(Modifier.width(8.dp))
                Text("Añadir suscripción rápida (Modificar luego)")
            }
        }
    }
}
