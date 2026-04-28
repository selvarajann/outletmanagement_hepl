import { login } from "../services/authService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    return e;
  };

  const handleLogin = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.token);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f3f2f2">
      <Paper elevation={4} sx={{ p: 4, width: 360, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">Admin Login</Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!errors.username} helperText={errors.username} fullWidth
          />
          <TextField
            label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password} helperText={errors.password} fullWidth
          />
          <Button variant="contained" onClick={handleLogin} sx={{ mt: 1, borderRadius: 2 }}>
            Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
