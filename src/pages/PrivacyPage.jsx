import { useTranslation } from "react-i18next";
import LandingNavbar from "../components/LandingNavbar";
import LandingFooter from "../components/LandingFooter";
import styles from "./StaticPage.module.css";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <LandingNavbar />

      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t("Privacy Policy")}</h1>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.card}>
            <p>
              <strong>{t("Last Updated")}:</strong>{" "}
              {new Date().toLocaleDateString()}
            </p>

            <h2>{t("1. Information We Collect")}</h2>
            <p>
              {t(
                "We collect information you provide when registering, such as name, email address, clinic information, and payment details. We also collect usage data automatically.",
              )}
            </p>

            <h2>{t("2. How We Use Your Information")}</h2>
            <p>
              {t(
                "We use your information to provide, maintain, and improve our services, process payments, send notifications, and comply with legal obligations.",
              )}
            </p>

            <h2>{t("3. Data Sharing")}</h2>
            <p>
              {t(
                "We do not sell your personal data. We may share data with trusted third-party service providers (such as payment gateways) only as necessary to provide the service.",
              )}
            </p>

            <h2>{t("4. Data Security")}</h2>
            <p>
              {t(
                "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.",
              )}
            </p>

            <h2>{t("5. Your Rights")}</h2>
            <p>
              {t(
                "You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing activities.",
              )}
            </p>

            <h2>{t("6. Cookies")}</h2>
            <p>
              {t(
                "We use cookies to improve your browsing experience. You can disable cookies in your browser settings, but this may affect the functionality of the platform.",
              )}
            </p>

            <h2>{t("7. Contact")}</h2>
            <p>
              {t(
                "For any questions about this privacy policy, please contact us through our contact page.",
              )}
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
