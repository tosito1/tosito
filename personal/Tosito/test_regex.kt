fun main() {
    val text = "Mercadona - c/ronda(gr 5,79 euros con Mastercard debito joven **6742".lowercase()
    println("Text: $text")

    val isCharge = text.contains("cargo") || 
                text.contains("compra") || 
                text.contains("pago") || 
                text.contains("has pagado") ||
                text.contains("mastercard") ||
                text.contains("visa") ||
                (text.contains("tarjeta") && !text.contains("ingreso")) ||
                (text.contains("debito") && !text.contains("ingreso")) ||
                (text.contains("débito") && !text.contains("ingreso"))
    println("isCharge: $isCharge")

    val explicitRegex = Regex("""(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros|euro)""")
    val explicitMatch = explicitRegex.find(text)
    if (explicitMatch != null) {
        println("amount explicit: " + explicitMatch.groupValues[1].replace(",", ".").toDoubleOrNull())
    } else {
        println("amount explicit: null")
        val decimalRegex = Regex("""(\d+[.,]\d{1,2})(?!\d)""")
        val match = decimalRegex.find(text)
        println("amount decimal: " + match?.groupValues?.get(1)?.replace(",", ".")?.toDoubleOrNull())
    }
}
