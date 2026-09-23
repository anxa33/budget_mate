import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    padding: "40px 16px",
    boxSizing: "border-box",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 8px 40px rgba(108, 99, 255, 0.10)",
    padding: "38px 34px",
    width: "100%",
    maxWidth: "360px",
    boxSizing: "border-box",
  },

  iconBox: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "18px",
  },

  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1A1A2E",
    margin: "0 0 4px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#9A94BC",
    margin: "0 0 26px",
  },

  field: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: "6px",
  },

  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #E8E3FF",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#1A1A2E",
    background: "#FAFAFE",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  button: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "8px",
  },

  error: {
    background: "#FFF0F0",
    color: "#D32F2F",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "12px",
    marginBottom: "16px",
    border: "1px solid #FFCDD2",
  },

  bottomText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "13px",
    color: "#9A94BC",
  },

  link: {
    color: "#6C63FF",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      navigate("/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.iconBox}>
          💼
        </div>

        <h1 style={styles.title}>
          Welcome Back!
        </h1>

        <p style={styles.subtitle}>
          Login to continue your journey
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div style={styles.field}>
            <label style={styles.label}>
              Email
            </label>

            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Password
            </label>

            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p style={styles.bottomText}>
          Don't have an account?{" "}

          <Link
            to="/register"
            style={styles.link}
          >
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}