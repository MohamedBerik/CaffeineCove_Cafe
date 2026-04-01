import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
    } catch (err) {
      console.log(err);
    }
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const navItems = [
    { path: "/", label: t("Home") },
    { path: "/about", label: t("About") },
    { path: "/timeline", label: t("Timeline") },
    { path: "/testimonials", label: t("Testimonials") },
    { path: "/booking", label: t("Booking") },
    { path: "/contact", label: t("Contact") },
  ];

  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
          {/* Logo - Desktop */}
          <a className="navbar-brand d-none d-lg-block" href="/">
            <i className="fas fa-tooth"></i>
            <div className="brand-text">
              <span className="brand-title">{t("Dental Care")}</span>
              <strong className="brand-subtitle">
                {t("Smile Specialist")}
              </strong>
            </div>
          </a>

          {/* Logo - Mobile */}
          <a className="navbar-brand d-lg-none" href="/">
            <i className="fas fa-tooth"></i>
            <div className="brand-text">
              <span className="brand-title">{t("Dental Care")}</span>
              <strong className="brand-subtitle">
                {t("Smile Specialist")}
              </strong>
            </div>
          </a>

          {/* Mobile Menu Button */}
          <button
            className={`navbar-toggler ${menuOpen ? "collapsed" : ""}`}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={t("Toggle navigation")}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navigation Menu */}
          <div
            className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav mx-auto">
              {navItems.map((item, index) => (
                <li className="nav-item" key={index}>
                  <a className="nav-link" href={item.path} onClick={closeMenu}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Right Side Actions */}
            <div className="navbar-actions">
              {/* Language Switcher */}
              <button
                className="lang-switch-btn"
                onClick={toggleLanguage}
                title={i18n.language === "en" ? t("العربية") : t("English")}
              >
                <i
                  className={`fas ${i18n.language === "en" ? "fa-language" : "fa-globe"}`}
                ></i>
                <span>{i18n.language === "en" ? "AR" : "EN"}</span>
              </button>

              {/* Auth Buttons */}
              {!user ? (
                <div className="auth-buttons">
                  <NavLink
                    to="/login"
                    className="btn btn-outline-primary"
                    onClick={closeMenu}
                  >
                    <i className="fas fa-sign-in-alt"></i>
                    <span>{t("Login")}</span>
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="btn btn-primary"
                    onClick={closeMenu}
                  >
                    <i className="fas fa-user-plus"></i>
                    <span>{t("Register")}</span>
                  </NavLink>
                </div>
              ) : (
                <div className="user-menu">
                  <button
                    className="user-menu-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <i className="fas fa-user-circle"></i>
                    <span className="user-name">
                      {user.name || t("Account")}
                    </span>
                    <i
                      className={`fas fa-chevron-${dropdownOpen ? "up" : "down"}`}
                    ></i>
                  </button>
                  {dropdownOpen && (
                    <div className="user-dropdown">
                      <NavLink
                        to="/profile"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <i className="fas fa-user"></i>
                        <span>{t("Profile")}</span>
                      </NavLink>
                      <NavLink
                        to="/appointments"
                        className="dropdown-item"
                        onClick={closeMenu}
                      >
                        <i className="fas fa-calendar-alt"></i>
                        <span>{t("My Appointments")}</span>
                      </NavLink>
                      <hr className="dropdown-divider" />
                      <button
                        onClick={handleLogout}
                        className="dropdown-item logout"
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>{t("Logout")}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
