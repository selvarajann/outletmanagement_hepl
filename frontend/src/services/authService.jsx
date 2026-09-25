const API_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${API_URL}/api/v1/auth`;

export async function login(username, password) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
    return data.data;
}

export async function register(username, password, email) {
    const res = await fetch(`${BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
    return data.data;
}

export async function refreshToken() {
    const res = await fetch(`${BASE}/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Refresh failed');
    return data.data;
}

export async function forgotPassword(email) {
    const res = await fetch(`${BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send reset email');
    return data;
}

export async function resetPassword(token, newPassword) {
    const res = await fetch(`${BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reset password');
    return data;
}

export async function changePassword(token, oldPassword, newPassword) {
    const res = await fetch(`${BASE}/change-password`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to change password');
    return data;
}
