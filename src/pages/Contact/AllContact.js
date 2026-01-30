import React, { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import api from "../../services/axios"; // Axios مهيأ مسبقًا مع BaseURL
import { useAuth } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../../utils/notify";

function AllContact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    persons: "",
    date: "",
    time: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/reservations", formData, {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      });

      setSuccess("Reservation sent successfully ✅");
      notifySuccess("Reservation confirmed");
      setFormData({
        name: "",
        email: "",
        persons: "",
        date: "",
        time: "",
        message: "",
      });
      console.log(response.data);
    } catch (err) {
      notifyError("Failed to confirm reservation");
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Server error ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />

      <section id="contact">
        <div className="container">
          <div className="heading">
            <span className="text-primary">What Happens Here</span>
            <h2>Reservation Area</h2>
          </div>

          <div className="row">
            <div className="map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d884780.515123437!2d31.502804734375005!3d29.974432300000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145856f81d43dbed%3A0x42cb3cb3dfd7e8b6!2sCosta%20Coffee!5e0!3m2!1sar!2seg!4v1749718038688!5m2!1sar!2seg"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map"
              ></iframe>
            </div>

            <div className="contact-content">
              <h3>Book a Table</h3>

              {error && <p style={{ color: "red" }}>{error}</p>}
              {success && <p style={{ color: "green" }}>{success}</p>}

              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                />

                <input
                  type="number"
                  name="persons"
                  value={formData.persons}
                  onChange={handleChange}
                  placeholder="Persons"
                  min="1"
                  required
                />

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  rows="6"
                ></textarea>

                <button
                  type="submit"
                  disabled={loading}
                  class="btn btn-success"
                >
                  {loading ? "Booking..." : "Book a Table"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AllContact;
