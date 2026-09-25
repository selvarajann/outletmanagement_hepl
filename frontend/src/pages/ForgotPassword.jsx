import { useState } from "react";
import { 
  Box, Typography, TextField, Button, Paper, Alert, Container, CircularProgress
} from "@mui/material";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "An error occurred while requesting password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Box>

        {success ? (
          <Box textAlign="center">
            <Alert severity="success" sx={{ mb: 3 }}>
              Password reset link has been sent to your email! Please check your inbox (and spam folder).
            </Alert>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained" 
              fullWidth 
              size="large"
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Send Reset Link"}
            </Button>
            
            <Box textAlign="center">
              <Typography variant="body2">
                Remember your password?{" "}
                <Link to="/login" style={{ textDecoration: "none", color: "#1976d2", fontWeight: 600 }}>
                  Back to Login
                </Link>
              </Typography>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
