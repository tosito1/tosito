package com.toust.tosito.widget

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.toust.tosito.data.repository.SavingsRepository
import kotlinx.coroutines.runBlocking
import java.util.Calendar

class TositoWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TositoWidget()
}

class TositoWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = context.getSharedPreferences("TositoWidgetPrefs", Context.MODE_PRIVATE)
        val budget = prefs.getFloat("current_budget", 0f)
        val budgetLimit = prefs.getFloat("budget_limit", 1500f)
        val eventsCount = prefs.getInt("events_count", 0)

        provideContent {
            Column(
                modifier = GlanceModifier.fillMaxSize()
                    .background(ColorProvider(Color(0xFF1C2330)))
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Tosito Resumen",
                    style = TextStyle(color = ColorProvider(Color.White), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = GlanceModifier.height(12.dp))
                
                Row(modifier = GlanceModifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Presupuesto Restante", style = TextStyle(color = ColorProvider(Color(0xFF7A8BA8)), fontSize = 12.sp))
                        val remaining = budgetLimit - budget
                        val color = if (remaining > 0) Color(0xFF22C55E) else Color(0xFFEF4444)
                        Text(
                            text = "%.2f€".format(remaining),
                            style = TextStyle(color = ColorProvider(color), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        )
                    }
                }
                
                Spacer(modifier = GlanceModifier.height(12.dp))
                
                Row(modifier = GlanceModifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "📅 Hoy: $eventsCount evento(s)",
                        style = TextStyle(color = ColorProvider(Color(0xFF14B8A6)), fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    )
                }
            }
        }
    }
}
