import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Footer.css";

function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="frontend-footer" id="contact">
      <div className="frontend-footer-container">
        <div className="frontend-footer-grid">
          {/* Opening Hours Section */}
          <div className="frontend-footer-section">
            <h5 className="frontend-footer-title">
              <i className="fas fa-clock"></i>
              {t("Opening Hours")}
            </h5>
            <ul className="frontend-hours-list">
              <li>
                <span className="frontend-day">{t("Sunday")}</span>
                <span className="frontend-hours">{t("Closed")}</span>
              </li>
              <li>
                <span className="frontend-day">{t("Monday - Friday")}</span>
                <span className="frontend-hours">8:00 AM - 3:30 PM</span>
              </li>
              <li>
                <span className="frontend-day">{t("Saturday")}</span>
                <span className="frontend-hours">10:30 AM - 5:30 PM</span>
              </li>
            </ul>
          </div>

          {/* Clinic Info Section */}
          <div className="frontend-footer-section">
            <h5 className="frontend-footer-title">
              <i className="fas fa-tooth"></i>
              {t("Our Clinic")}
            </h5>
            <div className="frontend-clinic-info">
              <p className="frontend-clinic-address">
                <i className="fas fa-map-marker-alt"></i>
                <span>{t("123 Dental Street, San Diego, CA 92123")}</span>
              </p>
              <p className="frontend-clinic-email">
                <i className="fas fa-envelope"></i>
                <a href="mailto:hello@dentalcare.com">hello@dentalcare.com</a>
              </p>
              <p className="frontend-clinic-phone">
                <i className="fas fa-phone-alt"></i>
                <a href="tel:+010-020-0340">010-020-0340</a>
              </p>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="frontend-footer-section">
            <h5 className="frontend-footer-title">
              <i className="fas fa-share-alt"></i>
              {t("Follow Us")}
            </h5>
            <div className="frontend-social-links">
              <a
                href="#"
                className="frontend-social-link frontend-facebook"
                aria-label={t("Facebook")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="frontend-social-link frontend-twitter"
                aria-label={t("Twitter")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="frontend-social-link frontend-instagram"
                aria-label={t("Instagram")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                className="frontend-social-link frontend-youtube"
                aria-label={t("YouTube")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="frontend-footer-section">
            <h5 className="frontend-footer-title">
              <i className="fas fa-link"></i>
              {t("Quick Links")}
            </h5>
            <ul className="frontend-quick-links">
              <li>
                <Link to="/about">{t("About Us")}</Link>
              </li>
              <li>
                <Link to="/booking">{t("Book Appointment")}</Link>
              </li>
              <li>
                <Link to="/testimonials">{t("Testimonials")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("Contact Us")}</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="frontend-footer-bottom">
          <div className="frontend-copyright">
            <p>
              &copy; {currentYear} {t("Dental Care Clinic")}.{" "}
              {t("All rights reserved.")}
            </p>
          </div>
          <div className="frontend-footer-credits">
            <p>
              {t("Design by")}{" "}
              <a href="#" target="_blank" rel="noopener noreferrer">
                TemplateMo
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
