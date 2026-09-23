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
    background:
      "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
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
    background:
      "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "8px",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
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

  success: {
    background: "#E6FFF8",
    color: "#00796B",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "12px",
    marginBottom: "16px",
    border: "1px solid #B2DFDB",
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

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check all fields
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Check password length
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Check passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      // Clear form
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.iconBox}>
          💼
        </div>

        {/* Heading */}
        <h1 style={styles.title}>
          Create Account
        </h1>

        <p style={styles.subtitle}>
          Start managing your finances with BudgetMate
        </p>

        {/* Error */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>

          {/* Full Name */}
          <div style={styles.field}>
            <label style={styles.label}>
              Full Name
            </label>

            <input
              style={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          {/* Email */}
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
              disabled={loading}
            />
          </div>

          {/* Password */}
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
              placeholder="Create a password"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div style={styles.field}>
            <label style={styles.label}>
              Confirm Password
            </label>

            <input
              style={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          {/* Register button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        {/* Login link */}
        <p style={styles.bottomText}>
          Already have an account?{" "}

          <Link
            to="/login"
            style={styles.link}
          >
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}