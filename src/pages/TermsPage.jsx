import { useTranslation } from "react-i18next";
import LandingNavbar from "../components/LandingNavbar";
import LandingFooter from "../components/LandingFooter";
import styles from "./StaticPage.module.css"; // سننشئه

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <LandingNavbar />

      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.title}>{t("Terms of Service")}</h1>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.card}>
            <p>
              <strong>{t("Last Updated")}:</strong>{" "}
              {new Date().toLocaleDateString()}
            </p>

            <h2>{t("1. Acceptance of Terms")}</h2>
            <p>
              {t(
                "By accessing and using our platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.",
              )}
            </p>

            <h2>{t("2. Description of Service")}</h2>
            <p>
              {t(
                "We provide a cloud-based dental practice management software (SaaS) that allows clinics to manage appointments, patients, invoices, inventory, and more.",
              )}
            </p>

            <h2>{t("3. User Accounts")}</h2>
            <p>
              {t(
                "You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account.",
              )}
            </p>

            <h2>{t("4. Subscription and Payments")}</h2>
            <p>
              {t(
                "Some features require a paid subscription. You agree to pay all fees associated with your plan. Subscription fees are non-refundable unless required by law.",
              )}
            </p>

            <h2>{t("5. Limitation of Liability")}</h2>
            <p>
              {t(
                "We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
              )}
            </p>

            <h2>{t("6. Changes to Terms")}</h2>
            <p>
              {t(
                "We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.",
              )}
            </p>

            <h2>{t("7. Contact")}</h2>
            <p>
              {t(
                "For any questions about these terms, please contact us through our contact page.",
              )}
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
