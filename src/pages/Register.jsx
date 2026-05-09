import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/axios";
import { useTranslation } from "react-i18next";
import "./Register.css";

function Register() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password !== passwordConfirmation) {
      setError(t("Passwords do not match"));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("Password must be at least 6 characters"));
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        clinic_name: clinicName,
      });

      localStorage.setItem("token", res.data.token);
      setSuccess(t("Registration successful! 🎉"));
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.log("Registration error:", err.response?.data);

      // Handle validation errors from backend
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0]?.[0];
        setError(firstError || t("Registration failed"));
      } else {
        setError(errorData?.message || t("Registration failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="register-container">
        {/* Left Side - Branding */}
        <div className="register-brand">
          <div className="brand-content">
            <div className="brand-icon">
              <i className="fas fa-tooth"></i>
            </div>
            <h1>{t("Start Managing Your Clinic")}</h1>
            <p>
              {t(
                "Create your clinic account to manage appointments, doctors, patients, invoices, and more.",
              )}
            </p>
            <div className="brand-features">
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Full Clinic Management")}</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Multi-Branch Support")}</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Financial Reports")}</span>
              </div>
              <div className="feature">
                <i className="fas fa-check-circle"></i>
                <span>{t("Secure & Private")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="register-form-container">
          <div className="register-form-wrapper">
            <div className="form-header">
              <h2>{t("Create Your Clinic")}</h2>
              <p>{t("Get started with a 14-day free trial")}</p>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="name">
                  <i className="fas fa-user"></i>
                  {t("Full Name")}
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder={t("Enter your full name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="clinic_name">
                  <i className="fas fa-clinic-medical"></i>
                  {t("Clinic Name")}
                </label>
                <input
                  type="text"
                  id="clinic_name"
                  placeholder={t("Enter your clinic name")}
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                />
              </div>

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
                    placeholder={t("Create a password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                <div className="password-hint">
                  <i className="fas fa-info-circle"></i>
                  {t("Password must be at least 6 characters")}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">
                  <i className="fas fa-lock"></i>
                  {t("Confirm Password")}
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    placeholder={t("Confirm your password")}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword
                        ? t("Hide password")
                        : t("Show password")
                    }
                  >
                    <i
                      className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    {t("Creating account...")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    {t("Create Account")}
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                {t("Already have an account?")}{" "}
                <Link to="/login">{t("Sign in")}</Link>
              </p>
            </div>

            <div className="terms-text">
              <p>
                {t("By creating an account, you agree to our")}{" "}
                <Link to="/terms">{t("Terms of Service")}</Link> {t("and")}{" "}
                <Link to="/privacy">{t("Privacy Policy")}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
