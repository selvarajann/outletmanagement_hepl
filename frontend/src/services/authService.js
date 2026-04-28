const BASE = '/api/v1/auth';

export async function login(username, password) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        body: JSON.stringify({ username, password, email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
    return data.data;
}
