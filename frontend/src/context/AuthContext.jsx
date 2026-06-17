import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import impersonationService from "../services/impersonationService";
import { toast } from "react-toastify";

export const AuthContext = createContext();

/**
 * Decodes a JWT payload without verifying the signature.
 * Used only to read display fields (sub, role, exp) — the server validates the signature.
 */
function decodePayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

/**
 * Returns true if the token's `exp` claim is in the past.
 */
function isTokenExpired(token) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logoutCalled = useRef(false); // prevent double-call on StrictMode

  const [impersonation, setImpersonation] = useState(() => {
    const saved = sessionStorage.getItem("impersonation");
    return saved ? JSON.parse(saved) : null;
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  // Calls the backend so it can clear the HttpOnly refresh-token cookie.
  const handleLogout = useCallback(async () => {
    if (logoutCalled.current) return;
    logoutCalled.current = true;

    try {
      // Ask backend to clear the HttpOnly cookie
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Network failure — still clear local state
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      sessionStorage.removeItem("impersonation");
      setUser(null);
      setRole(null);
      setToken(null);
      setImpersonation(null);
      logoutCalled.current = false;
      navigate("/login");
    }
  }, [navigate]);

  // ── Bootstrap: restore session from localStorage ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (token) {
      // Guard: if access token is already expired on mount, clear the stale session.
      // The Axios interceptor will handle silent refresh for in-flight requests;
      // this guard handles the "closed browser and reopened hours later" case.
      if (isTokenExpired(token)) {
        // Don't call handleLogout (avoid navigate before router is ready).
        // Just clear storage — axiosInstance will trigger /refresh on first API call.
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        setToken(null);
        setLoading(false);
        return;
      }

      const payload = decodePayload(token);
      if (payload) {
        setUser(payload.sub);
        const resolvedRole = storedRole || payload.role || "SUPER_ADMIN";
        setRole(resolvedRole);
        if (!storedRole) localStorage.setItem("role", resolvedRole);
      } else {
        handleLogout();
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = useCallback((token, userRole) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", userRole);
    const payload = decodePayload(token);
    setUser(payload?.sub ?? "user");
    setRole(userRole);
    setToken(token);
    if (payload?.sub) localStorage.setItem("user", payload.sub);
  }, []);

  const handleStartImpersonation = useCallback(async (targetUserId) => {
    const data = await impersonationService.startImpersonation(targetUserId);
    const impState = {
      adminToken: localStorage.getItem("token"),
      adminRole: localStorage.getItem("role"),
      adminUser: localStorage.getItem("user"),
      token: data.impersonationToken,
      targetUsername: data.targetUsername,
      targetRole: data.targetRole,
      expiresAt: data.expiresAt,
      sessionId: data.sessionId,
    };
    
    sessionStorage.setItem("impersonation", JSON.stringify(impState));
    
    localStorage.setItem("token", data.impersonationToken);
    localStorage.setItem("role", data.targetRole);
    localStorage.setItem("user", data.targetUsername);
    
    setImpersonation(impState);
    setToken(data.impersonationToken);
    setRole(data.targetRole);
    setUser(data.targetUsername);
    
    if (data.targetRole === "SALES_OPERATOR") {
      window.location.href = "/pos";
    } else {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleStopImpersonation = useCallback(async () => {
    if (!impersonation) return;
    try {
      // Temporarily restore admin token in localStorage so axiosInstance uses it for the /end call
      localStorage.setItem("token", impersonation.adminToken);
      await impersonationService.endImpersonation();
    } catch (e) {
      console.error("Failed to call backend end impersonation", e);
      toast.error("Failed to end impersonation: " + (e.response?.data?.message || e.message));
    } finally {
      localStorage.setItem("token", impersonation.adminToken);
      localStorage.setItem("role", impersonation.adminRole);
      localStorage.setItem("user", impersonation.adminUser);
      
      setToken(impersonation.adminToken);
      setRole(impersonation.adminRole);
      setUser(impersonation.adminUser);
      
      sessionStorage.removeItem("impersonation");
      setImpersonation(null);
      
      toast.success("Impersonation ended. Restored original session.");
      window.location.href = "/admin/impersonation";
    }
  }, [impersonation]);

  useEffect(() => {
    if (!impersonation) return;
    const interval = setInterval(() => {
      if (new Date(impersonation.expiresAt).getTime() <= Date.now() || isTokenExpired(localStorage.getItem("token"))) {
        handleStopImpersonation();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [impersonation, handleStopImpersonation]);

  return (
    <AuthContext.Provider value={{ 
      user, role, token, loading,
      impersonation, isImpersonating: !!impersonation,
      login: handleLogin, logout: handleLogout,
      startImpersonation: handleStartImpersonation,
      stopImpersonation: handleStopImpersonation 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

