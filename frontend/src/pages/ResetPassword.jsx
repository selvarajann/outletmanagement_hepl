import { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Button, Paper, Alert, Container, CircularProgress
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Four Pillars validation
  const [validLength, setValidLength] = useState(false);
  const [validComplexity, setValidComplexity] = useState(false);
  const [validUnpredictable, setValidUnpredictable] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    setValidLength(password.length >= 8);
    setValidComplexity(
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
    // Simple predictability check: no 3 repeated chars, no simple sequences (123, abc)
    const hasRepeating = /(.)\1{2,}/.test(password);
    const hasSequence = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
    
    setValidUnpredictable(password.length > 0 && !hasRepeating && !hasSequence);
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (!validLength || !validComplexity || !validUnpredictable) {
      setError("Password does not meet the strong password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "An error occurred while resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Reset Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new strong password for your account.
          </Typography>
        </Box>

        {success ? (
          <Box textAlign="center">
            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been successfully reset! Redirecting to login...
            </Alert>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {!token && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Missing reset token. Please use the link provided in your email.
              </Alert>
            )}
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={!passwordsMatch && confirmPassword.length > 0}
              helperText={!passwordsMatch && confirmPassword.length > 0 ? "Passwords do not match" : ""}
              sx={{ mb: 3 }}
            />

            {/* Informational Alert for the Four Pillars */}
            <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🔒 Four Pillars of Strong Passwords
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, typography: 'body2' }}>
                <li style={{ color: password.length === 0 ? "inherit" : (validLength ? "green" : "red") }}>
                  <strong>Length:</strong> 8+ characters minimum
                </li>
                <li style={{ color: password.length === 0 ? "inherit" : (validComplexity ? "green" : "red") }}>
                  <strong>Complexity:</strong> Mix of uppercase, lowercase, numbers, symbols
                </li>
                <li style={{ color: password.length === 0 ? "inherit" : (validUnpredictable ? "green" : "red") }}>
                  <strong>Unpredictability:</strong> No common patterns (e.g. 123, aaa)
                </li>
                <li>
                  <strong>Uniqueness:</strong> Different for every single account
                </li>
              </Box>
            </Alert>
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !token}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword;
