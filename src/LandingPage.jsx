import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "./services/axios";
import LandingNavbar from "./components/LandingNavbar";
import LandingFooter from "./components/LandingFooter";
import "./LandingPage.css";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api
      .get("/saas/plans")
      .then((res) => setPlans(res.data.data || []))
      .catch(console.error);
  }, []);

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const features = [
    {
      icon: "fas fa-calendar-check",
      title: t("Appointments"),
      desc: t("Smart scheduling, reminders, and online booking for patients."),
    },
    {
      icon: "fas fa-file-invoice-dollar",
      title: t("Invoices & Payments"),
      desc: t("Track payments, issue invoices, and manage billing with ease."),
    },
    {
      icon: "fas fa-boxes",
      title: t("Inventory & Supplies"),
      desc: t("Monitor stock levels and manage supplier purchases."),
    },
    {
      icon: "fas fa-chart-bar",
      title: t("Reports & Insights"),
      desc: t("Real-time dashboards and detailed clinic performance reports."),
    },
    {
      icon: "fas fa-users",
      title: t("Patient Records"),
      desc: t(
        "Comprehensive patient profiles, medical history, and timelines.",
      ),
    },
    {
      icon: "fas fa-building",
      title: t("Multi-Branch"),
      desc: t("Manage multiple clinic branches from one account."),
    },
  ];

  return (
    <div className="landing-page" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <LandingNavbar />

      {/* 🏆 Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>{t("Manage Your Dental Clinic Smarter")}</h1>
            <p>
              {t(
                "The all-in-one platform for dental clinics — appointments, invoices, inventory, reports, and more.",
              )}
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary-lg">
                <i className="fas fa-rocket me-2"></i>
                {t("Start Free Trial")}
              </Link>
              <Link to="/login" className="btn-outline-lg">
                <i className="fas fa-sign-in-alt me-2"></i>
                {t("Login")}
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">{t("Clinics")}</span>
              </div>
              <div className="stat">
                <span className="stat-number">50k+</span>
                <span className="stat-label">{t("Appointments Managed")}</span>
              </div>
              <div className="stat">
                <span className="stat-number">10M+</span>
                <span className="stat-label">{t("EGP Processed")}</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/images/dashboard-preview.png"
              alt={t("Dashboard Preview")}
            />
          </div>
        </div>
      </section>

      {/* ✨ Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <h2>{t("Everything You Need")}</h2>
            <p>
              {t(
                "From appointments to inventory, we've got every aspect of your clinic covered.",
              )}
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <i className={feature.icon}></i>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💲 Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>{t("Simple Pricing")}</h2>
            <p>
              {t(
                "Choose a plan that fits your clinic size. Upgrade anytime as you grow.",
              )}
            </p>
          </div>
          <div className="plans-grid">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${plan.is_active ? "" : "inactive"}`}
              >
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">
                    {formatCurrency(plan.price_monthly)}
                  </span>
                  <span className="period">/{t("mo")}</span>
                </div>
                <p className="plan-desc">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features &&
                    Array.isArray(plan.features) &&
                    plan.features.slice(0, 6).map((feature, i) => (
                      <li key={i}>
                        <i className="fas fa-check-circle"></i>
                        {feature}
                      </li>
                    ))}
                </ul>
                <Link to="/register" className="btn-plan">
                  {t("Get Started")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>{t("Ready to Transform Your Clinic?")}</h2>
          <p>
            {t(
              "Join hundreds of dental clinics already using our platform. Start your free 14-day trial today.",
            )}
          </p>
          <Link to="/register" className="btn-primary-lg">
            <i className="fas fa-rocket me-2"></i>
            {t("Start Free Trial")}
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
