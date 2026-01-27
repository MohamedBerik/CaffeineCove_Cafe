import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../services/axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await api.post(
        "https://caffeinecoveapi-production-a107.up.railway.app/api/api/register",
        {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          role: "user",
          status: "1",
        },
      );

      localStorage.setItem("token", res.data.token);
      setSuccess("Registration successful 🎉");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.log("Registration error:", err.response?.data);
      setError(err.response?.data?.message || "Registration failed ❌");
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleRegister} style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>
          Register
        </button>

        <p style={styles.footer}>
          Already have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;

/* ================== Styles ================== */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },

  error: {
    background: "#ffe5e5",
    color: "#c0392b",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "12px",
    textAlign: "center",
  },

  success: {
    background: "#e5ffe5",
    color: "#27ae60",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "12px",
    textAlign: "center",
  },

  footer: {
    textAlign: "center",
    marginTop: "15px",
    fontSize: "14px",
  },

  link: {
    color: "#667eea",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
