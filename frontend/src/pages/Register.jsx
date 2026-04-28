import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import styles from './Auth.module.css';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
            setError('All fields are required.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Enter a valid email address.');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await register(form.username, form.password, form.email);
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Outlet Management</h1>
                    <p className={styles.subtitle}>Create a new account</p>
                </div>

                {error && <div className={styles.alert}>{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className={styles.field}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Enter username"
                            value={form.username}
                            onChange={handleChange}
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter email"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="confirm">Confirm Password</label>
                        <input
                            id="confirm"
                            name="confirm"
                            type="password"
                            placeholder="Re-enter password"
                            value={form.confirm}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <button className={styles.btn} type="submit" disabled={loading}>
                        {loading && <span className={styles.spinner} />}
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
