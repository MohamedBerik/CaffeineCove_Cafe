import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AllTestimonials.css";

function AllTestimonials() {
  const { t, i18n } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Marie Johnson",
      role: t("Regular Patient"),
      image:
        "images/reviews/beautiful-woman-face-portrait-brown-background.jpeg",
      rating: 4,
      title: t("Best Dental Care Experience"),
      text: t(
        "I've been coming to this clinic for over 3 years and I couldn't be happier. The staff is incredibly friendly, and Dr. Sarah made my root canal procedure completely painless. Highly recommended!",
      ),
      treatment: t("Root Canal Treatment"),
      date: "2024-02-15",
    },
    {
      id: 2,
      name: "Ben Walker",
      role: t("Recovered Patient"),
      image:
        "images/reviews/senior-man-wearing-white-face-mask-covid-19-campaign-with-design-space.jpeg",
      rating: 5,
      title: t("Amazing Smile Transformation"),
      text: t(
        "After years of being embarrassed about my teeth, I finally decided to get veneers. Dr. Chen did an incredible job! My smile looks completely natural and I feel confident again. Thank you!",
      ),
      treatment: t("Cosmetic Veneers"),
      date: "2024-01-20",
    },
    {
      id: 3,
      name: "Laura Zono",
      role: t("New Patient"),
      image: "images/reviews/portrait-british-woman.jpeg",
      rating: 5,
      title: t("Welcoming and Professional"),
      text: t(
        "As a new patient, I was nervous about my first visit. The team made me feel welcome from the moment I walked in. The facility is spotless, and Dr. Rodriguez explained everything clearly. I'm so glad I chose this clinic!",
      ),
      treatment: t("Dental Cleaning & Check-up"),
      date: "2024-02-28",
    },
    {
      id: 4,
      name: "Rosey Martinez",
      role: t("Happy Patient"),
      image:
        "images/reviews/woman-wearing-mask-face-closeup-covid-19-green-background.jpeg",
      rating: 4,
      title: t("Excellent Emergency Care"),
      text: t(
        "I had a dental emergency on a Sunday and they saw me within an hour. The care was exceptional and the pain relief was immediate. Truly grateful for their emergency service!",
      ),
      treatment: t("Emergency Dental Care"),
      date: "2024-02-10",
    },
    {
      id: 5,
      name: "David Kim",
      role: t("Orthodontic Patient"),
      image: "images/reviews/young-man-smiling-portrait.jpeg",
      rating: 5,
      title: t("Perfect Braces Results"),
      text: t(
        "My daughter just finished her braces treatment with Dr. Chen, and the results are amazing! The team was always patient and supportive throughout the entire process. We couldn't be happier with her smile!",
      ),
      treatment: t("Orthodontic Treatment"),
      date: "2024-01-05",
    },
    {
      id: 6,
      name: "Emma Williams",
      role: t("Pediatric Patient's Mom"),
      image: "images/reviews/mother-with-child-dentist.jpeg",
      rating: 5,
      title: t("Great with Kids!"),
      text: t(
        "My 5-year-old was terrified of the dentist, but Dr. Sarah made the experience fun and stress-free. Now my daughter actually looks forward to her dental visits! Thank you for being so patient with children.",
      ),
      treatment: t("Pediatric Dentistry"),
      date: "2024-02-25",
    },
  ];

  const averageRating = (
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
  ).toFixed(1);
  const totalReviews = testimonials.length;

  const renderStars = (rating) => {
    return (
      <div className="stars-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? "filled" : "empty"}`}
          ></i>
        ))}
      </div>
    );
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <div
      className="all-testimonials-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <Navbar />

      {/* Hero Section */}
      <section className="testimonials-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>{t("What Our Patients Say")}</h1>
            <p>
              {t(
                "Real stories from real patients about their experience at our dental clinic",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-smile"></i>
              </div>
              <div className="stat-number">{totalReviews}+</div>
              <div className="stat-label">{t("Happy Patients")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-number">{averageRating}</div>
              <div className="stat-label">{t("Average Rating")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="stat-number">98%</div>
              <div className="stat-label">{t("Would Recommend")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-tooth"></i>
              </div>
              <div className="stat-number">10k+</div>
              <div className="stat-label">{t("Smiles Created")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>{t("Patient Testimonials")}</h2>
            <p>
              {t(
                "Don't just take our word for it - hear from our amazing patients",
              )}
            </p>
          </div>

          <div className="testimonials-carousel">
            {isMobile ? (
              // Mobile View - Vertical List
              <div className="testimonials-list">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="testimonial-card">
                    <div className="card-header">
                      <div className="patient-info">
                        <img src={testimonial.image} alt={testimonial.name} />
                        <div>
                          <h4>{testimonial.name}</h4>
                          <p className="patient-role">{testimonial.role}</p>
                        </div>
                      </div>
                      {renderStars(testimonial.rating)}
                    </div>
                    <div className="card-body">
                      <h5>{testimonial.title}</h5>
                      <p className="testimonial-text">"{testimonial.text}"</p>
                      <div className="treatment-badge">
                        <i className="fas fa-tooth"></i>
                        {testimonial.treatment}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop View - Carousel
              <div className="carousel-container">
                <button className="carousel-btn prev" onClick={prevSlide}>
                  <i className="fas fa-chevron-left"></i>
                </button>

                <div className="carousel-track">
                  <div className="testimonial-card featured">
                    <div className="card-header">
                      <div className="patient-info">
                        <img
                          src={testimonials[activeIndex].image}
                          alt={testimonials[activeIndex].name}
                        />
                        <div>
                          <h4>{testimonials[activeIndex].name}</h4>
                          <p className="patient-role">
                            {testimonials[activeIndex].role}
                          </p>
                        </div>
                      </div>
                      {renderStars(testimonials[activeIndex].rating)}
                    </div>
                    <div className="card-body">
                      <h5>{testimonials[activeIndex].title}</h5>
                      <p className="testimonial-text">
                        "{testimonials[activeIndex].text}"
                      </p>
                      <div className="treatment-badge">
                        <i className="fas fa-tooth"></i>
                        {testimonials[activeIndex].treatment}
                      </div>
                    </div>
                  </div>
                </div>

                <button className="carousel-btn next" onClick={nextSlide}>
                  <i className="fas fa-chevron-right"></i>
                </button>

                <div className="carousel-dots">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${activeIndex === index ? "active" : ""}`}
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Write Review CTA */}
      <section className="write-review-section">
        <div className="container">
          <div className="review-cta">
            <div className="cta-content">
              <i className="fas fa-pen-alt"></i>
              <h2>{t("Share Your Experience")}</h2>
              <p>
                {t(
                  "Had a great experience with us? We'd love to hear about it!",
                )}
              </p>
              <button className="btn-write-review">
                <i className="fas fa-star"></i>
                {t("Write a Review")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AllTestimonials;
