import React, { useState } from "react";
import api from "../services/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", { email, password });

      // ✅ هنا نخزن بيانات المستخدم بما فيها role
      // login(res.data.user, res.data.token);
      localStorage.setItem("token", res.data.token);

      // توجيه المستخدم حسب الـ role
      if (res.data.user.role === "admin") {
        navigate("/admin/dashboard"); // Admin يدخل لوحة التحكم
      } else {
        navigate("/"); // المستخدم العادي يدخل الصفحة الرئيسية
      }
    } catch (err) {
      console.error(err);
      setError("Login failed ❌. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px 30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2
          style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}
        >
          Login
        </h2>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: "#4a90e2",
              color: "#fff",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#357ABD")}
            onMouseOut={(e) => (e.target.style.background = "#4a90e2")}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <p style={{ color: "red", textAlign: "center" }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
