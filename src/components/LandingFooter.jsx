import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/axios";
import "./LandingFooter.css";

export default function LandingFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [platformName, setPlatformName] = useState("My Platform");

  useEffect(() => {
    api
      .get("/public/platform-info")
      .then((res) => {
        if (res.data?.name) setPlatformName(res.data.name);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="footer-info">
          <i className="fas fa-tooth"></i>
          <span>{platformName}</span>
          <p>{t("Smart Dental Practice Management")}</p>
        </div>

        <div className="footer-links">
          <a href="#">{t("Privacy Policy")}</a>
          <a href="#">{t("Terms of Service")}</a>
          <Link to="/contact">{t("Contact Us")}</Link>
        </div>

        <div className="footer-copy">
          &copy; {currentYear} {platformName}. {t("All rights reserved.")}
        </div>
      </div>
    </footer>
  );
}
