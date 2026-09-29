fun main() {
    val fullText = "asadero benlalua 7,5 euros con mastercard debito joven **6742".lowercase()
    
    val isCharge = fullText.contains("cargo") || 
                   fullText.contains("compra") || 
                   fullText.contains("pago") || 
                   fullText.contains("has pagado") ||
                   fullText.contains("mastercard") ||
                   fullText.contains("visa") ||
                   (fullText.contains("tarjeta") && !fullText.contains("ingreso")) ||
                   (fullText.contains("debito") && !fullText.contains("ingreso")) ||
                   (fullText.contains("débito") && !fullText.contains("ingreso"))
                   
    println("isCharge: $isCharge")

    val explicitRegex = Regex("(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros|euro)")
    val explicitMatch = explicitRegex.find(fullText)
    if (explicitMatch != null) {
        println("Explicit Match: " + explicitMatch.groupValues[1].replace(",", ".").toDoubleOrNull())
    } else {
        println("No explicit match")
    }
}
main()
