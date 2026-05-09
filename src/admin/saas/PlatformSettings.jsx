import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/axios";
import toast from "react-hot-toast";
import "./PlatformSettings.css";

export default function PlatformSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // ========================= Form States =========================
  const [generalSettings, setGeneralSettings] = useState({
    platform_name: "",
    platform_email: "",
    platform_phone: "",
    platform_address: "",
    default_language: "en",
    default_timezone: "Africa/Cairo",
    default_currency: "EGP",
    date_format: "Y-m-d",
    time_format: "H:i",
  });

  const [brandingSettings, setBrandingSettings] = useState({
    logo: null,
    logo_preview: "",
    favicon: null,
    favicon_preview: "",
    primary_color: "#1a237e",
    secondary_color: "#283593",
    accent_color: "#4caf50",
  });

  const [emailSettings, setEmailSettings] = useState({
    mail_mailer: "smtp",
    mail_host: "",
    mail_port: "587",
    mail_username: "",
    mail_password: "",
    mail_encryption: "tls",
    mail_from_address: "",
    mail_from_name: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    admin_new_company: true,
    admin_new_subscription: true,
    admin_payment_received: true,
    admin_trial_ending: true,
  });

  const [maintenanceSettings, setMaintenanceSettings] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    allowed_ips: "",
  });

  const [securitySettings, setSecuritySettings] = useState({
    max_login_attempts: "5",
    lockout_duration: "15",
    session_lifetime: "120",
    password_expiry_days: "90",
    two_factor_required: false,
  });

  const [apiSettings, setApiSettings] = useState({
    api_enabled: true,
    api_rate_limit: "60",
    webhook_url: "",
    webhook_secret: "",
  });

  // ========================= Queries =========================
  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const res = await api.get("/saas/settings");
      return res.data.data;
    },
  });

  // ========================= Mutations =========================
  const saveMutation = useMutation({
    mutationFn: (data) => api.post("/saas/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["platform-settings"]);
      toast.success(t("Settings saved successfully"));
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to save settings"),
      );
      setIsSaving(false);
    },
  });

  // ========================= Effects =========================
  useEffect(() => {
    if (settings) {
      if (settings.general) setGeneralSettings(settings.general);
      if (settings.branding) {
        setBrandingSettings({
          ...settings.branding,
          logo_preview: settings.branding.logo_url || "",
          favicon_preview: settings.branding.favicon_url || "",
        });
      }
      if (settings.email) setEmailSettings(settings.email);
      if (settings.notifications)
        setNotificationSettings(settings.notifications);
      if (settings.maintenance) setMaintenanceSettings(settings.maintenance);
      if (settings.security) setSecuritySettings(settings.security);
      if (settings.api) setApiSettings(settings.api);
    }
  }, [settings]);

  // ========================= Handlers =========================
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrandingChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setBrandingSettings((prev) => ({
            ...prev,
            [name]: file,
            [`${name}_preview`]: e.target.result,
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setBrandingSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked, type } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : e.target.value,
    }));
  };

  const handleMaintenanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMaintenanceSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleApiChange = (e) => {
    const { name, value, type, checked } = e.target;
    setApiSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = (section) => {
    setIsSaving(true);
    let data = {};

    switch (section) {
      case "general":
        data = { section: "general", ...generalSettings };
        break;
      case "branding":
        data = { section: "branding", ...brandingSettings };
        break;
      case "email":
        data = { section: "email", ...emailSettings };
        break;
      case "notifications":
        data = { section: "notifications", ...notificationSettings };
        break;
      case "maintenance":
        data = { section: "maintenance", ...maintenanceSettings };
        break;
      case "security":
        data = { section: "security", ...securitySettings };
        break;
      case "api":
        data = { section: "api", ...apiSettings };
        break;
    }

    saveMutation.mutate(data);
  };

  const timezones = [
    "Africa/Cairo",
    "Asia/Riyadh",
    "Asia/Dubai",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const currencies = ["EGP", "USD", "EUR", "GBP", "SAR", "AED"];

  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
  ];

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading settings...")}</p>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="platform-settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="header-title">
          <h1>{t("Platform Settings")}</h1>
          <p>{t("Configure your SaaS platform settings")}</p>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button
            className={`sidebar-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <i className="fas fa-cog"></i>
            <span>{t("General")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "branding" ? "active" : ""}`}
            onClick={() => setActiveTab("branding")}
          >
            <i className="fas fa-palette"></i>
            <span>{t("Branding")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "email" ? "active" : ""}`}
            onClick={() => setActiveTab("email")}
          >
            <i className="fas fa-envelope"></i>
            <span>{t("Email")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <i className="fas fa-bell"></i>
            <span>{t("Notifications")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "maintenance" ? "active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            <i className="fas fa-tools"></i>
            <span>{t("Maintenance")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <i className="fas fa-shield-alt"></i>
            <span>{t("Security")}</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            <i className="fas fa-code"></i>
            <span>{t("API")}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {activeTab === "general" && (
            <SettingsSection
              title={t("General Settings")}
              onSave={() => handleSave("general")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>{t("Platform Name")}</label>
                  <input
                    type="text"
                    name="platform_name"
                    value={generalSettings.platform_name}
                    onChange={handleGeneralChange}
                    placeholder="My SaaS Platform"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Platform Email")}</label>
                  <input
                    type="email"
                    name="platform_email"
                    value={generalSettings.platform_email}
                    onChange={handleGeneralChange}
                    placeholder="admin@platform.com"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Platform Phone")}</label>
                  <input
                    type="text"
                    name="platform_phone"
                    value={generalSettings.platform_phone}
                    onChange={handleGeneralChange}
                    placeholder="+20 123 456 789"
                  />
                </div>
                <div className="form-group full-width">
                  <label>{t("Platform Address")}</label>
                  <textarea
                    name="platform_address"
                    value={generalSettings.platform_address}
                    onChange={handleGeneralChange}
                    rows="2"
                    placeholder={t("Enter platform address")}
                  />
                </div>
                <div className="form-group">
                  <label>{t("Default Language")}</label>
                  <select
                    name="default_language"
                    value={generalSettings.default_language}
                    onChange={handleGeneralChange}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("Default Timezone")}</label>
                  <select
                    name="default_timezone"
                    value={generalSettings.default_timezone}
                    onChange={handleGeneralChange}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("Default Currency")}</label>
                  <select
                    name="default_currency"
                    value={generalSettings.default_currency}
                    onChange={handleGeneralChange}
                  >
                    {currencies.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("Date Format")}</label>
                  <select
                    name="date_format"
                    value={generalSettings.date_format}
                    onChange={handleGeneralChange}
                  >
                    <option value="Y-m-d">YYYY-MM-DD</option>
                    <option value="d/m/Y">DD/MM/YYYY</option>
                    <option value="m/d/Y">MM/DD/YYYY</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("Time Format")}</label>
                  <select
                    name="time_format"
                    value={generalSettings.time_format}
                    onChange={handleGeneralChange}
                  >
                    <option value="H:i">24 Hours (14:30)</option>
                    <option value="h:i A">12 Hours (02:30 PM)</option>
                  </select>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "branding" && (
            <SettingsSection
              title={t("Branding Settings")}
              onSave={() => handleSave("branding")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("Logo")}</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleBrandingChange}
                    />
                    {brandingSettings.logo_preview && (
                      <div className="image-preview">
                        <img src={brandingSettings.logo_preview} alt="Logo" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("Favicon")}</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      name="favicon"
                      accept="image/*"
                      onChange={handleBrandingChange}
                    />
                    {brandingSettings.favicon_preview && (
                      <div className="image-preview small">
                        <img
                          src={brandingSettings.favicon_preview}
                          alt="Favicon"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("Primary Color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      name="primary_color"
                      value={brandingSettings.primary_color}
                      onChange={handleBrandingChange}
                    />
                    <input
                      type="text"
                      name="primary_color"
                      value={brandingSettings.primary_color}
                      onChange={handleBrandingChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("Secondary Color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      name="secondary_color"
                      value={brandingSettings.secondary_color}
                      onChange={handleBrandingChange}
                    />
                    <input
                      type="text"
                      name="secondary_color"
                      value={brandingSettings.secondary_color}
                      onChange={handleBrandingChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("Accent Color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      name="accent_color"
                      value={brandingSettings.accent_color}
                      onChange={handleBrandingChange}
                    />
                    <input
                      type="text"
                      name="accent_color"
                      value={brandingSettings.accent_color}
                      onChange={handleBrandingChange}
                    />
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "email" && (
            <SettingsSection
              title={t("Email Settings")}
              onSave={() => handleSave("email")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("Mailer")}</label>
                  <select
                    name="mail_mailer"
                    value={emailSettings.mail_mailer}
                    onChange={handleEmailChange}
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendmail">Sendmail</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("SMTP Host")}</label>
                  <input
                    type="text"
                    name="mail_host"
                    value={emailSettings.mail_host}
                    onChange={handleEmailChange}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>{t("SMTP Port")}</label>
                  <input
                    type="text"
                    name="mail_port"
                    value={emailSettings.mail_port}
                    onChange={handleEmailChange}
                    placeholder="587"
                  />
                </div>
                <div className="form-group">
                  <label>{t("SMTP Username")}</label>
                  <input
                    type="text"
                    name="mail_username"
                    value={emailSettings.mail_username}
                    onChange={handleEmailChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t("SMTP Password")}</label>
                  <input
                    type="password"
                    name="mail_password"
                    value={emailSettings.mail_password}
                    onChange={handleEmailChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t("Encryption")}</label>
                  <select
                    name="mail_encryption"
                    value={emailSettings.mail_encryption}
                    onChange={handleEmailChange}
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="">None</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("From Address")}</label>
                  <input
                    type="email"
                    name="mail_from_address"
                    value={emailSettings.mail_from_address}
                    onChange={handleEmailChange}
                    placeholder="noreply@platform.com"
                  />
                </div>
                <div className="form-group">
                  <label>{t("From Name")}</label>
                  <input
                    type="text"
                    name="mail_from_name"
                    value={emailSettings.mail_from_name}
                    onChange={handleEmailChange}
                    placeholder="Platform Name"
                  />
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "notifications" && (
            <SettingsSection
              title={t("Notification Settings")}
              onSave={() => handleSave("notifications")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("Enable Email Notifications")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="sms_notifications"
                      checked={notificationSettings.sms_notifications}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("Enable SMS Notifications")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="push_notifications"
                      checked={notificationSettings.push_notifications}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("Enable Push Notifications")}</span>
                  </label>
                </div>

                <div className="section-divider full-width">
                  <h4>{t("Admin Notifications")}</h4>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="admin_new_company"
                      checked={notificationSettings.admin_new_company}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("New Company Registration")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="admin_new_subscription"
                      checked={notificationSettings.admin_new_subscription}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("New Subscription Created")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="admin_payment_received"
                      checked={notificationSettings.admin_payment_received}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("Payment Received")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="admin_trial_ending"
                      checked={notificationSettings.admin_trial_ending}
                      onChange={handleNotificationChange}
                    />
                    <span>{t("Trial Ending Soon")}</span>
                  </label>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "maintenance" && (
            <SettingsSection
              title={t("Maintenance Settings")}
              onSave={() => handleSave("maintenance")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="maintenance_mode"
                      checked={maintenanceSettings.maintenance_mode}
                      onChange={handleMaintenanceChange}
                    />
                    <span>{t("Enable Maintenance Mode")}</span>
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>{t("Maintenance Message")}</label>
                  <textarea
                    name="maintenance_message"
                    value={maintenanceSettings.maintenance_message}
                    onChange={handleMaintenanceChange}
                    rows="3"
                    placeholder={t("We'll be back soon!")}
                  />
                </div>
                <div className="form-group full-width">
                  <label>{t("Allowed IP Addresses")}</label>
                  <textarea
                    name="allowed_ips"
                    value={maintenanceSettings.allowed_ips}
                    onChange={handleMaintenanceChange}
                    rows="2"
                    placeholder={t("One IP per line")}
                  />
                  <small>
                    {t("These IPs can access the site during maintenance")}
                  </small>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "security" && (
            <SettingsSection
              title={t("Security Settings")}
              onSave={() => handleSave("security")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("Max Login Attempts")}</label>
                  <input
                    type="number"
                    name="max_login_attempts"
                    value={securitySettings.max_login_attempts}
                    onChange={handleSecurityChange}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Lockout Duration (minutes)")}</label>
                  <input
                    type="number"
                    name="lockout_duration"
                    value={securitySettings.lockout_duration}
                    onChange={handleSecurityChange}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Session Lifetime (minutes)")}</label>
                  <input
                    type="number"
                    name="session_lifetime"
                    value={securitySettings.session_lifetime}
                    onChange={handleSecurityChange}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Password Expiry (days)")}</label>
                  <input
                    type="number"
                    name="password_expiry_days"
                    value={securitySettings.password_expiry_days}
                    onChange={handleSecurityChange}
                    min="0"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="two_factor_required"
                      checked={securitySettings.two_factor_required}
                      onChange={handleSecurityChange}
                    />
                    <span>
                      {t("Require Two-Factor Authentication for Admins")}
                    </span>
                  </label>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeTab === "api" && (
            <SettingsSection
              title={t("API Settings")}
              onSave={() => handleSave("api")}
              isSaving={isSaving}
            >
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="api_enabled"
                      checked={apiSettings.api_enabled}
                      onChange={handleApiChange}
                    />
                    <span>{t("Enable Public API")}</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>{t("Rate Limit (requests per minute)")}</label>
                  <input
                    type="number"
                    name="api_rate_limit"
                    value={apiSettings.api_rate_limit}
                    onChange={handleApiChange}
                    min="1"
                  />
                </div>
                <div className="form-group full-width">
                  <label>{t("Webhook URL")}</label>
                  <input
                    type="url"
                    name="webhook_url"
                    value={apiSettings.webhook_url}
                    onChange={handleApiChange}
                    placeholder="https://your-app.com/webhook"
                  />
                </div>
                <div className="form-group full-width">
                  <label>{t("Webhook Secret")}</label>
                  <input
                    type="text"
                    name="webhook_secret"
                    value={apiSettings.webhook_secret}
                    onChange={handleApiChange}
                  />
                </div>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================= Sub-Components =========================

function SettingsSection({ title, onSave, isSaving, children }) {
  const { t } = useTranslation();

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2>{title}</h2>
        <button className="btn-save" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              {t("Saving...")}
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {t("Save Changes")}
            </>
          )}
        </button>
      </div>
      <div className="section-content">{children}</div>
    </div>
  );
}
