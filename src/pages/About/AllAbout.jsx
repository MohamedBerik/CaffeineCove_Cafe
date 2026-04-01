import React from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AllAbout.css";

function AllAbout() {
  const { t, i18n } = useTranslation();

  const doctors = [
    {
      name: t("Dr. Sarah Johnson"),
      specialty: t("General & Cosmetic Dentistry"),
      experience: "15+",
      image: "images/doctors/doctor1.jpg",
      bio: t(
        "Dr. Sarah is dedicated to providing gentle, comprehensive dental care with a focus on preventive treatments and patient education.",
      ),
    },
    {
      name: t("Dr. Michael Chen"),
      specialty: t("Orthodontics & Pediatric Dentistry"),
      experience: "12+",
      image: "images/doctors/doctor2.jpg",
      bio: t(
        "Dr. Michael specializes in orthodontic treatments and children's dentistry, creating beautiful smiles for the whole family.",
      ),
    },
    {
      name: t("Dr. Emily Rodriguez"),
      specialty: t("Oral Surgery & Implantology"),
      experience: "10+",
      image: "images/doctors/doctor3.jpg",
      bio: t(
        "Dr. Emily is an expert in dental implants and surgical procedures, ensuring comfortable and successful treatments.",
      ),
    },
  ];

  const values = [
    {
      icon: "fas fa-heart",
      title: t("Compassionate Care"),
      description: t(
        "We treat every patient with kindness, empathy, and understanding.",
      ),
    },
    {
      icon: "fas fa-star",
      title: t("Excellence"),
      description: t("We strive for the highest quality in everything we do."),
    },
    {
      icon: "fas fa-hand-holding-heart",
      title: t("Patient-Centered"),
      description: t("Your comfort and satisfaction are our top priorities."),
    },
    {
      icon: "fas fa-flask",
      title: t("Innovation"),
      description: t(
        "We embrace the latest technology and techniques in dentistry.",
      ),
    },
  ];

  return (
    <div
      className="all-about-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>{t("About Our Dental Clinic")}</h1>
            <p>
              {t("Your trusted partner in dental health and beautiful smiles")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h3>{t("Our Mission")}</h3>
              <p>
                {t(
                  "To provide exceptional dental care in a comfortable, caring environment while empowering patients with knowledge about their oral health.",
                )}
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>{t("Our Vision")}</h3>
              <p>
                {t(
                  "To be the leading dental clinic recognized for excellence in patient care, innovation, and creating confident smiles.",
                )}
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">
                <i className="fas fa-gem"></i>
              </div>
              <h3>{t("Our Values")}</h3>
              <p>
                {t(
                  "Integrity, compassion, excellence, and innovation guide everything we do.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Doctors Section */}
      <section className="doctors-section">
        <div className="container">
          <div className="section-header">
            <h2>{t("Meet Our Expert Dentists")}</h2>
            <p>
              {t(
                "Our team of experienced professionals is dedicated to your smile",
              )}
            </p>
          </div>
          <div className="doctors-grid">
            {doctors.map((doctor, index) => (
              <div key={index} className="doctor-card">
                <div className="doctor-image">
                  <img src={doctor.image} alt={doctor.name} />
                  <div className="doctor-overlay">
                    <span className="experience-badge">
                      {doctor.experience}+ {t("Years")}
                    </span>
                  </div>
                </div>
                <div className="doctor-info">
                  <h3>{doctor.name}</h3>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                  <p className="doctor-bio">{doctor.bio}</p>
                  <button className="btn-book">
                    <i className="fas fa-calendar-alt"></i>
                    {t("Book Appointment")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <h2>{t("Our Core Values")}</h2>
            <p>{t("The principles that guide our practice every day")}</p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <div className="value-icon">
                  <i className={value.icon}></i>
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section">
        <div className="container">
          <div className="experience-content">
            <div className="experience-stats">
              <div className="stat-item">
                <span className="stat-number">15+</span>
                <span className="stat-label">{t("Years of Experience")}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10k+</span>
                <span className="stat-label">{t("Happy Patients")}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">{t("Dental Procedures")}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">{t("Emergency Care")}</span>
              </div>
            </div>
            <div className="experience-text">
              <h2>{t("Over 15 Years of Excellence in Dental Care")}</h2>
              <p>
                {t(
                  "Since 2008, we've been committed to providing the highest quality dental care to our community. Our continuous investment in education, technology, and patient comfort ensures you receive the best possible treatment.",
                )}
              </p>
              <a href="/booking" className="btn-primary-custom">
                <i className="fas fa-calendar-check"></i>
                {t("Schedule Your Visit")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{t("Ready for a Healthier Smile?")}</h2>
            <p>
              {t(
                "Book your appointment today and let us help you achieve the smile you've always wanted.",
              )}
            </p>
            <div className="cta-buttons">
              <a href="/booking" className="btn-primary-custom">
                <i className="fas fa-calendar-alt"></i>
                {t("Book Appointment")}
              </a>
              <a href="/contact" className="btn-secondary-custom">
                <i className="fas fa-phone-alt"></i>
                {t("Contact Us")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AllAbout;
