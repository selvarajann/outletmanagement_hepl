import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { AuthContext } from "../../context/AuthContext";

const ImpersonationBanner = () => {
  const { impersonation, isImpersonating, stopImpersonation } = useContext(AuthContext);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isImpersonating || !impersonation) return;

    const calculateTimeLeft = () => {
      const expiresAt = new Date(impersonation.expiresAt).getTime();
      const now = Date.now();
      const difference = expiresAt - now;

      if (difference <= 0) {
        return "00:00";
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isImpersonating, impersonation]);

  if (!isImpersonating || !impersonation) {
    return null;
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#ff9800",
        color: "#fff",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 0,
      }}
    >
      <WarningAmberIcon />
      <Typography variant="body1" fontWeight="bold">
        ADMIN MODE — You are acting as: {impersonation.targetUsername} ({impersonation.targetRole})
      </Typography>
      <Typography variant="body2" sx={{ ml: 2, backgroundColor: "rgba(0,0,0,0.2)", px: 1, py: 0.5, borderRadius: 1 }}>
        Expires in: {timeLeft}
      </Typography>
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={stopImpersonation}
        sx={{ ml: 3 }}
      >
        Stop Impersonation
      </Button>
    </Paper>
  );
};

export default ImpersonationBanner;
