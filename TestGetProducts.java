import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

public class TestGetProducts {
    public static void main(String[] args) {
        try {
            URL url = new URL("http://localhost:8080/api/stock-orders/warehouse-products?outletId=2");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            con.setRequestProperty("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBvdXRsZXRtYW5hZ2VtZW50LmNvbSIsImlhdCI6MTc4MjExMTAyOCwiZXhwIjoxNzgyMTk3NDI4fQ.a1_B_6QO4-N2y90E9lG4_uVwS0LqB4lZpD__4-v12eN2y90E9lG4_uVwS0LqB4lZpD__4-v12eN2y90E9lG4_uVwS0LqB4lZpD"); // Wait I need a valid token.
            
            int code = con.getResponseCode();
            System.out.println("Response Code: " + code);

            InputStream is = code < 400 ? con.getInputStream() : con.getErrorStream();
            Scanner s = new Scanner(is).useDelimiter("\\A");
            System.out.println("Response Body: " + (s.hasNext() ? s.next() : ""));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
