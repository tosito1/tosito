import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRegex {
    public static void main(String[] args) {
        String text = "Mercadona - c/ronda(gr\n5,79 euros con Mastercard debito joven **6742".toLowerCase();
        System.out.println("Text: " + text);
        
        boolean isCharge = text.contains("cargo") || 
            text.contains("compra") || 
            text.contains("pago") || 
            text.contains("has pagado") ||
            text.contains("mastercard") ||
            text.contains("visa") ||
            (text.contains("tarjeta") && !text.contains("ingreso")) ||
            (text.contains("debito") && !text.contains("ingreso")) ||
            (text.contains("débito") && !text.contains("ingreso"));
        System.out.println("isCharge: " + isCharge);
        
        Pattern explicitRegex = Pattern.compile("(\\d+(?:[.,]\\d{1,2})?)\\s*(?:€|euros|euro)");
        Matcher explicitMatch = explicitRegex.matcher(text);
        if (explicitMatch.find()) {
            String val = explicitMatch.group(1).replace(",", ".");
            System.out.println("amount explicit: " + Double.parseDouble(val));
        } else {
            System.out.println("amount explicit: null");
        }
    }
}
