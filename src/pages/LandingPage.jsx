import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/axios";
import LandingNavbar from "../components/LandingNavbar";
import LandingFooter from "../components/LandingFooter";
import styles from "./LandingPage.module.css"; // ✅ استيراد كـ CSS Module

export default function LandingPage() {
  const { t, i18n } = useTranslation();
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
    <div className={styles.page} dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <LandingNavbar />

      {/* 🏆 Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroRow}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                {t("Manage Your Dental Clinic Smarter")}
              </h1>
              <p className={styles.heroSubtitle}>
                {t(
                  "The all-in-one platform for dental clinics — appointments, invoices, inventory, reports, and more.",
                )}
              </p>
              <div className={styles.heroActions}>
                <Link to="/register" className={styles.btnPrimary}>
                  <i className="fas fa-rocket me-2"></i>
                  {t("Start Free Trial")}
                </Link>
                <Link to="/login" className={styles.btnOutline}>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  {t("Login")}
                </Link>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>500+</span>
                  <span className={styles.statLabel}>{t("Clinics")}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>50k+</span>
                  <span className={styles.statLabel}>
                    {t("Appointments Managed")}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>10M+</span>
                  <span className={styles.statLabel}>{t("EGP Processed")}</span>
                </div>
              </div>
            </div>
            <div className={styles.heroImage}>
              <img
                src="/images/slider/wp9526009.jpg"
                alt={t("Dashboard Preview")}
                className={styles.heroImg}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✨ Features Section */}
      <section className={styles.features} id="features">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("Everything You Need")}</h2>
            <p className={styles.sectionSubtitle}>
              {t(
                "From appointments to inventory, we've got every aspect of your clinic covered.",
              )}
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <i className={`${feature.icon} ${styles.featureIcon}`}></i>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💲 Pricing Section */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("Simple Pricing")}</h2>
            <p className={styles.sectionSubtitle}>
              {t(
                "Choose a plan that fits your clinic size. Upgrade anytime as you grow.",
              )}
            </p>
          </div>
          <div className={styles.plansGrid}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.planCard} ${!plan.is_active ? styles.planCardInactive : ""}`}
              >
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>
                    {formatCurrency(plan.price_monthly)}
                  </span>
                  <span className={styles.planPeriod}>/{t("mo")}</span>
                </div>
                <p className={styles.planDesc}>{plan.description}</p>
                <ul className={styles.planFeatures}>
                  {plan.features &&
                    Array.isArray(plan.features) &&
                    plan.features.slice(0, 6).map((feature, i) => (
                      <li key={i} className={styles.planFeatureItem}>
                        <i
                          className={`fas fa-check-circle ${styles.planFeatureIcon}`}
                        ></i>
                        {feature}
                      </li>
                    ))}
                </ul>
                <Link to="/register" className={styles.btnPlan}>
                  {t("Get Started")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>
            {t("Ready to Transform Your Clinic?")}
          </h2>
          <p className={styles.ctaSubtitle}>
            {t(
              "Join hundreds of dental clinics already using our platform. Start your free 14-day trial today.",
            )}
          </p>
          <Link to="/register" className={styles.ctaButton}>
            <i className="fas fa-rocket me-2"></i>
            {t("Start Free Trial")}
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
