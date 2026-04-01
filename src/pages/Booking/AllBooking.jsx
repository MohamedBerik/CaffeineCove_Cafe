import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AllBooking.css";

function AllBooking() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: "",
    doctor: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const services = [
    { value: "general", label: t("General Dentistry (Check-up, Cleaning)") },
    { value: "cosmetic", label: t("Cosmetic Dentistry (Whitening, Veneers)") },
    {
      value: "orthodontic",
      label: t("Orthodontic Treatment (Braces, Aligners)"),
    },
    { value: "root-canal", label: t("Root Canal Treatment") },
    { value: "implant", label: t("Dental Implants") },
    { value: "pediatric", label: t("Pediatric Dentistry") },
    { value: "emergency", label: t("Emergency Dental Care") },
  ];

  const doctors = [
    { value: "sarah", label: t("Dr. Sarah Johnson - General & Cosmetic") },
    { value: "michael", label: t("Dr. Michael Chen - Orthodontics") },
    { value: "emily", label: t("Dr. Emily Rodriguez - Oral Surgery") },
    { value: "any", label: t("Any Available Doctor") },
  ];

  const timeSlots = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        navigate("/");
      }, 3000);
    }, 1500);

    // In a real app, you would send data to your backend:
    // try {
    //   await api.post("/appointments", formData);
    //   setSubmitSuccess(true);
    // } catch (error) {
    //   console.error(error);
    // }
  };

  return (
    <div
      className="all-booking-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <Navbar />

      {/* Hero Section */}
      <section className="booking-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>{t("Book Your Dental Appointment")}</h1>
            <p>
              {t(
                "Schedule your visit with our expert dentists. We're here to help you achieve a healthy, beautiful smile.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="booking-section">
        <div className="container">
          <div className="booking-grid">
            {/* Form Card */}
            <div className="booking-form-card">
              <div className="form-header">
                <i className="fas fa-calendar-alt"></i>
                <h2>{t("Appointment Request")}</h2>
                <p>
                  {t(
                    "Fill out the form below and we'll confirm your appointment shortly.",
                  )}
                </p>
              </div>

              {submitSuccess ? (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  <h3>{t("Appointment Request Sent!")}</h3>
                  <p>
                    {t(
                      "Thank you for choosing our dental clinic. We'll contact you shortly to confirm your appointment.",
                    )}
                  </p>
                  <button className="btn-home" onClick={() => navigate("/")}>
                    <i className="fas fa-home"></i>
                    {t("Back to Home")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="booking-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        <i className="fas fa-user"></i>
                        {t("Full Name")} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("Enter your full name")}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        <i className="fas fa-envelope"></i>
                        {t("Email Address")} <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t("your@email.com")}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">
                        <i className="fas fa-phone-alt"></i>
                        {t("Phone Number")}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t("+1 234 567 8900")}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="service">
                        <i className="fas fa-tooth"></i>
                        {t("Service Required")}{" "}
                        <span className="required">*</span>
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        required
                      >
                        <option value="">{t("Select a service")}</option>
                        {services.map((service) => (
                          <option key={service.value} value={service.value}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="doctor">
                        <i className="fas fa-user-md"></i>
                        {t("Preferred Doctor")}
                      </label>
                      <select
                        id="doctor"
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleChange}
                      >
                        {doctors.map((doctor) => (
                          <option key={doctor.value} value={doctor.value}>
                            {doctor.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="date">
                        <i className="fas fa-calendar-day"></i>
                        {t("Preferred Date")}{" "}
                        <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="time">
                        <i className="fas fa-clock"></i>
                        {t("Preferred Time")}{" "}
                        <span className="required">*</span>
                      </label>
                      <select
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      >
                        <option value="">{t("Select a time slot")}</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">
                        <i className="fas fa-comment"></i>
                        {t("Additional Notes")}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="3"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t("Any special requests or concerns?")}
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          {t("Scheduling...")}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i>
                          {t("Book Appointment")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={() => {
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          date: "",
                          time: "",
                          service: "",
                          doctor: "",
                          message: "",
                        });
                      }}
                    >
                      <i className="fas fa-undo"></i>
                      {t("Reset")}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="booking-info-sidebar">
              <div className="info-card">
                <h3>
                  <i className="fas fa-info-circle"></i>{" "}
                  {t("Before Your Visit")}
                </h3>
                <ul>
                  <li>
                    <i className="fas fa-id-card"></i>{" "}
                    {t("Bring your insurance card and ID")}
                  </li>
                  <li>
                    <i className="fas fa-clock"></i>{" "}
                    {t("Arrive 15 minutes before your appointment")}
                  </li>
                  <li>
                    <i className="fas fa-file-medical"></i>{" "}
                    {t("Complete any required forms")}
                  </li>
                  <li>
                    <i className="fas fa-list"></i>{" "}
                    {t("List any medications you're taking")}
                  </li>
                </ul>
              </div>

              <div className="info-card">
                <h3>
                  <i className="fas fa-clock"></i> {t("Working Hours")}
                </h3>
                <div className="hours-list">
                  <div className="hour-item">
                    <span>{t("Monday - Friday")}</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="hour-item">
                    <span>{t("Saturday")}</span>
                    <span>9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="hour-item">
                    <span>{t("Sunday")}</span>
                    <span>{t("Closed")}</span>
                  </div>
                  <div className="hour-item emergency">
                    <span>{t("Emergency")}</span>
                    <span>24/7</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  <i className="fas fa-phone-alt"></i> {t("Contact Us")}
                </h3>
                <p>
                  <a href="tel:010-020-0340">010-020-0340</a>
                </p>
                <p>
                  <a href="mailto:hello@dentalcare.com">hello@dentalcare.com</a>
                </p>
                <p className="address">
                  <i className="fas fa-map-marker-alt"></i>
                  {t("123 Dental Street, San Diego, CA 92123")}
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

export default AllBooking;
