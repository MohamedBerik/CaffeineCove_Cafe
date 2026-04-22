import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "../../services/axios";
import toast from "react-hot-toast";
import "./PlansList.css";

export default function PlansList() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    price_monthly: "",
    price_yearly: "",
    max_users: "5",
    max_patients: "",
    max_appointments: "",
    features: [],
    is_active: true,
  });

  // ========================= Queries =========================
  const {
    data: plans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await axios.get("/admin/plans");
      return res.data.data;
    },
  });

  // ========================= Mutations =========================
  const createMutation = useMutation({
    mutationFn: (data) => axios.post("/admin/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success(t("Plan created successfully"));
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("Failed to create plan"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/admin/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success(t("Plan updated successfully"));
      setEditingPlan(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("Failed to update plan"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/admin/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success(t("Plan deleted successfully"));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      axios.put(`/admin/plans/${id}/toggle`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success(t("Plan status updated"));
    },
  });

  // ========================= Handlers =========================
  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      price_monthly: "",
      price_yearly: "",
      max_users: "5",
      max_patients: "",
      max_appointments: "",
      features: [],
      is_active: true,
    });
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      name_ar: plan.name_ar || "",
      description: plan.description || "",
      description_ar: plan.description_ar || "",
      price_monthly: plan.price_monthly || "",
      price_yearly: plan.price_yearly || "",
      max_users: plan.max_users || "5",
      max_patients: plan.max_patients || "",
      max_appointments: plan.max_appointments || "",
      features: plan.features || [],
      is_active: plan.is_active !== false,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const featureString =
      typeof formData.features === "string"
        ? formData.features
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : formData.features;

    const submitData = {
      ...formData,
      features: featureString,
      price_monthly: parseFloat(formData.price_monthly) || 0,
      price_yearly: parseFloat(formData.price_yearly) || 0,
      max_users: parseInt(formData.max_users) || 5,
      max_patients: formData.max_patients
        ? parseInt(formData.max_patients)
        : null,
      max_appointments: formData.max_appointments
        ? parseInt(formData.max_appointments)
        : null,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id, name) => {
    if (
      window.confirm(t("Are you sure you want to delete {{name}}?", { name }))
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id, currentStatus) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const getPlanColor = (index) => {
    const colors = ["primary", "success", "warning", "info", "dark"];
    return colors[index % colors.length];
  };

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="plans-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading plans...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className="plans-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>{t("Something went wrong")}</h3>
        <p>{error.message}</p>
        <button className="btn-retry" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Try Again")}
        </button>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="plans-list-container">
      {/* Header */}
      <div className="plans-header">
        <div className="header-title">
          <h1>{t("Plans & Pricing")}</h1>
          <p>{t("Manage subscription plans for your platform")}</p>
        </div>
        <button className="btn-add-plan" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i>
          {t("Add New Plan")}
        </button>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans?.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            color={getPlanColor(index)}
            t={t}
            formatCurrency={formatCurrency}
            onEdit={() => handleEdit(plan)}
            onDelete={() => handleDelete(plan.id, plan.name)}
            onToggle={() => handleToggleStatus(plan.id, plan.is_active)}
          />
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPlan) && (
        <PlanModal
          plan={editingPlan}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowAddModal(false);
            setEditingPlan(null);
            resetForm();
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          t={t}
        />
      )}
    </div>
  );
}

// ========================= Sub-Components =========================

function PlanCard({
  plan,
  color,
  t,
  formatCurrency,
  onEdit,
  onDelete,
  onToggle,
}) {
  const colorMap = {
    primary: { bg: "#1a237e", light: "#e8eaf6" },
    success: { bg: "#2e7d32", light: "#e8f5e9" },
    warning: { bg: "#ed6c02", light: "#fff3e0" },
    info: { bg: "#0288d1", light: "#e3f2fd" },
    dark: { bg: "#212529", light: "#f8f9fa" },
  };
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className={`plan-card ${!plan.is_active ? "inactive" : ""}`}>
      {!plan.is_active && (
        <span className="inactive-badge">{t("Inactive")}</span>
      )}

      <div className="plan-header" style={{ background: colors.bg }}>
        <h3>{plan.name}</h3>
        {plan.name_ar && <span className="plan-name-ar">{plan.name_ar}</span>}
      </div>

      <div className="plan-body">
        <div className="plan-price">
          <span className="price-value">
            {formatCurrency(plan.price_monthly)}
          </span>
          <span className="price-period">/ {t("month")}</span>
        </div>
        {plan.price_yearly > 0 && (
          <div className="plan-price-yearly">
            {formatCurrency(plan.price_yearly)} / {t("year")}
          </div>
        )}

        <p className="plan-description">{plan.description}</p>
        {plan.description_ar && (
          <p className="plan-description-ar">{plan.description_ar}</p>
        )}

        <ul className="plan-features">
          <li>
            <i className="fas fa-users"></i>
            <span>
              {plan.max_users
                ? t("Up to {{count}} users", { count: plan.max_users })
                : t("Unlimited users")}
            </span>
          </li>
          {plan.max_patients && (
            <li>
              <i className="fas fa-user-injured"></i>
              <span>
                {t("Up to {{count}} patients", { count: plan.max_patients })}
              </span>
            </li>
          )}
          {plan.max_appointments && (
            <li>
              <i className="fas fa-calendar-check"></i>
              <span>
                {t("Up to {{count}} appointments/month", {
                  count: plan.max_appointments,
                })}
              </span>
            </li>
          )}
          {plan.features?.map((feature, idx) => (
            <li key={idx}>
              <i
                className="fas fa-check-circle"
                style={{ color: colors.bg }}
              ></i>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="plan-footer">
        <button className="btn-edit" onClick={onEdit}>
          <i className="fas fa-edit"></i>
          {t("Edit")}
        </button>
        <button className="btn-toggle" onClick={onToggle}>
          <i
            className={`fas fa-${plan.is_active ? "toggle-on" : "toggle-off"}`}
          ></i>
          {plan.is_active ? t("Disable") : t("Enable")}
        </button>
        <button className="btn-delete" onClick={onDelete}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

function PlanModal({
  plan,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isSubmitting,
  t,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{plan ? t("Edit Plan") : t("Add New Plan")}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="plan-form">
          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Plan Name (English)")} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Basic"
              />
            </div>
            <div className="form-group">
              <label>{t("Plan Name (Arabic)")}</label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleChange}
                placeholder="أساسي"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Description (English)")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Perfect for small clinics"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Description (Arabic)")}</label>
              <textarea
                name="description_ar"
                value={formData.description_ar}
                onChange={handleChange}
                rows="2"
                placeholder="مناسب للعيادات الصغيرة"
              />
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Monthly Price (EGP)")} *</label>
              <input
                type="number"
                name="price_monthly"
                value={formData.price_monthly}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>{t("Yearly Price (EGP)")}</label>
              <input
                type="number"
                name="price_yearly"
                value={formData.price_yearly}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Max Users")}</label>
              <input
                type="number"
                name="max_users"
                value={formData.max_users}
                onChange={handleChange}
                min="1"
                placeholder="5"
              />
            </div>
            <div className="form-group">
              <label>{t("Max Patients")}</label>
              <input
                type="number"
                name="max_patients"
                value={formData.max_patients}
                onChange={handleChange}
                min="0"
                placeholder={t("Unlimited")}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Max Appointments per Month")}</label>
              <input
                type="number"
                name="max_appointments"
                value={formData.max_appointments}
                onChange={handleChange}
                min="0"
                placeholder={t("Unlimited")}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Features (comma separated)")}</label>
              <textarea
                name="features"
                value={
                  Array.isArray(formData.features)
                    ? formData.features.join(", ")
                    : formData.features
                }
                onChange={handleChange}
                rows="3"
                placeholder="Up to 5 users, Basic reports, Email support"
              />
            </div>
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>{t("Active (available for new subscriptions)")}</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {t("Saving...")}
                </>
              ) : plan ? (
                t("Update Plan")
              ) : (
                t("Create Plan")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
