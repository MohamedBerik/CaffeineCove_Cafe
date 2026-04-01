import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AllTimeline.css";

function AllTimeline() {
  const { t, i18n } = useTranslation();
  const [activeEvent, setActiveEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const timelineEvents = [
    {
      id: 1,
      date: "2024-03-15",
      title: t("State-of-the-Art Dental Equipment"),
      description: t(
        "We invested in the latest digital imaging technology, including 3D CBCT scanners and intraoral cameras, allowing for more precise diagnoses and treatment planning.",
      ),
      icon: "fas fa-microscope",
      category: "technology",
      achievements: [
        t("3D CBCT Scanner installed"),
        t("Intraoral cameras for all operatories"),
        t("Digital smile design software"),
      ],
    },
    {
      id: 2,
      date: "2023-11-20",
      title: t("New Pediatric Wing Opening"),
      description: t(
        "We opened a dedicated pediatric dentistry wing designed specifically for children, featuring a kid-friendly environment, entertainment systems, and specialized pediatric dentists.",
      ),
      icon: "fas fa-child",
      category: "facility",
      achievements: [
        t("Child-friendly treatment rooms"),
        t("Sedation dentistry services"),
        t("School outreach program launched"),
      ],
    },
    {
      id: 3,
      date: "2023-08-01",
      title: t("Expanded Orthodontic Services"),
      description: t(
        "Dr. Michael Chen joined our team, bringing expertise in traditional braces and modern clear aligners. We now offer comprehensive orthodontic treatments for all ages.",
      ),
      icon: "fas fa-smile",
      category: "staff",
      achievements: [
        t("Clear aligner treatments available"),
        t("Early intervention orthodontics"),
        t("Retainer services"),
      ],
    },
    {
      id: 4,
      date: "2022-12-10",
      title: t("Emergency Dental Care 24/7"),
      description: t(
        "Launched our 24/7 emergency dental service to provide immediate care for dental emergencies, including severe toothaches, broken teeth, and dental trauma.",
      ),
      icon: "fas fa-ambulance",
      category: "service",
      achievements: [
        t("24/7 on-call dentists"),
        t("Emergency treatment within 1 hour"),
        t("Pain management protocols"),
      ],
    },
    {
      id: 5,
      date: "2021-06-15",
      title: t("Dental Implant Center Established"),
      description: t(
        "We established a dedicated dental implant center, bringing together specialists in oral surgery and restorative dentistry to provide comprehensive implant solutions.",
      ),
      icon: "fas fa-tooth",
      category: "service",
      achievements: [
        t("Same-day implant placement"),
        t("All-on-4 implant solutions"),
        t("Implant-supported dentures"),
      ],
    },
    {
      id: 6,
      date: "2019-09-01",
      title: t("Clinic Founded"),
      description: t(
        "Our dental clinic opened its doors with a mission to provide exceptional, patient-centered dental care using the latest technology and techniques.",
      ),
      icon: "fas fa-clinic-medical",
      category: "founding",
      achievements: [
        t("2 treatment rooms"),
        t("3 experienced dentists"),
        t("Comprehensive dental services"),
      ],
    },
  ];

  const formatDate = (dateString) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Date(dateString).toLocaleDateString(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getIconBackground = (category) => {
    switch (category) {
      case "technology":
        return "#1a237e";
      case "facility":
        return "#2e7d32";
      case "staff":
        return "#ed6c02";
      case "service":
        return "#0288d1";
      case "founding":
        return "#6c757d";
      default:
        return "#1a237e";
    }
  };

  return (
    <div
      className="all-timeline-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <Navbar />

      {/* Hero Section */}
      <section className="timeline-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>{t("Our Journey")}</h1>
            <p>
              {t(
                "A timeline of our growth, milestones, and commitment to excellence in dental care",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Milestone Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">2019</div>
              <div className="stat-label">{t("Year Established")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">15+</div>
              <div className="stat-label">{t("Years Combined Experience")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">10k+</div>
              <div className="stat-label">{t("Happy Patients")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50+</div>
              <div className="stat-label">{t("Awards & Recognitions")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header">
            <h2>{t("Our Timeline")}</h2>
            <p>
              {t(
                "Milestones that shaped our dental clinic into what it is today",
              )}
            </p>
          </div>

          <div className="timeline-wrapper">
            {timelineEvents.map((event, index) => (
              <div
                key={event.id}
                className={`timeline-item ${index % 2 === 0 ? "left" : "right"}`}
                onMouseEnter={() => setActiveEvent(event.id)}
                onMouseLeave={() => setActiveEvent(null)}
              >
                <div className="timeline-dot">
                  <i
                    className={event.icon}
                    style={{
                      backgroundColor: getIconBackground(event.category),
                    }}
                  ></i>
                </div>

                <div
                  className={`timeline-content ${activeEvent === event.id ? "active" : ""}`}
                >
                  <div className="timeline-date">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="timeline-description">{event.description}</p>

                  <div className="achievements-list">
                    <h4>
                      <i className="fas fa-trophy"></i> {t("Key Achievements")}
                    </h4>
                    <ul>
                      {event.achievements.map((achievement, idx) => (
                        <li key={idx}>
                          <i className="fas fa-check-circle"></i>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision Section */}
      <section className="future-section">
        <div className="container">
          <div className="future-content">
            <i className="fas fa-chart-line"></i>
            <h2>{t("Looking Ahead")}</h2>
            <p>
              {t(
                "We're committed to continuous improvement and innovation in dental care. Our future plans include:",
              )}
            </p>
            <div className="future-grid">
              <div className="future-card">
                <i className="fas fa-robot"></i>
                <h3>{t("AI-Powered Diagnostics")}</h3>
                <p>
                  {t(
                    "Implementing artificial intelligence for early detection of dental issues",
                  )}
                </p>
              </div>
              <div className="future-card">
                <i className="fas fa-laptop-medical"></i>
                <h3>{t("Tele-dentistry Services")}</h3>
                <p>
                  {t(
                    "Virtual consultations and remote monitoring for patient convenience",
                  )}
                </p>
              </div>
              <div className="future-card">
                <i className="fas fa-graduation-cap"></i>
                <h3>{t("Dental Education Center")}</h3>
                <p>
                  {t(
                    "Community outreach and educational programs for oral health awareness",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AllTimeline;
