import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/axios";
import LandingNavbar from "../components/LandingNavbar";
import LandingFooter from "../components/LandingFooter";
import styles from "./ContactPage.module.css";

export default function ContactPage() {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/public/contact", form);
      setSuccess(
        t(
          "Your message has been sent successfully. We will get back to you soon.",
        ),
      );
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.errors?.email?.[0] ||
        t("Failed to send your message. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <LandingNavbar />

      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t("Contact Us")}</h1>
          <p className={styles.subtitle}>
            {t(
              "Have a question or need help? Fill out the form below and we'll get back to you shortly.",
            )}
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            {error && (
              <div className={styles.alertError}>
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}
            {success && (
              <div className={styles.alertSuccess}>
                <i className="fas fa-check-circle me-2"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.group}>
                  <label className={styles.label}>
                    <i className="fas fa-user me-2"></i>
                    {t("Your Name")} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={t("Enter your full name")}
                    required
                  />
                </div>

                <div className={styles.group}>
                  <label className={styles.label}>
                    <i className="fas fa-envelope me-2"></i>
                    {t("Email Address")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label}>
                  <i className="fas fa-tag me-2"></i>
                  {t("Subject")} <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder={t("How can we help you?")}
                  required
                />
              </div>

              <div className={styles.group}>
                <label className={styles.label}>
                  <i className="fas fa-comment me-2"></i>
                  {t("Message")} <span className={styles.required}>*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows="6"
                  placeholder={t("Tell us more about your inquiry...")}
                  required
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t("Sending...")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      {t("Send Message")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
