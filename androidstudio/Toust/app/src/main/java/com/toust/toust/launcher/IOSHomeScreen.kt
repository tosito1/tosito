package com.toust.toust.launcher

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.*
import androidx.compose.ui.unit.*
import com.toust.toust.LockNotificationService
import com.toust.toust.dateStr
import com.toust.toust.timeStr
import kotlinx.coroutines.*
import java.io.File
import java.util.UUID
import kotlin.math.roundToInt

// ── Home Screen ──────────────────────────────────────────────────
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun IOSHomeScreen(onOpenSettings: () -> Unit) {
    val ctx     = LocalContext.current
    val haptic  = LocalHapticFeedback.current
    val density = LocalDensity.current

    // ── Load all installed apps
    val allApps by produceState<List<AppInfo>>(emptyList()) {
        value = withContext(Dispatchers.IO) {
            val pm = ctx.packageManager
            pm.queryIntentActivities(
                Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0
            ).filter { it.activityInfo.packageName != ctx.packageName }
             .map { ri ->
                 val icon = try { pm.getApplicationIcon(ri.activityInfo.packageName) }
                            catch (_: Exception) { ri.loadIcon(pm) }
                 AppInfo(ri.loadLabel(pm).toString(),
                     ri.activityInfo.packageName, ri.activityInfo.name, icon)
             }.sortedBy { it.label.lowercase() }
        }
    }
    val appMap = remember(allApps) { allApps.associateBy { it.packageName } }

    // ── Notification badges from service
    val badgeCounts by LockNotificationService.badgeCounts.collectAsState()

    // ── Layout state (Slot-aware)
    var homePages by remember { mutableStateOf<MutableList<MutableList<Slot?>>>(mutableListOf()) }
    var dockPkgs  by remember { mutableStateOf(mutableListOf<String?>()) }

    LaunchedEffect(allApps) {
        if (allApps.isEmpty()) return@LaunchedEffect
        val loaded = LauncherLayout.loadPages(ctx)
        if (loaded != null && loaded.sumOf { it.filterNotNull().size } >= allApps.size / 2) {
            homePages = loaded
        } else {
            val slots = allApps.map { Slot.App(it.packageName) as Slot? }
            val pages = slots.chunked(PER_PAGE).map { chunk ->
                chunk.toMutableList().also { while (it.size < PER_PAGE) it.add(null) }
            }.toMutableList()
            if (pages.isEmpty()) pages.add(MutableList(PER_PAGE) { null })
            homePages = pages
        }
        val dock = LauncherLayout.loadDock(ctx)
        dockPkgs = if (dock.all { it == null } && allApps.size >= DOCK_MAX)
            allApps.take(DOCK_MAX).map { it.packageName }.toMutableList() else dock
        LauncherLayout.savePages(ctx, homePages)
        LauncherLayout.saveDock(ctx, dockPkgs)
    }

    // ── UI state
    var isEditing        by remember { mutableStateOf(false) }
    var showLibrary      by remember { mutableStateOf(false) }
    var showSearch       by remember { mutableStateOf(false) }
    var showNotifCenter  by remember { mutableStateOf(false) }
    var showControlCenter by remember { mutableStateOf(false) }
    var showWidgets      by remember { mutableStateOf(false) }
    var contextSlot      by remember { mutableStateOf<Pair<Slot, Pair<Int,Int>>?>(null) }
    var dragState        by remember { mutableStateOf<DragState?>(null) }
    var openFolder       by remember { mutableStateOf<Slot.Folder?>(null) }

    // ── Clock
    var time by remember { mutableStateOf(timeStr()) }
    var date by remember { mutableStateOf(dateStr()) }
    LaunchedEffect(Unit) { while (true) { delay(1000L); time = timeStr(); date = dateStr() } }

    // ── Pager
    val pageCount = homePages.size.coerceAtLeast(1)

    // ── Animated background
    val inf   = rememberInfiniteTransition(label = "bg")
    val glow  by inf.animateFloat(0.25f, 0.55f,
        infiniteRepeatable(tween(5000, easing = EaseInOutSine), RepeatMode.Reverse), "g")
    val shift by inf.animateFloat(0f, 1f,
        infiniteRepeatable(tween(13000, easing = LinearEasing), RepeatMode.Restart), "s")
    val glow2 by inf.animateFloat(0.18f, 0.45f,
        infiniteRepeatable(tween(7500, easing = EaseInOutSine), RepeatMode.Reverse), "g2")

    // ── Wallpaper
    val wallpaper = remember {
        runCatching {
            val f = File(ctx.filesDir, "wallpaper.jpg")
            if (f.exists()) {
                BitmapFactory.decodeFile(f.absolutePath,
                    BitmapFactory.Options().apply { inSampleSize = 2 })?.asImageBitmap()
            } else null
        }.getOrNull()
    }

    // ── Persist
    val scope = rememberCoroutineScope()
    fun persistPages() { scope.launch(Dispatchers.IO) { LauncherLayout.savePages(ctx, homePages) } }
    fun persistDock()  { scope.launch(Dispatchers.IO) { LauncherLayout.saveDock(ctx, dockPkgs) } }

    // ── Drop logic
    fun dropSlot(drag: DragState, toPage: Int, toSlot: Int) {
        val pages   = homePages.map { it.toMutableList() }.toMutableList()
        val existing = pages.getOrNull(toPage)?.getOrNull(toSlot)

        if (drag.slotOrigin is Slot.App && existing is Slot.App) {
            val newFolder = Slot.Folder(
                id = UUID.randomUUID().toString(),
                name = "Carpeta",
                apps = listOf(existing.pkg, drag.slotOrigin.pkg)
            )
            pages[toPage][toSlot] = newFolder
            if (!drag.fromDock) pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, null)
            homePages = pages; persistPages(); return
        }
        if (drag.slotOrigin is Slot.App && existing is Slot.Folder) {
            pages[toPage][toSlot] = existing.copy(apps = existing.apps + drag.slotOrigin.pkg)
            if (!drag.fromDock) pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, null)
            homePages = pages; persistPages(); return
        }
        pages.getOrNull(toPage)?.set(toSlot, drag.slotOrigin)
        if (!drag.fromDock) {
            val fl = pages.getOrNull(drag.fromPage)
            if (existing != null && fl != null) fl[drag.fromSlot] = existing
            else fl?.set(drag.fromSlot, null)
        }
        homePages = pages; persistPages()
    }

    // ── Notifications data
    val notifications by LockNotificationService.notifications.collectAsState()

    // ==========================================================
    // UI COMPOSITION
    // ==========================================================
    Box(
        Modifier.fillMaxSize()
            .pointerInput(isEditing) {
                detectTapGestures { if (isEditing && dragState == null) isEditing = false }
            }
    ) {
        // ── Background
        if (wallpaper != null) {
            Image(bitmap = wallpaper, contentDescription = null,
                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            Box(Modifier.fillMaxSize().background(Color.Black.copy(0.22f)))
        } else {
            Box(Modifier.fillMaxSize().background(IOSDark))
            Canvas(Modifier.fillMaxSize()) {
                listOf(
                    Triple(size.width * (0.20f + shift*0.22f), size.height*0.18f,
                        Color(0xFF1E3A8A).copy(glow)),
                    Triple(size.width * (0.82f - shift*0.18f), size.height*(0.42f + shift*0.08f),
                        Color(0xFF5B21B6).copy(glow2)),
                    Triple(size.width * (0.46f + shift*0.10f), size.height*(0.77f - shift*0.10f),
                        Color(0xFF0E7490).copy(glow))
                ).forEach { (cx, cy, col) ->
                    drawCircle(
                        Brush.radialGradient(listOf(col, Color.Transparent),
                            center = Offset(cx, cy), radius = size.width*0.80f),
                        radius = size.width*0.80f, center = Offset(cx, cy)
                    )
                }
            }
            Box(Modifier.fillMaxSize().background(
                Brush.verticalGradient(listOf(Color.Black.copy(0.20f), Color.Transparent,
                    Color.Black.copy(0.40f)))))
        }

        // ── Main column
        Column(Modifier.fillMaxSize()) {
            // Status bar with gesture detection for Notification/Control Center
            Box(Modifier.fillMaxWidth()) {
                IosStatusBar(time)
                // Gesture: swipe down on left half → Notification Center
                Box(
                    Modifier.fillMaxWidth(0.5f).height(40.dp).align(Alignment.TopStart)
                        .pointerInput(Unit) {
                            detectVerticalDragGestures { _, delta ->
                                if (delta > 30f && !showNotifCenter && !showControlCenter) {
                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    showNotifCenter = true
                                }
                            }
                        }
                )
                // Gesture: swipe down on right half → Control Center
                Box(
                    Modifier.fillMaxWidth(0.5f).height(40.dp).align(Alignment.TopEnd)
                        .pointerInput(Unit) {
                            detectVerticalDragGestures { _, delta ->
                                if (delta > 30f && !showControlCenter && !showNotifCenter) {
                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    showControlCenter = true
                                }
                            }
                        }
                )
            }

            if (!showLibrary && !showWidgets) {
                ClockWidget(time, date)
                Spacer(Modifier.height(2.dp))
            }

            Box(Modifier.weight(1f)
                .pointerInput(showLibrary, showSearch, showWidgets) {
                    detectVerticalDragGestures(
                        onDragEnd = {}, onDragStart = {},
                        onVerticalDrag = { _, delta ->
                            if (delta < -48f && !showSearch && !showLibrary && !showWidgets) showSearch = true
                            if (delta > 48f) when {
                                showLibrary -> showLibrary = false
                                showSearch  -> showSearch  = false
                                showWidgets -> showWidgets = false
                            }
                        }
                    )
                }
            ) {
                if (!showLibrary && !showWidgets) {
                    key(pageCount) {
                        val pagerState = rememberPagerState { pageCount }

                        // Detect swipe right beyond first page → Widgets panel
                        LaunchedEffect(pagerState.currentPage, pagerState.currentPageOffsetFraction) {
                            if (pagerState.currentPage == 0 &&
                                pagerState.currentPageOffsetFraction < -0.3f) {
                                showWidgets = true
                            }
                        }

                        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
                            val pageSlots = homePages.getOrElse(page) { MutableList(PER_PAGE) { null } }
                            AppGridDraggable(
                                slots     = pageSlots,
                                page      = page,
                                isEditing = isEditing,
                                pagerState = pagerState,
                                dragState  = dragState,
                                appMap     = appMap,
                                badgeCounts = badgeCounts,
                                onTapApp   = { app ->
                                    if (isEditing) contextSlot = Slot.App(app.packageName) to (page to 0)
                                    else launchApp(ctx, app)
                                },
                                onTapFolder = { folder, pageIdx, slotIdx ->
                                    if (!isEditing) openFolder = folder
                                    else contextSlot = folder to (pageIdx to slotIdx)
                                },
                                onLongPress = { slotIdx, slot ->
                                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                    isEditing = true
                                    val pages = homePages.map { it.toMutableList() }.toMutableList()
                                    pages.getOrNull(page)?.set(slotIdx, null)
                                    homePages = pages
                                    dragState = DragState(slot, page, slotIdx)
                                },
                                onDragMove   = { offset -> dragState = dragState?.copy(offset = offset) },
                                onDropInSlot = { toSlot ->
                                    dragState?.let { drag -> dropSlot(drag, page, toSlot); dragState = null }
                                },
                                onCancelDrag = {
                                    dragState?.let { drag ->
                                        if (!drag.fromDock) {
                                            val pages = homePages.map { it.toMutableList() }.toMutableList()
                                            pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, drag.slotOrigin)
                                            homePages = pages; persistPages()
                                        }
                                        dragState = null
                                    }
                                }
                            )
                        }
                        // Swipe hint
                        val pulse by inf.animateFloat(0.45f, 1f,
                            infiniteRepeatable(tween(1300), RepeatMode.Reverse), "pulse")
                        if (!isEditing && pageCount > 1) {
                            Icon(Icons.Default.KeyboardArrowUp, null,
                                tint = Color.White.copy(pulse),
                                modifier = Modifier.size(22.dp).align(Alignment.BottomCenter))
                        }
                    }
                }
            }

            if (!showLibrary && !showWidgets) {
                val pagerStateRef = rememberPagerState { pageCount }
                PageIndicator(pagerStateRef, pageCount)
                Spacer(Modifier.height(6.dp))
            }

            // ── Dock
            PremiumDock(
                pkgs          = dockPkgs,
                appMap        = appMap,
                isEditing     = isEditing,
                dragState     = dragState,
                onTap         = { app -> launchApp(ctx, app) },
                onOpenSettings = onOpenSettings,
                onSearch      = { showSearch = true },
                onOpenLibrary = { showLibrary = true },
                onDropInDock  = { slot ->
                    dragState?.let { drag ->
                        val dock = dockPkgs.toMutableList()
                        val disp = dock.getOrNull(slot)
                        if (drag.slotOrigin is Slot.App) {
                            dock[slot] = drag.slotOrigin.pkg
                            val pages = homePages.map { it.toMutableList() }.toMutableList()
                            if (!drag.fromDock) {
                                if (disp != null) pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, Slot.App(disp))
                                else pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, null)
                            }
                            dockPkgs = dock; homePages = pages
                            persistPages(); persistDock()
                        }
                        dragState = null
                    }
                }
            )

            // Home indicator
            HomeIndicatorBar()
            Spacer(Modifier.navigationBarsPadding())
        }

        // ── Floating drag icon
        dragState?.let { drag ->
            if (drag.offset != Offset.Zero) {
                val px = with(density) { ICON_SIZE.roundToPx() }
                Box(Modifier
                    .offset { IntOffset((drag.offset.x - px/2).roundToInt(),
                        (drag.offset.y - px/2 - 30).roundToInt()) }
                    .size(ICON_SIZE).scale(1.18f)
                    .graphicsLayer { clip = false }
                ) {
                    when (val s = drag.slotOrigin) {
                        is Slot.App -> {
                            val bmp: ImageBitmap? = remember(s.pkg) {
                                appMap[s.pkg]?.icon?.toBitmap(256)?.asImageBitmap()
                            }
                            if (bmp != null) Image(painter = BitmapPainter(bmp),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize().clip(ICON_SHAPE)
                                    .shadow(24.dp, ICON_SHAPE),
                                contentScale = ContentScale.Crop)
                        }
                        is Slot.Folder -> FolderIconMini(s, appMap, Modifier.fillMaxSize())
                    }
                }
            }
        }

        // ── Done button
        if (isEditing) {
            Box(Modifier.align(Alignment.TopCenter).padding(top = 54.dp)) {
                GlassButton("Listo") {
                    isEditing = false
                    dragState?.let { drag ->
                        if (!drag.fromDock) {
                            val pages = homePages.map { it.toMutableList() }.toMutableList()
                            pages.getOrNull(drag.fromPage)?.set(drag.fromSlot, drag.slotOrigin)
                            homePages = pages; persistPages()
                        }
                    }
                    dragState = null
                }
            }
        }

        // ── Folder overlay
        openFolder?.let { folder ->
            FolderOverlay(
                folder  = folder,
                appMap  = appMap,
                isEditing = isEditing,
                onTapApp = { app -> launchApp(ctx, app) },
                onClose  = { openFolder = null },
                onRename = { newName ->
                    val pages = homePages.map { it.toMutableList() }.toMutableList()
                    pages.forEach { pg -> pg.replaceAll { slot ->
                        if (slot is Slot.Folder && slot.id == folder.id) slot.copy(name = newName) else slot
                    }}
                    homePages = pages; persistPages()
                    openFolder = openFolder?.copy(name = newName)
                },
                onRemoveApp = { pkg ->
                    val pages = homePages.map { it.toMutableList() }.toMutableList()
                    pages.forEach { pg -> pg.replaceAll { slot ->
                        if (slot is Slot.Folder && slot.id == folder.id) {
                            val updated = slot.copy(apps = slot.apps.filter { it != pkg })
                            if (updated.apps.isEmpty()) null else updated
                        } else slot
                    }}
                    homePages = pages; persistPages()
                    val updatedFolder = openFolder?.copy(apps = openFolder!!.apps.filter { it != pkg })
                    openFolder = if (updatedFolder?.apps.isNullOrEmpty()) null else updatedFolder
                }
            )
        }

        // ── App Library overlay
        val libAlpha by animateFloatAsState(if (showLibrary) 1f else 0f, tween(280), label="lib")
        val libScale by animateFloatAsState(if (showLibrary) 1f else 0.96f, tween(280), label="libs")
        if (showLibrary || libAlpha > 0f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha=libAlpha; scaleX=libScale; scaleY=libScale }) {
                AppLibrary(
                    allApps = allApps,
                    onTap   = { app -> showLibrary = false; launchApp(ctx, app) },
                    onClose = { showLibrary = false }
                )
            }
        }

        // ── Spotlight Search
        val sAlpha by animateFloatAsState(if (showSearch) 1f else 0f, tween(200), label="sa")
        val sScale by animateFloatAsState(if (showSearch) 1f else 0.94f, tween(200), label="ss")
        if (showSearch || sAlpha > 0f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha=sAlpha; scaleX=sScale; scaleY=sScale }) {
                SearchOverlay(
                    apps    = allApps,
                    onTap   = { app -> showSearch = false; launchApp(ctx, app) },
                    onClose = { showSearch = false }
                )
            }
        }

        // ── Notification Center overlay
        val ncAlpha by animateFloatAsState(if (showNotifCenter) 1f else 0f, tween(250), label="nc")
        if (showNotifCenter || ncAlpha > 0f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha = ncAlpha }) {
                NotificationCenter(
                    notifications = notifications,
                    appMap  = appMap,
                    time    = time,
                    date    = date,
                    onDismissNotif = { /* dismiss individual notif */ },
                    onClearAll     = { LockNotificationService.clearAll() },
                    onClose        = { showNotifCenter = false }
                )
            }
        }

        // ── Control Center overlay
        val ccAlpha by animateFloatAsState(if (showControlCenter) 1f else 0f, tween(250), label="cc")
        if (showControlCenter || ccAlpha > 0f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha = ccAlpha }) {
                ControlCenter(onClose = { showControlCenter = false })
            }
        }

        // ── Widgets Panel overlay
        val wpAlpha by animateFloatAsState(if (showWidgets) 1f else 0f, tween(280), label="wp")
        if (showWidgets || wpAlpha > 0f) {
            Box(Modifier.fillMaxSize().graphicsLayer { alpha = wpAlpha }) {
                WidgetsPanel(
                    time = time, date = date,
                    onClose = { showWidgets = false }
                )
            }
        }

        // ── Context menu
        contextSlot?.let { (slot, pos) ->
            Box(Modifier.fillMaxSize().background(Color.Black.copy(0.55f))
                .clickable { contextSlot = null },
                contentAlignment = Alignment.Center) {
                when (slot) {
                    is Slot.App -> {
                        val app = appMap[slot.pkg]
                        if (app != null) ContextMenuCard(
                            app       = app,
                            onDismiss = { contextSlot = null },
                            onInfo    = { openAppInfo(ctx, app.packageName); contextSlot = null },
                            onRemove  = {
                                val pages = homePages.map { it.toMutableList() }.toMutableList()
                                pages.getOrNull(pos.first)?.set(pos.second, null)
                                homePages = pages; persistPages(); contextSlot = null
                            },
                            onUninstall = {
                                uninstallApp(ctx, app.packageName)
                                contextSlot = null
                            }
                        )
                    }
                    is Slot.Folder -> FolderContextMenu(
                        folder    = slot,
                        onDismiss = { contextSlot = null },
                        onRename  = { name ->
                            val pages = homePages.map { it.toMutableList() }.toMutableList()
                            pages.getOrNull(pos.first)?.set(pos.second, slot.copy(name = name))
                            homePages = pages; persistPages(); contextSlot = null
                        },
                        onDelete  = {
                            val pages = homePages.map { it.toMutableList() }.toMutableList()
                            pages.getOrNull(pos.first)?.set(pos.second, null)
                            homePages = pages; persistPages(); contextSlot = null
                        }
                    )
                }
            }
        }
    }
}
