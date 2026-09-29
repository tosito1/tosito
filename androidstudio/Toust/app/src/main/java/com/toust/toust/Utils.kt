package com.toust.toust

import java.util.Calendar

/** Devuelve la hora actual como "HH:mm" */
fun timeStr(): String {
    val c = Calendar.getInstance()
    return "${c.get(Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}:" +
           "${c.get(Calendar.MINUTE).toString().padStart(2, '0')}"
}

/** Devuelve la hora actual como "HHmm" — el PIN de bloqueo */
fun pinStr(): String {
    val c = Calendar.getInstance()
    return "${c.get(Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}" +
           "${c.get(Calendar.MINUTE).toString().padStart(2, '0')}"
}

/** Devuelve la fecha en español: "Lunes, 23 de febrero" */
fun dateStr(): String {
    val c = Calendar.getInstance()
    val dow = when (c.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY    -> "Lunes"
        Calendar.TUESDAY   -> "Martes"
        Calendar.WEDNESDAY -> "Miércoles"
        Calendar.THURSDAY  -> "Jueves"
        Calendar.FRIDAY    -> "Viernes"
        Calendar.SATURDAY  -> "Sábado"
        else               -> "Domingo"
    }
    val month = when (c.get(Calendar.MONTH)) {
        Calendar.JANUARY   -> "enero"
        Calendar.FEBRUARY  -> "febrero"
        Calendar.MARCH     -> "marzo"
        Calendar.APRIL     -> "abril"
        Calendar.MAY       -> "mayo"
        Calendar.JUNE      -> "junio"
        Calendar.JULY      -> "julio"
        Calendar.AUGUST    -> "agosto"
        Calendar.SEPTEMBER -> "septiembre"
        Calendar.OCTOBER   -> "octubre"
        Calendar.NOVEMBER  -> "noviembre"
        else               -> "diciembre"
    }
    return "$dow, ${c.get(Calendar.DAY_OF_MONTH)} de $month"
}
