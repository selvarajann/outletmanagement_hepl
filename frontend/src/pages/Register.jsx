import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import { AuthContext } from "../context/AuthContext";
import {
  Box, TextField, Button, Typography, Paper,
  InputAdornment, IconButton, CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility, VisibilityOff,
  StorefrontRounded as StorefrontRoundedIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { C } from "../theme/colors";

// ── Match Login's premium light theme exactly ────────────────────────────────
const registerTheme = createTheme({
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

const blobs = [
  { size: 500, top: "-15%", left: "-10%", color: "rgba(37,99,235,0.06)", delay: "0s" },
  { size: 400, bottom: "-10%", right: "-5%", color: "rgba(124,58,237,0.05)", delay: "1.5s" },
  { size: 300, top: "40%", right: "15%", color: "rgba(13,148,136,0.04)", delay: "3s" },
];

// ── Field config for DRY rendering ───────────────────────────────────────────
const FIELDS = [
  {
    name: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    Icon: PersonIcon,
    validate: (v) => (!v.trim() ? "Username is required" : ""),
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    Icon: EmailIcon,
    validate: (v) =>
      !v.trim()
        ? "Email is required"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? "Enter a valid email address"
        : "",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    Icon: LockIcon,
    validate: (v) =>
      !v.trim()
        ? "Password is required"
        : v.length < 6
        ? "Password must be at least 6 characters"
        : "",
  },
  {
    name: "confirm",
    label: "Confirm Password",
    type: "password",
    autoComplete: "new-password",
    Icon: LockIcon,
    validate: (v, form) => (v !== form.password ? "Passwords do not match" : ""),
  },
];

const Register = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    FIELDS.forEach(({ name, validate: fn }) => {
      const msg = fn(form[name], form);
      if (msg) e[name] = msg;
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await register(form.username, form.password, form.email);
      // Auto-login after registration (same flow as Login.jsx)
      if (data?.token) {
        authLogin(data.token, data.role);
        toast.success("Account created! Welcome aboard 🎉");
        navigate("/dashboard");
      } else {
        toast.success("Registered successfully! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={registerTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Dot-grid background */}
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

        {/* ── Register Card ── */}
        <Paper
          elevation={0}
          className="fade-up"
          sx={{
            width: "100%", maxWidth: 440,
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
            {/* Logo */}
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
              Create Account
            </Typography>
            <Typography sx={{ fontSize: "14px", color: C.slateMid, mt: 0.5, mb: 4, fontWeight: 500 }}>
              Join the Outlet Management platform
            </Typography>

            <Box component="form" sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }} noValidate>
              {FIELDS.map(({ name, label, type: baseType, autoComplete, Icon }) => {
                const isPasswordField = name === "password" || name === "confirm";
                const shown = showPwd[name];
                const inputType = isPasswordField ? (shown ? "text" : "password") : baseType;

                return (
                  <TextField
                    key={name}
                    fullWidth
                    name={name}
                    label={label}
                    type={inputType}
                    variant="outlined"
                    autoComplete={autoComplete}
                    value={form[name]}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    error={Boolean(errors[name])}
                    helperText={errors[name]}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon sx={{ color: C.muted, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      ...(isPasswordField && {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPwd((p) => ({ ...p, [name]: !p[name] }))}
                              edge="end"
                              sx={{ color: C.muted }}
                            >
                              {shown ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }),
                    }}
                  />
                );
              })}

              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={!loading && <PersonAddIcon sx={{ fontSize: "16px !important" }} />}
                sx={{
                  mt: 1, py: 1.5,
                  background: C.navy, color: C.white,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
                  "&:hover": {
                    background: "#1e293b",
                    boxShadow: "0 6px 16px rgba(15,23,42,0.25)",
                  },
                  "&.Mui-disabled": { background: C.border, color: C.muted },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: C.slateMid }} /> : "Create Account"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ bgcolor: C.bgMuted, py: 2.5, px: 4, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
            <Typography sx={{ fontSize: "13px", color: C.slateMid, fontWeight: 500 }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: C.blue,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
