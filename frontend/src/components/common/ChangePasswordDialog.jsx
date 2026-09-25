import { useState, useEffect } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Alert, Box, Typography, CircularProgress
} from "@mui/material";
import { changePassword } from "../../services/authService";

const ChangePasswordDialog = ({ open, onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    if (open) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    setValidLength(newPassword.length >= 8);
    setValidComplexity(
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    );
    const hasRepeating = /(.)\1{2,}/.test(newPassword);
    const hasSequence = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(newPassword);
    
    setValidUnpredictable(newPassword.length > 0 && !hasRepeating && !hasSequence);
    setPasswordsMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validLength || !validComplexity || !validUnpredictable) {
      setError("New password does not meet the strong password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token"); // Get raw token
      if (!token) throw new Error("Authentication token not found.");

      await changePassword(token, oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">Change Password</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {success ? (
          <Alert severity="success">
            Password changed successfully! Closing dialog...
          </Alert>
        ) : (
          <Box component="form" id="change-password-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              error={!passwordsMatch && confirmPassword.length > 0}
              helperText={!passwordsMatch && confirmPassword.length > 0 ? "Passwords do not match" : ""}
            />

            {/* Informational Alert for the Four Pillars */}
            <Alert severity="info" sx={{ mt: 2, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🔒 Four Pillars of Strong Passwords
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, typography: 'body2' }}>
                <li style={{ color: newPassword.length === 0 ? "inherit" : (validLength ? "green" : "red") }}>
                  <strong>Length:</strong> 8+ characters minimum
                </li>
                <li style={{ color: newPassword.length === 0 ? "inherit" : (validComplexity ? "green" : "red") }}>
                  <strong>Complexity:</strong> Mix of uppercase, lowercase, numbers, symbols
                </li>
                <li style={{ color: newPassword.length === 0 ? "inherit" : (validUnpredictable ? "green" : "red") }}>
                  <strong>Unpredictability:</strong> No common patterns (e.g. 123, aaa)
                </li>
                <li>
                  <strong>Uniqueness:</strong> Different for every single account
                </li>
              </Box>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      {!success && (
        <DialogActions>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="change-password-form" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Change Password
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ChangePasswordDialog;
