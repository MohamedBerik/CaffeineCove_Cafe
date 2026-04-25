import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/axios";
import toast from "react-hot-toast";
import "./CompanyForm.css";

export default function CompanyForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // ========================= Form State =========================
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    status: "trial",
    trial_ends_at: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });

  const [errors, setErrors] = useState({});
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // ========================= Query (Edit Mode) =========================
  const { data: companyData, isLoading: loadingCompany } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const res = await api.get(`/saas/companies/${id}`);
      return res.data.data;
    },
    enabled: isEditMode,
  });

  // ========================= Mutations =========================
  const createMutation = useMutation({
    mutationFn: (data) => api.post("/saas/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["companies"]);
      toast.success(t("Company created successfully"));
      navigate("/saas/companies");
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(
        error.response?.data?.message || t("Failed to create company"),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/saas/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["companies"]);
      queryClient.invalidateQueries(["company", id]);
      toast.success(t("Company updated successfully"));
      navigate("/saas/companies");
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(
        error.response?.data?.message || t("Failed to update company"),
      );
    },
  });

  // ========================= Effects =========================
  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || "",
        slug: companyData.slug || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        address: companyData.address || "",
        contact_person: companyData.contact_person || "",
        status: companyData.status || "trial",
        trial_ends_at: companyData.trial_ends_at?.split("T")[0] || "",
        admin_name: "",
        admin_email: "",
        admin_password: "",
      });
    }
  }, [companyData]);

  // ========================= Handlers =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Auto-generate slug from name
    if (name === "name" && !isEditMode) {
      generateSlug(value);
    }

    // Reset slug availability when slug changes
    if (name === "slug") {
      setSlugAvailable(null);
    }
  };

  const generateSlug = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const checkSlugAvailability = async () => {
    if (!formData.slug || formData.slug.length < 3) return;

    setCheckingSlug(true);
    try {
      const res = await api.get(`/check-slug?slug=${formData.slug}`);
      setSlugAvailable(res.data.available);
    } catch (error) {
      setSlugAvailable(false);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!formData.name) newErrors.name = t("Company name is required");
    if (!formData.slug) newErrors.slug = t("Slug is required");
    if (!isEditMode && !formData.admin_name)
      newErrors.admin_name = t("Admin name is required");
    if (!isEditMode && !formData.admin_email)
      newErrors.admin_email = t("Admin email is required");
    if (!isEditMode && !formData.admin_password)
      newErrors.admin_password = t("Admin password is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = { ...formData };

    // Remove empty admin fields in edit mode
    if (isEditMode) {
      if (!submitData.admin_password) delete submitData.admin_password;
      delete submitData.admin_name;
      delete submitData.admin_email;
    }

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = isEditMode ? loadingCompany : false;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="company-form-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading company data...")}</p>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="company-form-container">
      {/* Header */}
      <div className="form-header">
        <div className="header-title">
          <button
            className="btn-back"
            onClick={() => navigate("/saas/companies")}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>{isEditMode ? t("Edit Company") : t("Add New Company")}</h1>
        </div>
        <p>
          {isEditMode
            ? t("Update company information")
            : t("Create a new clinic on your platform")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="company-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>{t("Basic Information")}</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                {t("Company Name")} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
                placeholder={t("Enter company name")}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="slug">
                {t("Slug")} <span className="required">*</span>
              </label>
              <div className="slug-input-wrapper">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className={errors.slug ? "error" : ""}
                  placeholder="company-slug"
                  disabled={isEditMode}
                />
                {!isEditMode && (
                  <button
                    type="button"
                    className="btn-check-slug"
                    onClick={checkSlugAvailability}
                    disabled={checkingSlug}
                  >
                    {checkingSlug ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      t("Check")
                    )}
                  </button>
                )}
              </div>
              {slugAvailable === true && (
                <span className="success-message">
                  <i className="fas fa-check-circle"></i>{" "}
                  {t("Slug is available")}
                </span>
              )}
              {slugAvailable === false && (
                <span className="error-message">
                  <i className="fas fa-times-circle"></i>{" "}
                  {t("Slug is already taken")}
                </span>
              )}
              {errors.slug && (
                <span className="error-message">{errors.slug}</span>
              )}
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label htmlFor="email">{t("Company Email")}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t("Company Phone")}</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+20 123 456 789"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">{t("Address")}</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder={t("Enter company address")}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_person">{t("Contact Person")}</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder={t("Primary contact name")}
              />
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="form-section">
          <h2>{t("Status Information")}</h2>

          <div className="form-row two-columns">
            <div className="form-group">
              <label htmlFor="status">{t("Status")}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="trial">{t("Trial")}</option>
                <option value="active">{t("Active")}</option>
                <option value="suspended">{t("Suspended")}</option>
                <option value="cancelled">{t("Cancelled")}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trial_ends_at">{t("Trial Ends At")}</label>
              <input
                type="date"
                id="trial_ends_at"
                name="trial_ends_at"
                value={formData.trial_ends_at}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Admin Account (Create Only) */}
        {!isEditMode && (
          <div className="form-section">
            <h2>{t("Admin Account")}</h2>
            <p className="section-description">
              {t("Create the first admin user for this company")}
            </p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="admin_name">
                  {t("Admin Name")} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="admin_name"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  className={errors.admin_name ? "error" : ""}
                  placeholder={t("Enter admin full name")}
                />
                {errors.admin_name && (
                  <span className="error-message">{errors.admin_name}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="admin_email">
                  {t("Admin Email")} <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="admin_email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={errors.admin_email ? "error" : ""}
                  placeholder="admin@company.com"
                />
                {errors.admin_email && (
                  <span className="error-message">{errors.admin_email}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="admin_password">
                  {t("Admin Password")} <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="admin_password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  className={errors.admin_password ? "error" : ""}
                  placeholder={t("Minimum 8 characters")}
                />
                {errors.admin_password && (
                  <span className="error-message">{errors.admin_password}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/saas/companies")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {t("Saving...")}
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                {isEditMode ? t("Update Company") : t("Create Company")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
