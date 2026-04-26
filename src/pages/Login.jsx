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
  const [errorDetails, setErrorDetails] = useState(""); // ✅ تفاصيل الخطأ
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorDetails("");

    try {
      console.log("🚀 Starting Login Request...");
      console.log("📧 Email:", email);
      console.log("🔗 URL:", api.defaults.baseURL + "/login");
      console.log("📋 Headers:", JSON.stringify(api.defaults.headers));

      const res = await api.post("/login", { email, password });

      console.log("✅ Login Success:", res.data);

      // ✅ استخدم البيانات اللي رجعت من الـ API
      login(res.data.user, res.data.token);

      // ✅ توجيه ذكي بناءً على نوع المستخدم والـ Tenant
      if (res.data.user.is_super_admin) {
        const savedCompany = localStorage.getItem("selectedCompany");
        if (!savedCompany || savedCompany === "" || savedCompany === "global") {
          navigate("/admin/saas");
        } else {
          navigate("/admin/erp");
        }
      } else if (res.data.user.role === "admin") {
        navigate("/admin/erp");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("❌ Login Error Details:");
      console.error("  - Type:", err.constructor.name);
      console.error("  - Message:", err.message);
      console.error("  - Code:", err.code);
      console.error("  - Status:", err.response?.status);
      console.error("  - Status Text:", err.response?.statusText);
      console.error("  - Response Data:", err.response?.data);
      console.error("  - Response Headers:", err.response?.headers);
      console.error("  - Request:", err.request);
      console.error("  - Config:", err.config);
      console.error("  - Full Error:", err);

      // ✅ عرض تفاصيل الخطأ للمستخدم
      if (err.response) {
        // السيرفر رد بخطأ
        setError(
          err.response.data?.message ||
            `Server Error (${err.response.status}): ${err.response.statusText}`,
        );
        setErrorDetails(
          `Status: ${err.response.status}\nData: ${JSON.stringify(err.response.data, null, 2)}`,
        );
      } else if (err.request) {
        // الطلب اتبعت لكن مفيش رد
        setError(
          "Network Error: No response from server. The server may be down.",
        );
        setErrorDetails(
          `Request was sent but no response received.\nURL: ${err.config?.url}\nMethod: ${err.config?.method}`,
        );
      } else {
        // خطأ في إعداد الطلب
        setError(`Request Error: ${err.message}`);
        setErrorDetails(`Error setting up request: ${err.message}`);
      }
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
                  <div>
                    <strong>{error}</strong>
                    {errorDetails && (
                      <pre
                        style={{
                          fontSize: "11px",
                          marginTop: "5px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {errorDetails}
                      </pre>
                    )}
                  </div>
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
