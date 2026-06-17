import { login } from "../services/authService";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Box, TextField, Button, Typography, Paper,
  InputAdornment, IconButton, CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  StorefrontRounded as StorefrontRoundedIcon,
  ArrowForward,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { C } from "../theme/colors";

// ── Premium light theme for Login ─────────────────────────────────────────────
const loginTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: C.blue },
    background: { default: C.bg, paper: C.white },
    text: { primary: C.navy, secondary: C.slateMid },
  },
  typography: { fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  shape: { borderRadius: 14 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: C.white,
            transition: "all 0.2s",
            boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
            "& fieldset": { borderColor: C.border },
            "&:hover fieldset": { borderColor: "#cbd5e1" },
            "&.Mui-focused fieldset": { borderColor: C.blue, borderWidth: 2 },
            "&.Mui-focused": { boxShadow: "0 4px 12px rgba(37,99,235,0.08)" },
          },
          "& .MuiInputLabel-root": { color: C.slateMid, fontSize: "14px", fontWeight: 500 },
          "& .MuiInputLabel-root.Mui-focused": { color: C.blue },
          "& .MuiInputBase-input": { color: C.navy, fontSize: "14px", fontWeight: 500 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: 0.3,
        },
      },
    },
  },
});

// ── Animated background blobs ───────────────────────────────────────────────
const blobs = [
  { size: 500, top: "-15%", left: "-10%", color: "rgba(37,99,235,0.06)", delay: "0s" },
  { size: 400, bottom: "-10%", right: "-5%", color: "rgba(124,58,237,0.05)", delay: "1.5s" },
  { size: 300, top: "40%", right: "15%", color: "rgba(13,148,136,0.04)", delay: "3s" },
];

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);

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
    setLoading(true);
    try {
      const data = await login(username, password);
      authLogin(data.token, data.role);  // update context state FIRST
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={loginTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Abstract background */}
        <Box sx={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 2px 2px, rgba(15,23,42,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px", zIndex: 0,
        }} />

        {blobs.map((b, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: b.size, height: b.size, borderRadius: "50%",
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              top: b.top, left: b.left, bottom: b.bottom, right: b.right,
              animation: `pulse-dot 8s infinite alternate ${b.delay}`,
              zIndex: 0, pointerEvents: "none",
            }}
          />
        ))}

        {/* ── Login Card ── */}
        <Paper
          elevation={0}
          className="fade-up"
          sx={{
            width: "100%", maxWidth: 420,
            mx: 2, position: "relative", zIndex: 1,
            borderRadius: "20px",
            border: `1px solid ${C.border}`,
            bgcolor: C.white,
            boxShadow: "0 24px 64px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Top accent bar */}
          <Box sx={{ height: 4, background: C.grad.primary, position: "absolute", top: 0, left: 0, right: 0 }} />

          <Box px={{ xs: 4, sm: 5 }} pt={{ xs: 5, sm: 6 }} pb={4} display="flex" flexDirection="column" alignItems="center">
            {/* Logo container */}
            <Box
              sx={{
                width: 60, height: 60, borderRadius: "16px",
                background: C.grad.primary,
                boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                mb: 3,
              }}
            >
              <StorefrontRoundedIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: C.navy, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              Outlet Management
            </Typography>
            <Typography sx={{ fontSize: "14px", color: C.slateMid, mt: 0.5, mb: 4, fontWeight: 500 }}>
              Sign in to your account
            </Typography>

            <Box component="form" sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.5 }} noValidate>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                error={Boolean(errors.username)}
                helperText={errors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: C.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                error={Boolean(errors.password)}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: C.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: C.muted }}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                endIcon={!loading && <ArrowForward sx={{ fontSize: "16px !important", transition: "transform 0.2s" }} />}
                sx={{
                  mt: 1, py: 1.5,
                  background: C.navy, color: C.white,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
                  "&:hover": {
                    background: "#1e293b",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.25)",
                    "& .MuiButton-endIcon": { transform: "translateX(4px)" },
                  },
                  "&.Mui-disabled": { background: C.border, color: C.muted },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: C.slateMid }} /> : "Sign In"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ bgcolor: C.bgMuted, py: 2.5, px: 4, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
            <Typography sx={{ fontSize: "12px", color: C.slateMid, fontWeight: 500 }}>
              Secure access portal
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
