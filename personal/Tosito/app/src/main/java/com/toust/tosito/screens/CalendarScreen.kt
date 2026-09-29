package com.toust.tosito.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.toust.tosito.data.model.CalendarEvent
import com.toust.tosito.data.model.EventCategory
import com.toust.tosito.data.model.EventPriority
import com.toust.tosito.data.model.ScheduleBlock
import com.toust.tosito.data.model.ScheduleCategory
import com.toust.tosito.data.model.TimelineItem
import com.toust.tosito.data.model.minutesToTimeString
import com.toust.tosito.data.model.timeStringToMinutes
import com.toust.tosito.ui.viewmodel.CalendarViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

// ─────────────────────────────────────────────────────────────────────────────
// Paleta de colores
// ─────────────────────────────────────────────────────────────────────────────
private val CalBg      = Color(0xFF0F0C1D)
private val CalBg2     = Color(0xFF1A1730)
private val CalCard    = Color(0xFF22203A)
private val CalCard2   = Color(0xFF2A2640)
private val CalBorder  = Color(0xFF3D3860)
private val CalPurple  = Color(0xFF7C3AED)
private val CalIndigo  = Color(0xFF4F46E5)
private val CalViolet  = Color(0xFFA855F7)
private val CalBlue    = Color(0xFF2563EB)
private val CalTeal    = Color(0xFF0D9488)
private val CalGreen   = Color(0xFF16A34A)
private val CalAmber   = Color(0xFFD97706)
private val CalRed     = Color(0xFFDC2626)
private val CalMuted   = Color(0xFF9490C0)
private val CalText    = Color(0xFFE2E0F7)

private val BgGradient = Brush.verticalGradient(listOf(CalBg, CalBg2))
private val PurpleGrad = Brush.linearGradient(listOf(CalPurple, CalViolet))

fun categoryColor(cat: EventCategory): Color = when (cat) {
    EventCategory.PERSONAL -> CalPurple
    EventCategory.TRABAJO  -> CalBlue
    EventCategory.SALUD    -> CalTeal
    EventCategory.GYM      -> CalRed
    EventCategory.SOCIAL   -> CalGreen
    EventCategory.ESTUDIO  -> CalViolet
    EventCategory.OTRO     -> CalAmber
}

fun scheduleCategoryColor(cat: ScheduleCategory): Color = when (cat) {
    ScheduleCategory.TRABAJO  -> CalBlue
    ScheduleCategory.RUTINA   -> CalIndigo
    ScheduleCategory.DESCANSO -> CalTeal
    ScheduleCategory.COMIDA   -> CalAmber
    ScheduleCategory.GYM      -> CalRed
    ScheduleCategory.ESTUDIO  -> CalViolet
    ScheduleCategory.PERSONAL -> CalPurple
    ScheduleCategory.OTRO     -> CalMuted
}

fun priorityColor(p: EventPriority): Color = when (p) {
    EventPriority.HIGH   -> CalRed
    EventPriority.MEDIUM -> CalAmber
    EventPriority.LOW    -> CalGreen
}

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CalendarScreen() {
    val vm: CalendarViewModel = viewModel()

    val currentMonth    by vm.currentMonth.collectAsState()
    val selectedDate    by vm.selectedDate.collectAsState()
    val isLoading       by vm.isLoading.collectAsState()
    val activeTab       by vm.activeTab.collectAsState()
    val showEventDialog by vm.showEventDialog.collectAsState()
    val editingEvent    by vm.editingEvent.collectAsState()
    val showBlockDialog by vm.showBlockDialog.collectAsState()
    val editingBlock    by vm.editingBlock.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BgGradient)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Header ──────────────────────────────────────────────────────
            val monthName = currentMonth.month.getDisplayName(TextStyle.FULL, Locale("es", "ES"))
                .replaceFirstChar { it.uppercase() }
            val title = "$monthName ${currentMonth.year}"

            CalendarTopBar(
                title      = title,
                onPrevious = { vm.goToPreviousMonth() },
                onNext     = { vm.goToNextMonth() },
                onToday    = { vm.goToToday() }
            )

            // ── Tabs ────────────────────────────────────────────────────────
            TabRow(
                activeTab = activeTab,
                onTabSelected = { vm.setTab(it) }
            )

            // ── Contenido ───────────────────────────────────────────────────
            AnimatedContent(
                targetState = activeTab,
                transitionSpec = { fadeIn(tween(200)) togetherWith fadeOut(tween(200)) },
                label = "tab_content"
            ) { tab ->
                when (tab) {
                    0 -> CalendarTabContent(vm = vm, selectedDate = selectedDate, isLoading = isLoading)
                    1 -> TimelineTabContent(vm = vm, selectedDate = selectedDate, isLoading = isLoading)
                    else -> {}
                }
            }
        }

        // ── FAB contextual ──────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp),
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (activeTab == 1) {
                // En timeline: crear bloque de horario
                SmallFloatingActionButton(
                    onClick = { vm.showCreateBlockDialog() },
                    containerColor = CalIndigo,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Schedule, "Nuevo bloque horario", tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }
            // Siempre: crear evento
            FloatingActionButton(
                onClick  = { vm.showCreateEventDialog() },
                shape    = CircleShape,
                containerColor = CalPurple,
                elevation = FloatingActionButtonDefaults.elevation(6.dp)
            ) {
                Icon(Icons.Default.Add, "Nuevo evento", tint = Color.White)
            }
        }
    }

    // ── Diálogos ────────────────────────────────────────────────────────────
    if (showEventDialog) {
        EventDialog(
            event     = editingEvent,
            onDismiss = { vm.hideEventDialog() },
            onSave    = { vm.saveEvent(it) }
        )
    }
    if (showBlockDialog) {
        ScheduleBlockDialog(
            block     = editingBlock,
            onDismiss = { vm.hideBlockDialog() },
            onSave    = { vm.saveBlock(it) }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CalendarTopBar(title: String, onPrevious: () -> Unit, onNext: () -> Unit, onToday: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 12.dp, top = 20.dp, bottom = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("Calendario", style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.ExtraBold, color = Color.White, fontSize = 28.sp))
            Text(title, style = MaterialTheme.typography.bodyMedium.copy(color = CalMuted))
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(CalPurple.copy(0.18f))
                .clickable { onToday() }
                .padding(horizontal = 12.dp, vertical = 7.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Today, null, tint = CalPurple, modifier = Modifier.size(15.dp))
                    Text("Hoy", color = CalPurple, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
            IconButton(onClick = onPrevious) { Icon(Icons.Default.ArrowBack, null, tint = CalText) }
            IconButton(onClick = onNext) { Icon(Icons.Default.ArrowForward, null, tint = CalText) }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TabRow(activeTab: Int, onTabSelected: (Int) -> Unit) {
    val tabs = listOf("📅 Calendario", "⏱ Horario")
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(CalCard)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        tabs.forEachIndexed { index, label ->
            val selected = activeTab == index
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (selected) PurpleGrad else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent)))
                    .clickable { onTabSelected(index) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Normal,
                        color = if (selected) Color.White else CalMuted
                    )
                )
            }
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 0: CALENDARIO MENSUAL + LISTA DEL DÍA
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CalendarTabContent(vm: CalendarViewModel, selectedDate: LocalDate, isLoading: Boolean) {
    val monthEvents  by vm.monthEvents.collectAsState()
    val dayEvents    by vm.selectedDayEvents.collectAsState()
    val (done, total) = vm.getCompletionStats()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        item { CalendarGrid(vm = vm, selectedDate = selectedDate) }

        item {
            AnimatedVisibility(
                visible = total > 0,
                enter = fadeIn() + expandVertically(),
                exit  = fadeOut() + shrinkVertically()
            ) {
                DayProgressBar(done = done, total = total)
            }
        }

        item {
            DayEventsHeader(
                date  = selectedDate,
                count = dayEvents.size,
                onAdd = { vm.showCreateEventDialog(selectedDate) }
            )
        }

        if (isLoading) {
            item { LoadingPlaceholder() }
        } else if (dayEvents.isEmpty()) {
            item {
                EmptyDayState(
                    message = "No hay eventos para este día",
                    onAdd = { vm.showCreateEventDialog(selectedDate) }
                )
            }
        } else {
            items(dayEvents, key = { it.id }) { event ->
                EventCard(
                    event    = event,
                    onToggle = { vm.toggleCompleted(event) },
                    onEdit   = { vm.showEditEventDialog(event) },
                    onDelete = { vm.deleteEvent(event) }
                )
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: LÍNEA DE TIEMPO DIARIA
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TimelineTabContent(vm: CalendarViewModel, selectedDate: LocalDate, isLoading: Boolean) {
    val timelineItems  by vm.timelineItems.collectAsState()
    val dayEvents      by vm.selectedDayEvents.collectAsState()
    val scheduleBlocks by vm.dayScheduleBlocks.collectAsState()

    // Hora actual en minutos (para indicador "ahora")
    val now = LocalTime.now()
    val nowMinutes = now.hour * 60 + now.minute
    val isToday = selectedDate == LocalDate.now()

    // Días de semana para el selector rápido de día
    val weekDays = (0..6).map { selectedDate.minusDays(selectedDate.dayOfWeek.value.toLong() - 1).plusDays(it.toLong()) }

    val scrollState = rememberScrollState()

    // Scroll automático a la hora actual si es hoy
    LaunchedEffect(isToday) {
        if (isToday) {
            val scrollY = ((nowMinutes - 360) * 3).coerceAtLeast(0)
            scrollState.scrollTo(scrollY)
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Selector de día de la semana ─────────────────────────────────
        WeekDaySelector(
            weekDays = weekDays,
            selectedDate = selectedDate,
            onSelect = { vm.selectDate(it) },
            hasEvents = { vm.hasEventsOnDate(it) }
        )

        // ── Resumen rápido ───────────────────────────────────────────────
        if (!isLoading) {
            TimelineSummary(
                eventCount = dayEvents.size,
                blockCount = scheduleBlocks.size,
                completedCount = dayEvents.count { it.isCompleted }
            )
        }

        // ── Línea de tiempo ──────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp)
                .padding(bottom = 140.dp)
        ) {
            val startHour = 6
            val endHour   = 24

            (startHour until endHour).forEach { hour ->
                val hourStartMinutes = hour * 60
                val hourEndMinutes   = hourStartMinutes + 60

                // Fila de hora
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(IntrinsicSize.Min),
                    verticalAlignment = Alignment.Top
                ) {
                    // Etiqueta de hora
                    Box(
                        modifier = Modifier.width(52.dp).padding(top = 2.dp),
                        contentAlignment = Alignment.TopEnd
                    ) {
                        Text(
                            text = "%02d:00".format(hour),
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = if (isToday && hour == now.hour) CalPurple else CalMuted.copy(0.7f),
                                fontWeight = if (isToday && hour == now.hour) FontWeight.Bold else FontWeight.Normal
                            )
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        // Línea separadora de hora
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(
                                    if (isToday && hour == now.hour) CalPurple.copy(0.5f)
                                    else CalBorder.copy(0.4f)
                                )
                        )

                        // Indicador "ahora"
                        if (isToday && hour == now.hour) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                val minuteFraction = now.minute / 60f
                                Spacer(modifier = Modifier.height((minuteFraction * 64).dp))
                                Box(modifier = Modifier
                                    .size(8.dp).clip(CircleShape)
                                    .background(CalPurple))
                                Box(modifier = Modifier
                                    .fillMaxWidth().height(2.dp)
                                    .background(CalPurple.copy(0.5f)))
                            }
                        }

                        // Items de la timeline en esta franja horaria
                        val itemsInHour = timelineItems.filter { item ->
                            item.startMinutes >= hourStartMinutes && item.startMinutes < hourEndMinutes
                        }

                        itemsInHour.forEach { item ->
                            Spacer(modifier = Modifier.height(4.dp))
                            when (item) {
                                is TimelineItem.Block -> TimelineBlockCard(item.block, onEdit = { vm.showEditBlockDialog(item.block) }, onDelete = { vm.deleteBlock(item.block) })
                                is TimelineItem.Event -> TimelineEventCard(item.event, onToggle = { vm.toggleCompleted(item.event) }, onEdit = { vm.showEditEventDialog(item.event) }, onDelete = { vm.deleteEvent(item.event) })
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                        }

                        // Espacio de la franja si no hay items
                        if (itemsInHour.isEmpty()) {
                            Spacer(modifier = Modifier.height(56.dp))
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR DE DÍA DE SEMANA
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun WeekDaySelector(weekDays: List<LocalDate>, selectedDate: LocalDate, onSelect: (LocalDate) -> Unit, hasEvents: (LocalDate) -> Boolean) {
    val today = LocalDate.now()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        weekDays.forEach { day ->
            val isSelected = day == selectedDate
            val isToday    = day == today
            val dow = day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale("es", "ES"))
                .take(2).uppercase()
            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        when {
                            isSelected -> PurpleGrad
                            isToday    -> Brush.linearGradient(listOf(CalPurple.copy(0.15f), CalViolet.copy(0.1f)))
                            else       -> Brush.linearGradient(listOf(CalCard, CalCard))
                        }
                    )
                    .border(
                        width  = if (isToday && !isSelected) 1.dp else 0.dp,
                        color  = if (isToday && !isSelected) CalPurple else Color.Transparent,
                        shape  = RoundedCornerShape(12.dp)
                    )
                    .clickable { onSelect(day) }
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(dow, style = MaterialTheme.typography.labelSmall.copy(
                    color = if (isSelected) Color.White.copy(0.8f) else CalMuted, fontSize = 10.sp))
                Text(day.dayOfMonth.toString(), style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isSelected) Color.White else if (isToday) CalPurple else CalText
                ))
                // Dot de eventos
                Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(
                    if (hasEvents(day)) (if (isSelected) Color.White.copy(0.8f) else CalPurple)
                    else Color.Transparent
                ))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUMEN RÁPIDO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TimelineSummary(eventCount: Int, blockCount: Int, completedCount: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        SummaryChip("\uD83D\uDCC5 $eventCount eventos", CalPurple)
        SummaryChip("⏱ $blockCount bloques", CalIndigo)
        if (eventCount > 0) SummaryChip("✅ $completedCount / $eventCount", CalGreen)
    }
}

@Composable
fun SummaryChip(label: String, color: Color) {
    Box(modifier = Modifier
        .clip(RoundedCornerShape(20.dp))
        .background(color.copy(0.15f))
        .border(1.dp, color.copy(0.3f), RoundedCornerShape(20.dp))
        .padding(horizontal = 12.dp, vertical = 5.dp)
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETAS EN LÍNEA DE TIEMPO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun TimelineBlockCard(block: ScheduleBlock, onEdit: () -> Unit, onDelete: () -> Unit) {
    val color = scheduleCategoryColor(block.category)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(color.copy(0.08f))
            .border(1.dp, color.copy(0.25f), RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier
            .width(3.dp).height(36.dp)
            .clip(RoundedCornerShape(2.dp)).background(color))
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(block.category.emoji, fontSize = 12.sp)
                Text(block.title, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold, color = color))
            }
            Text(
                "${block.startTime} → ${block.endTime}",
                style = MaterialTheme.typography.labelSmall.copy(color = CalMuted)
            )
        }
        // Icono identificador de bloque
        Box(modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(0.15f))
            .padding(horizontal = 6.dp, vertical = 3.dp)
        ) { Text("Rutina", style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold)) }
        Spacer(modifier = Modifier.width(4.dp))
        IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
            Icon(Icons.Default.Edit, null, tint = CalMuted, modifier = Modifier.size(14.dp))
        }
        IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
            Icon(Icons.Default.Delete, null, tint = CalRed.copy(0.7f), modifier = Modifier.size(14.dp))
        }
    }
}

@Composable
fun TimelineEventCard(event: CalendarEvent, onToggle: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
    val color = categoryColor(event.category)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(CalCard2)
            .border(1.dp, color.copy(0.3f), RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier
            .width(3.dp).height(44.dp)
            .clip(RoundedCornerShape(2.dp)).background(color))
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(event.category.emoji, fontSize = 12.sp)
                Text(event.title,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold, color = if (event.isCompleted) CalMuted else CalText,
                        textDecoration = if (event.isCompleted) TextDecoration.LineThrough else TextDecoration.None
                    ),
                    maxLines = 1, overflow = TextOverflow.Ellipsis
                )
            }
            if (event.description.isNotBlank()) {
                Text(event.description, style = MaterialTheme.typography.labelSmall.copy(color = CalMuted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            val time = if (event.endTime.isNotBlank()) "${event.startTime} → ${event.endTime}" else event.startTime
            if (time.isNotBlank()) Text(time, style = MaterialTheme.typography.labelSmall.copy(color = color))
        }
        // Check
        Box(modifier = Modifier
            .size(30.dp).clip(CircleShape)
            .background(if (event.isCompleted) CalGreen else CalCard)
            .border(2.dp, if (event.isCompleted) CalGreen else CalBorder, CircleShape)
            .clickable { onToggle() },
            contentAlignment = Alignment.Center
        ) {
            if (event.isCompleted) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(16.dp))
        }
        IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
            Icon(Icons.Default.Edit, null, tint = CalMuted, modifier = Modifier.size(14.dp))
        }
        IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
            Icon(Icons.Default.Delete, null, tint = CalRed.copy(0.7f), modifier = Modifier.size(14.dp))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CUADRÍCULA MENSUAL
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun CalendarGrid(vm: CalendarViewModel, selectedDate: LocalDate) {
    val dayLabels = listOf("L", "M", "X", "J", "V", "S", "D")
    val days = vm.getDaysInMonth()
    val today = LocalDate.now()

    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Row(modifier = Modifier.fillMaxWidth()) {
            dayLabels.forEach { lbl ->
                Text(lbl, modifier = Modifier.weight(1f), textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelMedium.copy(color = CalPurple, fontWeight = FontWeight.ExtraBold))
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        days.chunked(7).forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                for (i in 0..6) {
                    val day = week.getOrNull(i)
                    Box(modifier = Modifier.weight(1f)) {
                        if (day != null) {
                            DayCell(
                                date       = day,
                                isSelected = day == selectedDate,
                                isToday    = day == today,
                                hasEvents  = vm.hasEventsOnDate(day),
                                hasBlocks  = vm.hasBlocksOnDate(day),
                                eventCount = vm.getEventCountForDate(day),
                                onClick    = { vm.selectDate(day) }
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(2.dp))
        }
    }
}

@Composable
fun DayCell(
    date: LocalDate, isSelected: Boolean, isToday: Boolean,
    hasEvents: Boolean, hasBlocks: Boolean, eventCount: Int,
    onClick: () -> Unit
) {
    val scale by animateFloatAsState(
        targetValue = if (isSelected) 1f else 0.93f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "day_scale"
    )
    val bg = when {
        isSelected -> PurpleGrad
        isToday    -> Brush.radialGradient(listOf(CalPurple.copy(0.22f), CalPurple.copy(0.08f)))
        else       -> Brush.radialGradient(listOf(Color.Transparent, Color.Transparent))
    }

    Column(
        modifier = Modifier
            .aspectRatio(1f)
            .scale(scale)
            .clip(CircleShape)
            .background(bg)
            .border(
                width  = if (isToday && !isSelected) 1.5.dp else 0.dp,
                color  = if (isToday && !isSelected) CalPurple else Color.Transparent,
                shape  = CircleShape
            )
            .clickable { onClick() },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text  = date.dayOfMonth.toString(),
            style = MaterialTheme.typography.bodySmall.copy(
                fontWeight = if (isSelected || isToday) FontWeight.ExtraBold else FontWeight.Normal,
                color = when { isSelected -> Color.White; isToday -> CalPurple; else -> CalText.copy(0.85f) }
            )
        )
        Row(modifier = Modifier.height(5.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            if (hasEvents) Box(modifier = Modifier.size(4.dp).clip(CircleShape)
                .background(if (isSelected) Color.White.copy(0.85f) else CalPurple))
            if (hasBlocks && !hasEvents) Box(modifier = Modifier.size(4.dp).clip(CircleShape)
                .background(if (isSelected) Color.White.copy(0.6f) else CalIndigo.copy(0.7f)))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun DayProgressBar(done: Int, total: Int) {
    val progress = if (total > 0) done.toFloat() / total else 0f
    val anim by animateFloatAsState(
        targetValue = progress,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "prog"
    )
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = CalCard),
        border = androidx.compose.foundation.BorderStroke(1.dp, CalBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Tareas del día", style = MaterialTheme.typography.bodySmall.copy(color = CalMuted))
                Text("$done / $total", style = MaterialTheme.typography.bodySmall.copy(color = CalPurple, fontWeight = FontWeight.Bold))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(CalBorder)) {
                Box(modifier = Modifier.fillMaxWidth(anim).fillMaxHeight()
                    .background(PurpleGrad))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER LISTA DE EVENTOS
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun DayEventsHeader(date: LocalDate, count: Int, onAdd: () -> Unit) {
    val dayName = date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale("es", "ES")).replaceFirstChar { it.uppercase() }
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(dayName, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
            Text(if (count == 0) "Sin eventos" else "$count evento${if (count != 1) "s" else ""}",
                style = MaterialTheme.typography.bodySmall.copy(color = CalMuted))
        }
        Box(modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(PurpleGrad)
            .clickable { onAdd() }
            .padding(horizontal = 14.dp, vertical = 9.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(15.dp))
                Text("Añadir", color = Color.White, style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE EVENTO (lista del día)
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun EventCard(event: CalendarEvent, onToggle: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
    val color = categoryColor(event.category)
    val alpha = if (event.isCompleted) 0.55f else 1f
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = CalCard2.copy(alpha)),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(0.28f))
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.width(4.dp).height(58.dp).clip(RoundedCornerShape(2.dp)).background(color))
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(event.category.emoji, fontSize = 13.sp)
                    Text(event.category.label, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.weight(1f))
                    PriorityBadge(event.priority)
                }
                Text(event.title, style = MaterialTheme.typography.bodyLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = if (event.isCompleted) CalMuted else CalText,
                    textDecoration = if (event.isCompleted) TextDecoration.LineThrough else TextDecoration.None
                ), maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (event.description.isNotBlank()) Text(event.description,
                    style = MaterialTheme.typography.bodySmall.copy(color = CalMuted), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (event.startTime.isNotBlank()) {
                    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.13f)).padding(horizontal = 8.dp, vertical = 3.dp)) {
                        Text(if (event.endTime.isNotBlank()) "⏰ ${event.startTime} → ${event.endTime}" else "⏰ ${event.startTime}",
                            style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Medium))
                    }
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Box(modifier = Modifier
                    .size(34.dp).clip(CircleShape)
                    .background(if (event.isCompleted) CalGreen else CalCard)
                    .border(2.dp, if (event.isCompleted) CalGreen else CalBorder, CircleShape)
                    .clickable { onToggle() }, contentAlignment = Alignment.Center
                ) {
                    if (event.isCompleted) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onEdit, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Edit, null, tint = CalMuted, modifier = Modifier.size(15.dp)) }
                IconButton(onClick = onDelete, modifier = Modifier.size(30.dp)) { Icon(Icons.Default.Delete, null, tint = CalRed.copy(0.75f), modifier = Modifier.size(15.dp)) }
            }
        }
    }
}

@Composable
fun PriorityBadge(priority: EventPriority) {
    val color = priorityColor(priority)
    Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(color.copy(0.14f)).padding(horizontal = 6.dp, vertical = 2.dp)) {
        Text(priority.label, style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO VACÍO / CARGANDO
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun EmptyDayState(message: String, onAdd: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("🗓️", fontSize = 46.sp, textAlign = TextAlign.Center)
        Text("Día libre", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = Color.White))
        Text(message, style = MaterialTheme.typography.bodyMedium.copy(color = CalMuted), textAlign = TextAlign.Center)
        Button(onClick = onAdd, colors = ButtonDefaults.buttonColors(containerColor = CalPurple), shape = RoundedCornerShape(14.dp)) {
            Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Crear evento")
        }
    }
}

@Composable
fun LoadingPlaceholder() {
    Column(modifier = Modifier.fillMaxWidth().padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        repeat(3) {
            Box(modifier = Modifier.fillMaxWidth().height(72.dp).clip(RoundedCornerShape(18.dp)).background(CalCard))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO DE EVENTO
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDialog(event: CalendarEvent?, onDismiss: () -> Unit, onSave: (CalendarEvent) -> Unit) {
    var title       by remember(event) { mutableStateOf(event?.title ?: "") }
    var description by remember(event) { mutableStateOf(event?.description ?: "") }
    var date        by remember(event) { mutableStateOf(event?.date ?: "") }
    var startTime   by remember(event) { mutableStateOf(event?.startTime ?: "") }
    var endTime     by remember(event) { mutableStateOf(event?.endTime ?: "") }
    var category    by remember(event) { mutableStateOf(event?.category ?: EventCategory.PERSONAL) }
    var priority    by remember(event) { mutableStateOf(event?.priority ?: EventPriority.MEDIUM) }
    var showCatMenu by remember { mutableStateOf(false) }
    var showPriMenu by remember { mutableStateOf(false) }
    val isEdit = event?.id?.isNotEmpty() == true

    Dialog(onDismissRequest = onDismiss) {
        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(26.dp),
            colors = CardDefaults.cardColors(containerColor = CalCard),
            border = androidx.compose.foundation.BorderStroke(1.dp, CalBorder)
        ) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(if (isEdit) "✏️ Editar evento" else "✨ Nuevo evento",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                OutlinedTextField(value = title, onValueChange = { title = it },
                    label = { Text("Título") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                    shape = RoundedCornerShape(12.dp))
                OutlinedTextField(value = description, onValueChange = { description = it },
                    label = { Text("Descripción (opcional)") }, modifier = Modifier.fillMaxWidth(),
                    maxLines = 2, shape = RoundedCornerShape(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = startTime, onValueChange = { startTime = it },
                        label = { Text("Inicio") }, placeholder = { Text("09:00") },
                        modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    OutlinedTextField(value = endTime, onValueChange = { endTime = it },
                        label = { Text("Fin") }, placeholder = { Text("10:00") },
                        modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                }
                // Categoría + Prioridad
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.weight(1f)) {
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(CalCard2).border(1.dp, CalBorder, RoundedCornerShape(12.dp))
                            .clickable { showCatMenu = true }.padding(12.dp)
                        ) {
                            Column {
                                Text("Categoría", style = MaterialTheme.typography.labelSmall.copy(color = CalMuted))
                                Spacer(Modifier.height(3.dp))
                                Text("${category.emoji} ${category.label}",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = categoryColor(category), fontWeight = FontWeight.Bold))
                            }
                        }
                        DropdownMenu(expanded = showCatMenu, onDismissRequest = { showCatMenu = false }) {
                            EventCategory.values().forEach { cat ->
                                DropdownMenuItem(text = { Text("${cat.emoji} ${cat.label}") }, onClick = { category = cat; showCatMenu = false })
                            }
                        }
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(CalCard2).border(1.dp, CalBorder, RoundedCornerShape(12.dp))
                            .clickable { showPriMenu = true }.padding(12.dp)
                        ) {
                            Column {
                                Text("Prioridad", style = MaterialTheme.typography.labelSmall.copy(color = CalMuted))
                                Spacer(Modifier.height(3.dp))
                                Text(priority.label,
                                    style = MaterialTheme.typography.bodyMedium.copy(color = priorityColor(priority), fontWeight = FontWeight.Bold))
                            }
                        }
                        DropdownMenu(expanded = showPriMenu, onDismissRequest = { showPriMenu = false }) {
                            EventPriority.values().forEach { p ->
                                DropdownMenuItem(text = { Text(p.label) }, onClick = { priority = p; showPriMenu = false })
                            }
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                        Text("Cancelar", color = CalMuted)
                    }
                    Button(onClick = {
                        if (title.trim().isNotBlank()) {
                            onSave(CalendarEvent(
                                id = event?.id ?: "", userId = event?.userId ?: "",
                                title = title.trim(), description = description.trim(),
                                date = date, startTime = startTime.trim(), endTime = endTime.trim(),
                                category = category, priority = priority,
                                isCompleted = event?.isCompleted ?: false
                            ))
                        }
                    }, modifier = Modifier.weight(1f), enabled = title.trim().isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = CalPurple),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text("Guardar", fontWeight = FontWeight.Bold) }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIÁLOGO DE BLOQUE DE HORARIO
// ─────────────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleBlockDialog(block: ScheduleBlock?, onDismiss: () -> Unit, onSave: (ScheduleBlock) -> Unit) {
    val allDays = listOf(1, 2, 3, 4, 5, 6, 7)
    val dayLabels = listOf("L", "M", "X", "J", "V", "S", "D")

    var title       by remember(block) { mutableStateOf(block?.title ?: "") }
    var startTime   by remember(block) { mutableStateOf(block?.startTime ?: "") }
    var endTime     by remember(block) { mutableStateOf(block?.endTime ?: "") }
    var category    by remember(block) { mutableStateOf(block?.category ?: ScheduleCategory.RUTINA) }
    var selectedDays by remember(block) { mutableStateOf(block?.daysOfWeek?.toMutableList() ?: mutableListOf(1, 2, 3, 4, 5)) }
    var showCatMenu by remember { mutableStateOf(false) }
    val isEdit = block?.id?.isNotEmpty() == true

    Dialog(onDismissRequest = onDismiss) {
        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(26.dp),
            colors = CardDefaults.cardColors(containerColor = CalCard),
            border = androidx.compose.foundation.BorderStroke(1.dp, CalBorder)
        ) {
            Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(if (isEdit) "✏️ Editar bloque" else "⏱ Nuevo bloque de horario",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, color = Color.White))
                OutlinedTextField(value = title, onValueChange = { title = it },
                    label = { Text("Nombre del bloque") }, modifier = Modifier.fillMaxWidth(),
                    singleLine = true, shape = RoundedCornerShape(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = startTime, onValueChange = { startTime = it },
                        label = { Text("Inicio") }, placeholder = { Text("08:00") },
                        modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                    OutlinedTextField(value = endTime, onValueChange = { endTime = it },
                        label = { Text("Fin") }, placeholder = { Text("09:00") },
                        modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
                }
                // Categoría
                Box(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                        .background(CalCard2).border(1.dp, CalBorder, RoundedCornerShape(12.dp))
                        .clickable { showCatMenu = true }.padding(12.dp)
                    ) {
                        Column {
                            Text("Tipo de bloque", style = MaterialTheme.typography.labelSmall.copy(color = CalMuted))
                            Spacer(Modifier.height(3.dp))
                            Text("${category.emoji} ${category.label}",
                                style = MaterialTheme.typography.bodyMedium.copy(color = scheduleCategoryColor(category), fontWeight = FontWeight.Bold))
                        }
                    }
                    DropdownMenu(expanded = showCatMenu, onDismissRequest = { showCatMenu = false }) {
                        ScheduleCategory.values().forEach { cat ->
                            DropdownMenuItem(text = { Text("${cat.emoji} ${cat.label}") }, onClick = { category = cat; showCatMenu = false })
                        }
                    }
                }
                // Días de la semana
                Column {
                    Text("Días de la semana", style = MaterialTheme.typography.labelMedium.copy(color = CalMuted))
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        allDays.forEachIndexed { i, day ->
                            val isSelected = selectedDays.contains(day)
                            Box(modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) PurpleGrad else Brush.linearGradient(listOf(CalCard2, CalCard2)))
                                .border(1.dp, if (isSelected) Color.Transparent else CalBorder, RoundedCornerShape(8.dp))
                                .clickable {
                                    selectedDays = if (isSelected) (selectedDays - day).toMutableList()
                                    else (selectedDays + day).sorted().toMutableList()
                                }
                                .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(dayLabels[i], style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White else CalMuted
                                ))
                            }
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                        Text("Cancelar", color = CalMuted)
                    }
                    Button(onClick = {
                        if (title.trim().isNotBlank() && startTime.isNotBlank()) {
                            onSave(ScheduleBlock(
                                id = block?.id ?: "", userId = block?.userId ?: "",
                                title = title.trim(), startTime = startTime.trim(),
                                endTime = endTime.trim(), category = category,
                                daysOfWeek = selectedDays.toList(), isActive = true
                            ))
                        }
                    }, modifier = Modifier.weight(1f), enabled = title.trim().isNotBlank() && startTime.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = CalIndigo),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text("Guardar", fontWeight = FontWeight.Bold) }
                }
            }
        }
    }
}
