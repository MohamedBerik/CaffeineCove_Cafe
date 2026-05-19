import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // ✅ أضف useLocation
import { useTranslation } from "react-i18next";
import api from "../services/axios";
import "./LandingNavbar.css";

export default function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation(); // ✅ لمعرفة الصفحة الحالية
  const [platformName, setPlatformName] = useState("My Platform");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // جلب اسم المنصة من الإعدادات العامة
    api
      .get("/public/platform-info")

      .then((res) => {
        if (res.data?.name) setPlatformName(res.data.name);
      })
      .catch(() => {});

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  // ✅ دالة التمرير الذكية
  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      // إذا كنا بالفعل في صفحة الهبوط، مرر مباشرة
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      // إذا كنا في صفحة أخرى، انتقل إلى صفحة الهبوط مع hash
      window.location.href = `/#${id}`;
    }
  };

  return (
    <nav className={`landing-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="landing-navbar-container">
        <div className="landing-navbar-brand">
          <i className="fa-clinic-medical"></i>
          <span>{platformName}</span>
        </div>

        <ul className="navbar-links">
          <li>
            <button onClick={() => scrollToSection("features")}>
              {t("Features")}
            </button>
          </li>
          <li>
            <button onClick={() => scrollToSection("pricing")}>
              {t("Pricing")}
            </button>
          </li>
          <li>
            <Link to="/contact">{t("Contact Us")}</Link>
          </li>
          <li>
            <button onClick={toggleLanguage} className="lang-btn">
              <i className="fas fa-globe"></i>{" "}
              {i18n.language === "en" ? "AR" : "EN"}
            </button>
          </li>
        </ul>

        <div className="navbar-actions">
          <Link to="/login" className="btn-login">
            {t("Login")}
          </Link>
          <Link to="/register" className="btn-trial">
            {t("Start Free Trial")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
