async function endSession() {
  try {
    const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "selvarajan",
        password: "1234",
        role: "SUPER_ADMIN",
      })
    });
    const loginData = await loginRes.json();
    console.log("Login data:", JSON.stringify(loginData).substring(0, 50));

    if (!loginData.data || !loginData.data.token) {
        return;
    }

    const token = loginData.data.token;
    console.log("Got token:", token.substring(0, 15) + "...");

    const endRes = await fetch("http://localhost:8080/api/v1/admin/impersonate/end", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const endData = await endRes.json();
    console.log("Ended session:", endData);
  } catch (error) {
    console.error("Error:", error);
  }
}

endSession();
