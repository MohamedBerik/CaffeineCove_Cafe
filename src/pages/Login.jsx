import React, { useState } from "react";
import api from "../services/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", { email, password });

      // ✅ تخزين بيانات المستخدم بما فيها role
      login(res.data.user, res.data.token);

      // توجيه المستخدم حسب الـ role
      if (res.data.user.role === "admin") {
        navigate("/admin/erp"); // Admin يدخل لوحة التحكم
      } else {
        navigate("/"); // المستخدم العادي يدخل الصفحة الرئيسية
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          t("Login failed. Please check your email and password."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-icon">
              <i className="fas fa-tooth"></i>
            </div>
            <h1>{t("Dental Care Clinic")}</h1>
            <p>
              {t("Your trusted partner in dental health and beautiful smiles")}
            </p>
            <div className="brand-features">
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Expert Dentists")}</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Modern Equipment")}</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Pain-Free Treatments")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="form-header">
              <h2>{t("Welcome Back")}</h2>
              <p>{t("Please login to your account")}</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  {t("Email Address")}
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder={t("Enter your email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  {t("Password")}
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder={t("Enter your password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? t("Hide password") : t("Show password")
                    }
                  >
                    <i
                      className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>{t("Remember me")}</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  {t("Forgot Password?")}
                </Link>
              </div>

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    {t("Logging in...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    {t("Login")}
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                {t("Don't have an account?")}{" "}
                <Link to="/register">{t("Sign up")}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
