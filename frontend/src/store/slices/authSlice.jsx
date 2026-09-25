import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import impersonationService from '../../services/impersonationService';
import { toast } from 'react-toastify';

/**
 * Decodes a JWT payload without verifying the signature.
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
export function isTokenExpired(token) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

const getInitialState = () => {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");
  
  let user = null;
  let role = null;
  let isTokenValid = false;

  if (token) {
    if (!isTokenExpired(token)) {
      const payload = decodePayload(token);
      if (payload) {
        user = payload.sub;
        role = storedRole || payload.role || "SUPER_ADMIN";
        isTokenValid = true;
      }
    } else {
      // Clear stale session
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    }
  }

  const savedImpersonation = sessionStorage.getItem("impersonation");
  const impersonation = savedImpersonation ? JSON.parse(savedImpersonation) : null;

  return {
    user,
    role,
    token: isTokenValid ? token : null,
    loading: false, // We initialize synchronously now via Redux
    impersonation,
  };
};

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Network failure — still clear local state
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    sessionStorage.removeItem("impersonation");
    
    // Using window.location.href to fully refresh state and navigate
    window.location.href = "/login";
  }
);

export const startImpersonation = createAsyncThunk(
  'auth/startImpersonation',
  async (targetUserId, { dispatch }) => {
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
    
    dispatch(setImpersonationState(impState));
    
    if (data.targetRole === "SALES_OPERATOR") {
      window.location.href = "/pos";
    } else {
      window.location.href = "/dashboard";
    }
  }
);

export const stopImpersonation = createAsyncThunk(
  'auth/stopImpersonation',
  async (_, { getState, dispatch }) => {
    const { impersonation } = getState().auth;
    if (!impersonation) return;
    
    try {
      localStorage.setItem("token", impersonation.adminToken);
      await impersonationService.endImpersonation();
    } catch (e) {
      console.error("Failed to call backend end impersonation", e);
      toast.error("Failed to end impersonation: " + (e.response?.data?.message || e.message));
    } finally {
      localStorage.setItem("token", impersonation.adminToken);
      localStorage.setItem("role", impersonation.adminRole);
      localStorage.setItem("user", impersonation.adminUser);
      sessionStorage.removeItem("impersonation");
      
      dispatch(clearImpersonationState());
      
      toast.success("Impersonation ended. Restored original session.");
      window.location.href = "/admin/impersonation";
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setLoginState: (state, action) => {
      const { token, role, user } = action.payload;
      state.user = user;
      state.role = role;
      state.token = token;
    },
    setImpersonationState: (state, action) => {
      const data = action.payload;
      state.impersonation = data;
      state.token = data.token;
      state.role = data.targetRole;
      state.user = data.targetUsername;
    },
    clearImpersonationState: (state) => {
      if (state.impersonation) {
        state.token = state.impersonation.adminToken;
        state.role = state.impersonation.adminRole;
        state.user = state.impersonation.adminUser;
      }
      state.impersonation = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.role = null;
      state.token = null;
      state.impersonation = null;
    });
  }
});

export const { setLoginState, setImpersonationState, clearImpersonationState } = authSlice.actions;

export const loginSuccess = ({ token, role }) => (dispatch) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  const payload = decodePayload(token);
  
  if (payload?.sub) {
    localStorage.setItem("user", payload.sub);
  }
  
  dispatch(setLoginState({ token, role, user: payload?.sub ?? "user" }));
};

export default authSlice.reducer;
