import { login } from "../services/authService";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Visibility,
  VisibilityOff,
  ShieldOutlined as ShieldIcon,
  ScheduleOutlined as ScheduleIcon,
  CheckCircleOutline as CheckIcon,
  ArrowForward,
  PersonOutline as PersonIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

// ── Brand blue ────────────────────────────────────────────────────────────────
const BLUE       = "#4f46e5";
const BLUE_DARK  = "#4338ca";
const BLUE_LIGHT = "#e0e7ff";
const BLUE_TEXT  = "#3730a3";

// ── Custom SVG icon — identical to the one shown in login page reference ───────
export const OutletLogoSVG = ({ size = 56 }) => {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Awning top bar */}
      <rect x="8" y="14" width="40" height="11" rx="2" fill={BLUE} />
      {/* Awning stripe shading */}
      <rect x="8"  y="14" width="7.5" height="11" fill={BLUE_DARK} opacity="0.45" />
      <rect x="24" y="14" width="7.5" height="11" fill={BLUE_DARK} opacity="0.45" />
      <rect x="40.5" y="14" width="7.5" height="11" fill={BLUE_DARK} opacity="0.45" />
      {/* Fringe scallops */}
      <path d="M8 25 Q11.5 31 15 25 Q18.5 31 22 25 Q25.5 31 29 25 Q32.5 31 36 25 Q39.5 31 43 25 Q46.5 31 48 25"
        stroke={BLUE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Store body */}
      <rect x="12" y="25" width="32" height="17" rx="1.5" fill="#ffffff" stroke={BLUE} strokeWidth="1.4" />
      {/* Left window */}
      <rect x="14" y="27" width="7" height="6" rx="1" fill={BLUE_LIGHT} stroke={BLUE} strokeWidth="1" />
      {/* Right window */}
      <rect x="35" y="27" width="7" height="6" rx="1" fill={BLUE_LIGHT} stroke={BLUE} strokeWidth="1" />
      {/* Door */}
      <rect x="23" y="33" width="10" height="9" rx="1" fill={BLUE_LIGHT} stroke={BLUE} strokeWidth="1.2" />
      {/* Door knob */}
      <circle cx="31.5" cy="37.5" r="1" fill={BLUE} />
    </svg>
  );
};

// ── Left panel feature list ───────────────────────────────────────────────────
// Using inline SVGs instead of MUI icons so there's no import clash with sidebar
const InventorySVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const SalesSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const ChartSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const StoreSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const features = [
  { Icon: InventorySVG, label: "Inventory Management" },
  { Icon: SalesSVG,    label: "Sales & Billing" },
  { Icon: ChartSVG,    label: "Reports & Analytics" },
  { Icon: StoreSVG,    label: "Multi-Outlet Support" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    return e;
  };

  const handleLogin = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await login(username, password);
      authLogin(data.token, data.role);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setUsername("admin");
    setPassword("password123");
    setErrors({});
    setLoading(true);
    try {
      const data = await login("admin", "password123");
      authLogin(data.token, data.role);
      toast.success("Welcome to the Demo!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <>
      {/* ── Responsive CSS ────────────────────────────────────────────────────── */}
      <style>{`
        /* Spinner */
        @keyframes om-spin { to { transform: rotate(360deg); } }

        /* Focus rings */
        .om-input { outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .om-input:focus { border-color: ${BLUE} !important; box-shadow: 0 0 0 3px ${BLUE}22 !important; }

        /* Sign-in button hover */
        .om-submit:hover:not(:disabled) { background: ${BLUE_DARK} !important; }
        .om-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .om-submit:focus-visible { outline: 3px solid ${BLUE}55; outline-offset: 2px; }

        /* Forgot link hover */
        .om-forgot:hover { text-decoration: underline; }

        /* ── Layout: default = side-by-side ──────────────────────────────────── */
        .om-root       { display: flex; min-height: 100vh; font-family: 'Inter','Segoe UI',system-ui,sans-serif; -webkit-font-smoothing: antialiased; }
        .om-left       { flex: 0 0 42%; position: relative; background-image: url('/outlet-store-bg.jpg');
                         background-size: cover; background-position: center top; display: flex;
                         align-items: flex-end; overflow: hidden; }
        .om-left-over  { position: absolute; inset: 0;
                         background: linear-gradient(160deg,rgba(15,23,42,0.84) 0%,rgba(15,23,42,0.60) 60%,rgba(15,23,42,0.90) 100%); }
        .om-left-cnt   { position: relative; z-index: 1; padding: 40px 36px; width: 100%; }
        .om-right      { flex: 1; display: flex; align-items: center; justify-content: center;
                         background: #ffffff; position: relative; padding: 32px 24px;
                         margin-left: -24px; border-radius: 24px 0 0 24px; z-index: 10;
                         box-shadow: -12px 0 35px rgba(0,0,0,0.15); }
        .om-version    { position: absolute; top: 16px; right: 20px; font-size: 11px; color: #94a3b8; font-weight: 500; }
        .om-card       { width: 100%; max-width: 380px; display: flex; flex-direction: column; align-items: center; }

        /* Left panel typography */
        .om-brand-title    { margin: 0; font-size: 2.4rem; font-weight: 800; line-height: 1.1; color: #fff; letter-spacing: -0.5px; }
        .om-brand-accent   { color: #818cf8; }
        .om-brand-sub      { margin: 12px 0 0; font-size: 1rem; color: rgba(255,255,255,0.82); line-height: 1.55; }
        .om-features       { list-style: none; margin: 0 0 28px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .om-feat-item      { display: flex; align-items: center; gap: 12px; }
        .om-feat-icon      { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.13);
                             display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .om-feat-label     { font-size: 0.9rem; color: rgba(255,255,255,0.92); font-weight: 500; }
        .om-tagline        { margin: 0; font-size: 1.05rem; color: #818cf8; font-style: italic; line-height: 1.5; font-weight: 500; }

        /* Right panel elements */
        .om-app-name       { margin: 4px 0 2px; font-size: 1.2rem; font-weight: 700; color: #0f172a;
                             letter-spacing: -0.3px; text-align: center; }
        .om-app-tagline    { margin: 0 0 18px; font-size: 12.5px; color: #64748b; text-align: center; }
        .om-welcome        { margin: 0 0 4px; font-size: 1.35rem; font-weight: 800; color: #0f172a;
                             letter-spacing: -0.4px; text-align: center; }
        .om-welcome-sub    { margin: 0 0 22px; font-size: 13.5px; color: #64748b; text-align: center; line-height: 1.5; }

        .om-form           { width: 100%; display: flex; flex-direction: column; gap: 13px; }
        .om-field          { display: flex; flex-direction: column; gap: 5px; }
        .om-label          { font-size: 13px; font-weight: 600; color: #374151; }
        .om-input-wrap     { position: relative; }
        .om-icon-left      { position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
                             display: flex; align-items: center; pointer-events: none; }
        .om-input          { width: 100%; height: 40px; padding: 0 14px 0 36px; font-size: 13.5px; color: #0f172a;
                             background: #fff; border: 1px solid #d1d5db; border-radius: 7px;
                             box-sizing: border-box; font-family: inherit; }
        .om-input.has-toggle { padding-right: 44px; }
        .om-input.error    { border-color: #ef4444; }
        .om-toggle         { position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                             background: none; border: none; cursor: pointer; padding: 4px;
                             display: flex; align-items: center; line-height: 1; color: #64748b; }
        .om-error-text     { font-size: 11.5px; color: #ef4444; font-weight: 500; }

        .om-row            { display: flex; align-items: center; justify-content: space-between; }
        .om-check-label    { display: flex; align-items: center; gap: 7px; cursor: pointer; }
        .om-checkbox       { width: 15px; height: 15px; accent-color: ${BLUE}; cursor: pointer; }
        .om-check-text     { font-size: 13px; color: #374151; }
        .om-forgot         { font-size: 13px; color: ${BLUE_TEXT}; font-weight: 600; text-decoration: none; }

        .om-submit         { display: flex; align-items: center; justify-content: center; width: 100%;
                             height: 44px; background: ${BLUE}; color: #fff; border: none; border-radius: 7px;
                             font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s;
                             font-family: inherit; margin-top: 4px; gap: 6px; }

        .om-demo-btn       { display: flex; align-items: center; justify-content: center; width: 100%;
                             height: 44px; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; border-radius: 7px;
                             font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
                             font-family: inherit; margin-top: 8px; gap: 6px; }
        .om-demo-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; }

        .om-spinner        { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
                             border-top-color: #fff; border-radius: 50%; animation: om-spin 0.7s linear infinite; }

        .om-trust          { margin-top: 24px; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 16px;
                             display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .om-trust-label    { font-size: 11.5px; color: #94a3b8; font-weight: 500; }
        .om-trust-icons    { display: flex; gap: 20px; align-items: center; }
        .om-trust-item     { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .om-trust-item-lbl { font-size: 11px; color: #94a3b8; font-weight: 500; }

        /* ── Tablet: left panel narrower ─────────────────────────────────────── */
        @media (max-width: 900px) {
          .om-left       { flex: 0 0 36%; }
          .om-left-cnt   { padding: 28px 22px; }
          .om-brand-title { font-size: 1.9rem; }
        }

        /* ── Mobile: stack — premium bottom-sheet style ─────────────────────── */
        @media (max-width: 640px) {
          .om-root       { flex-direction: column; min-height: 100vh; background: #ffffff; }
          .om-left       { flex: 0 0 auto; height: 35vh; min-height: 240px; align-items: center; justify-content: center; width: 100%; }
          .om-left-cnt   { padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: -24px; }
          .om-brand-title { font-size: 1.8rem; text-align: center; }
          .om-brand-title br { display: none; }
          .om-brand-sub  { font-size: 0.95rem; margin-top: 8px; text-align: center; }
          .om-features   { display: none; }
          .om-tagline    { display: none; }
          
          .om-right      { flex: 1; padding: 32px 24px; align-items: flex-start; margin-top: -32px; margin-left: 0; width: 100%; box-sizing: border-box; border-radius: 28px 28px 0 0; background: #ffffff; box-shadow: 0 -10px 30px rgba(0,0,0,0.12); z-index: 10; }
          .om-version    { top: 12px; right: 20px; }
          .om-card       { max-width: 100%; padding-top: 8px; }
          .om-welcome    { font-size: 1.3rem; }
        }

        /* ── Very small screens ───────────────────────────────────────────────── */
        @media (max-width: 360px) {
          .om-left { min-height: 210px; }
          .om-brand-title { font-size: 1.6rem; }
          .om-right { padding: 24px 16px; margin-top: -24px; margin-left: 0; width: 100%; box-sizing: border-box; border-radius: 20px 20px 0 0; }
        }
      `}</style>

      <div className="om-root">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="om-left">
          <div className="om-left-over" />
          <div className="om-left-cnt">
            <h1 className="om-brand-title">
              Outlet<br />
              <span className="om-brand-accent">Management</span>
            </h1>
            <p className="om-brand-sub">Manage your store.<br />Grow your business.</p>

            <ul className="om-features" style={{ marginTop: 24 }}>
              {features.map(({ Icon, label }) => (
                <li key={label} className="om-feat-item">
                  <span className="om-feat-icon"><Icon /></span>
                  <span className="om-feat-label">{label}</span>
                </li>
              ))}
            </ul>

            <p className="om-tagline"><em>Simple Tools<br />for a Smarter Store</em></p>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="om-right">
          <span className="om-version">v1.0.0</span>

          <div className="om-card fade-up">

            {/* Logo */}
            <OutletLogoSVG size={54} />

            {/* App name */}
            <h2 className="om-app-name">Outlet Management</h2>
            <p className="om-app-tagline">Retail Operations Made Easy</p>

            {/* Heading */}
            <h3 className="om-welcome">Welcome back!</h3>
            <p className="om-welcome-sub">Sign in to continue to your outlet.</p>

            {/* Form */}
            <div className="om-form">

              {/* Username */}
              <div className="om-field">
                <label className="om-label" htmlFor="login-username">Username</label>
                <div className="om-input-wrap">
                  <span className="om-icon-left">
                    <PersonIcon style={{ fontSize: 17, color: "#94a3b8" }} />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    className={`om-input${errors.username ? " error" : ""}`}
                    value={username}
                    placeholder="Enter your username"
                    autoComplete="username"
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {errors.username && <span className="om-error-text">{errors.username}</span>}
              </div>

              {/* Password */}
              <div className="om-field">
                <label className="om-label" htmlFor="login-password">Password</label>
                <div className="om-input-wrap">
                  <span className="om-icon-left">
                    <LockIcon style={{ fontSize: 17, color: "#94a3b8" }} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className={`om-input has-toggle${errors.password ? " error" : ""}`}
                    value={password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    className="om-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword
                      ? <VisibilityOff style={{ fontSize: 17 }} />
                      : <Visibility   style={{ fontSize: 17 }} />}
                  </button>
                </div>
                {errors.password && <span className="om-error-text">{errors.password}</span>}
              </div>

              {/* Remember me + Forgot */}
              <div className="om-row">
                <label className="om-check-label">
                  <input
                    type="checkbox"
                    className="om-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="om-check-text">Remember me</span>
                </label>
                <Link to="/forgot-password" className="om-forgot">
                  Forgot Password?
                </Link>
              </div>

              {/* Sign In */}
              <button
                id="login-submit"
                type="button"
                className="om-submit"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <><span className="om-spinner" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowForward style={{ fontSize: 16 }} /></>
                )}
              </button>

              {/* Demo Login */}
              <button
                type="button"
                className="om-demo-btn"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                <PersonIcon style={{ fontSize: 18 }} /> Quick Demo Login
              </button>
            </div>

            {/* Trust bar */}
            <div className="om-trust">
              <span className="om-trust-label">Trusted by growing businesses</span>
              <div className="om-trust-icons">
                {[
                  { Icon: ShieldIcon,   label: "Secure Access" },
                  { Icon: CheckIcon,    label: "Reliable" },
                  { Icon: ScheduleIcon, label: "Always On" },
                ].map(({ Icon, label }) => (
                  <div key={label} className="om-trust-item">
                    <Icon style={{ fontSize: 18, color: "#64748b" }} />
                    <span className="om-trust-item-lbl">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default Login;
