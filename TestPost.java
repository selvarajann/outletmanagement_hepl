import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class TestPost {
    public static void main(String[] args) {
        try {
            URL url = new URL("https://flsrkbvh-8080.inc1.devtunnels.ms/api/v1/orders");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");
            con.setRequestProperty("Authorization", "Bearer eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiUk9MRV9BRE1JTiIsInN1YiI6ImFkbWluIiwiaWF0IjoxNzgyMTIxNTg3LCJleHAiOjE4MTM2NTc1ODd9.ZwYPlFNcW6TYwmW0oWQt8_Yv4DXyIcFA61dhZBmNhYC6kmiofrkZQLeYuNswMPE8");
            con.setDoOutput(true);

            String jsonInputString = "{\"customerId\": 1, \"customerName\": \"Test\", \"orderItems\": [{\"productId\": 3, \"quantity\": 1, \"discount\": 0.0, \"gstpercentage\": 0.0}], \"status\": \"APPROVED\", \"paymentStatus\": \"PAID\", \"paymentMethod\": \"CASH\", \"onlinePaymentOption\": \"\"}";
            
            try(OutputStream os = con.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);			
            }

            int code = con.getResponseCode();
            System.out.println("Response Code: " + code);

            java.io.InputStream is = code < 400 ? con.getInputStream() : con.getErrorStream();
            java.util.Scanner s = new java.util.Scanner(is).useDelimiter("\\A");
            String result = s.hasNext() ? s.next() : "";
            System.out.println("Response Body: " + result);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
