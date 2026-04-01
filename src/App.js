import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import "./App.css";

function App() {
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slides = [
    {
      image: "images/slider/wp9526009.jpg",
      alt: t("Dentist portrait"),
      title: t("Expert Dental Care"),
      description: t("Professional dental services for your perfect smile"),
    },
    {
      image: "images/slider/istockphoto-1277540209-612x612.jpg",
      alt: t("Female dentist"),
      title: t("Modern Dental Clinic"),
      description: t("State-of-the-art equipment and comfortable environment"),
    },
    {
      image:
        "images/slider/research-competition-for-foundation-dentists-the-dentist.jpg",
      alt: t("Dental examination"),
      title: t("Comprehensive Check-ups"),
      description: t("Regular dental examinations for optimal oral health"),
    },
  ];

  const animatedWords = [
    { word: t("smiles"), delay: "0s" },
    { word: t("teeth"), delay: "3s" },
    { word: t("lives"), delay: "6s" },
  ];

  return (
    <div className="app" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <Navbar />

      {/* Hero Section - Dental Clinic Theme */}
      <section className="hero" id="hero">
        <div className="container-fluid px-0">
          <div className="row g-0">
            <div className="col-12">
              <div
                id="heroCarousel"
                className="carousel slide carousel-fade"
                data-bs-ride="carousel"
              >
                <div className="carousel-inner">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className={`carousel-item ${index === 0 ? "active" : ""}`}
                    >
                      <div className="hero-image-wrapper">
                        <img
                          src={slide.image}
                          className="hero-image"
                          alt={slide.alt}
                        />
                        <div className="hero-overlay"></div>
                      </div>
                      {/* Optional: Add slide caption */}
                      <div className="carousel-caption d-none d-md-block">
                        <h3>{slide.title}</h3>
                        <p>{slide.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel Controls */}
                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#heroCarousel"
                  data-bs-slide="prev"
                  aria-label={t("Previous slide")}
                >
                  <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">{t("Previous")}</span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#heroCarousel"
                  data-bs-slide="next"
                  aria-label={t("Next slide")}
                >
                  <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">{t("Next")}</span>
                </button>

                {/* Carousel Indicators */}
                <div className="carousel-indicators">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      data-bs-target="#heroCarousel"
                      data-bs-slide-to={index}
                      className={index === 0 ? "active" : ""}
                      aria-current={index === 0 ? "true" : "false"}
                      aria-label={`${t("Slide")} ${index + 1}`}
                    ></button>
                  ))}
                </div>
              </div>

              {/* Hero Text Content - Dental Focus */}
              <div className="hero-content">
                <div className="hero-text-container">
                  <h1 className="hero-title">
                    {t("Better")}
                    <div className="animated-info">
                      {animatedWords.map((item, idx) => (
                        <span
                          key={idx}
                          className="animated-item"
                          style={{ animationDelay: item.delay }}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                  </h1>
                  <p className="hero-description">
                    {t(
                      "Welcome to our dental clinic! We provide comprehensive dental care with state-of-the-art technology and a gentle, caring approach. Your smile is our priority.",
                    )}
                  </p>
                  <div className="hero-links">
                    <a
                      className="btn-primary-custom"
                      href="#services"
                      data-hover={t("Our Services")}
                    >
                      <span>{t("Our Services")}</span>
                    </a>
                    <a href="tel:010-020-0340" className="contact-phone">
                      <i className="fas fa-phone-alt"></i>
                      <span>{t("Book Appointment")}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional: Add Dental Services Section */}
      <section className="services-section" id="services">
        <div className="container">
          <div className="section-header">
            <h2>{t("Our Dental Services")}</h2>
            <p>{t("Comprehensive dental care for the whole family")}</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <i className="fas fa-tooth"></i>
              <h3>{t("General Dentistry")}</h3>
              <p>{t("Regular check-ups, cleanings, and preventive care")}</p>
            </div>
            <div className="service-card">
              <i className="fas fa-smile"></i>
              <h3>{t("Cosmetic Dentistry")}</h3>
              <p>{t("Teeth whitening, veneers, and smile makeovers")}</p>
            </div>
            <div className="service-card">
              <i className="fas fa-baby-carriage"></i>
              <h3>{t("Pediatric Dentistry")}</h3>
              <p>{t("Gentle dental care for children")}</p>
            </div>
            <div className="service-card">
              <i className="fas fa-procedures"></i>
              <h3>{t("Root Canal Treatment")}</h3>
              <p>{t("Pain-free root canal procedures")}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default App;
