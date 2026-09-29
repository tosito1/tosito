import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRegex2 {
    public static void main(String[] args) {
        String text = "5,79\u00A0euros"; // \u00A0 is non-breaking space
        Pattern explicitRegex = Pattern.compile("(\\d+(?:[.,]\\d{1,2})?)\\s*(?:€|euros|euro)");
        Matcher explicitMatch = explicitRegex.matcher(text);
        if (explicitMatch.find()) {
            System.out.println("amount explicit: match");
        } else {
            System.out.println("amount explicit: null");
        }
    }
}
