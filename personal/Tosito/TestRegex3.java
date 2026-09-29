import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRegex3 {
    public static void main(String[] args) {
        String text = "5,79\u00A0euros"; // \u00A0 is non-breaking space
        Pattern decimalRegex = Pattern.compile("(\\d+[.,]\\d{1,2})(?!\\d)");
        Matcher match = decimalRegex.matcher(text);
        if (match.find()) {
            System.out.println("amount decimal: " + match.group(1));
        } else {
            System.out.println("amount decimal: null");
        }
    }
}
