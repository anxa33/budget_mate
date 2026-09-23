import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    padding: "40px 16px",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1A1A2E",
    marginBottom: 36,
    letterSpacing: "-0.5px",
  },
  wrapper: {
    display: "flex",
    gap: 28,
    width: "100%",
    maxWidth: 820,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(108,99,255,0.10)",
    padding: "38px 34px",
    flex: "1 1 320px",
    maxWidth: 360,
    minWidth: 290,
  },
  iconBox: {
    width: 52,
    height: 52,
    background: "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1A1A2E",
    margin: "0 0 4px",
  },
  cardSub: {
    fontSize: 13,
    color: "#9A94BC",
    margin: "0 0 26px",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#1A1A2E",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #E8E3FF",
    borderRadius: 10,
    fontSize: 13,
    color: "#1A1A2E",
    background: "#FAFAFE",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s",
    fontFamily: "inherit",
  },
  inputFocus: {
    border: "1.5px solid #6C63FF",
    background: "#fff",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9A94BC",
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
  },
  forgotLink: {
    display: "block",
    textAlign: "right",
    fontSize: 12,
    color: "#6C63FF",
    cursor: "pointer",
    textDecoration: "none",
    marginTop: 6,
    marginBottom: 24,
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s, transform 0.1s",
    fontFamily: "inherit",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  bottomText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
    color: "#9A94BC",
  },
  link: {
    color: "#6C63FF",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
  },
  field: { marginBottom: 16 },
  error: {
    background: "#FFF0F0",
    color: "#D32F2F",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    marginBottom: 16,
    border: "1px solid #FFCDD2",
  },
  success: {
    background: "#E6FFF8",
    color: "#00796B",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    marginBottom: 16,
    border: "1px solid #B2DFDB",
  },
  divider: {
    height: "100%",
    width: 1,
    background: "#EEE8FF",
    alignSelf: "stretch",
  },
};

function PasswordInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.passwordWrapper}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Enter your password"}
        style={{ ...styles.input, paddingRight: 40, ...(focused ? styles.inputFocus : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button style={styles.eyeBtn} onClick={() => setShow(!show)} type="button">
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function TextInput({ id, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...styles.input, ...(focused ? styles.inputFocus : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function LoginCard({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess(`Welcome back, ${data.user.name}! ✓`);
      if (onLoginSuccess) onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.iconBox}>💼</div>
      <p style={styles.cardTitle}>Welcome Back!</p>
      <p style={styles.cardSub}>Login to continue your journey</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.field}>
        <label style={styles.label} htmlFor="login-email">Email</label>
        <TextInput id="login-email" type="email" value={form.email} onChange={set("email")} placeholder="Enter your email" />
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="login-password">Password</label>
        <PasswordInput id="login-password" value={form.password} onChange={set("password")} />
      </div>

      <a style={styles.forgotLink}>Forgot password?</a>

      <button
        style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Logging in…" : "Login"}
      </button>

      <p style={styles.bottomText}>
        Don't have an account?{" "}
        <a style={styles.link}>Register</a>
      </p>
    </div>
  );
}

function RegisterCard({ onRegisterSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      // backend returns { message, user_id } — not "name" — so use the name we already have
      setSuccess(`Account created for ${form.name}! You can now log in. ✓`);
      setForm({ name: "", email: "", password: "", confirm: "" });
      if (onRegisterSuccess) onRegisterSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.iconBox}>👜</div>
      <p style={styles.cardTitle}>Create Account</p>
      <p style={styles.cardSub}>Start tracking your finances</p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.field}>
        <label style={styles.label} htmlFor="reg-name">Name</label>
        <TextInput id="reg-name" value={form.name} onChange={set("name")} placeholder="Enter your name" />
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="reg-email">Email</label>
        <TextInput id="reg-email" type="email" value={form.email} onChange={set("email")} placeholder="Enter your email" />
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="reg-password">Password</label>
        <PasswordInput id="reg-password" value={form.password} onChange={set("password")} placeholder="Create a password" />
      </div>

      <div style={{ ...styles.field, marginBottom: 24 }}>
        <label style={styles.label} htmlFor="reg-confirm">Confirm Password</label>
        <PasswordInput id="reg-confirm" value={form.confirm} onChange={set("confirm")} placeholder="Confirm your password" />
      </div>

      <button
        style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "Creating account…" : "Register"}
      </button>

      <p style={styles.bottomText}>
        Already have an account?{" "}
        <a style={styles.link}>Login</a>
      </p>
    </div>
  );
}

export default function LoginRegister() {
  const handleLoginSuccess = (user) => {
    console.log("Logged in:", user);
    // Navigate to dashboard here, e.g.: navigate("/dashboard")
  };

  return (
    <div style={styles.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <h1 style={styles.heading}>1. Login / Register Screens</h1>
      <div style={styles.wrapper}>
        <LoginCard onLoginSuccess={handleLoginSuccess} />
        <RegisterCard />
      </div>
    </div>
  );
}
