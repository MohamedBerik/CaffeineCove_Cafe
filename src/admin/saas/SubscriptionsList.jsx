import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/axios";
import toast from "react-hot-toast";
import "./SubscriptionsList.css";

export default function SubscriptionsList() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState({
    company_id: "",
    plan_id: "",
    starts_at: "",
    ends_at: "",
    amount: "",
    status: "active",
    payment_method: "",
    transaction_id: "",
    notes: "",
  });

  // ========================= Queries =========================
  const {
    data: subscriptionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subscriptions", page, search, statusFilter],
    queryFn: async () => {
      const res = await api.get("/saas/subscriptions", {
        params: {
          page,
          search,
          status: statusFilter,
          per_page: 15,
        },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const res = await api.get("/saas/companies?per_page=100");
      return res.data.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => {
      const res = await api.get("/saas/plans?per_page=100");
      return res.data.data;
    },
  });

  // ========================= Mutations =========================
  const createMutation = useMutation({
    mutationFn: (data) => api.post("/saas/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions"]);
      toast.success(t("Subscription created successfully"));
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to create subscription"),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/saas/subscriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions"]);
      toast.success(t("Subscription updated successfully"));
      setSelectedSubscription(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to update subscription"),
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/saas/subscriptions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions"]);
      toast.success(t("Subscription cancelled successfully"));
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id) => api.post(`/saas/subscriptions/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions"]);
      toast.success(t("Subscription renewed successfully"));
    },
  });

  // ========================= Handlers =========================
  const resetForm = () => {
    setFormData({
      company_id: "",
      plan_id: "",
      starts_at: "",
      ends_at: "",
      amount: "",
      status: "active",
      payment_method: "",
      transaction_id: "",
      notes: "",
    });
  };

  const handleEdit = (subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      company_id: subscription.company_id,
      plan_id: subscription.plan_id,
      starts_at: subscription.starts_at?.split("T")[0] || "",
      ends_at: subscription.ends_at?.split("T")[0] || "",
      amount: subscription.amount || "",
      status: subscription.status || "active",
      payment_method: subscription.payment_method || "",
      transaction_id: subscription.transaction_id || "",
      notes: subscription.notes || "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
    };

    if (selectedSubscription) {
      updateMutation.mutate({ id: selectedSubscription.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCancel = (id) => {
    if (
      window.confirm(t("Are you sure you want to cancel this subscription?"))
    ) {
      cancelMutation.mutate(id);
    }
  };

  const handleRenew = (id) => {
    if (
      window.confirm(t("Are you sure you want to renew this subscription?"))
    ) {
      renewMutation.mutate(id);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
      return new Date(value).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "success",
      pending: "warning",
      cancelled: "danger",
      expired: "secondary",
      trial: "info",
    };
    return colors[status] || "secondary";
  };

  const subscriptions = subscriptionsData?.data || [];
  const meta = subscriptionsData?.meta || {};

  // ========================= Loading State =========================
  if (isLoading) {
    return (
      <div className="subscriptions-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading subscriptions...")}</p>
      </div>
    );
  }

  // ========================= Error State =========================
  if (error) {
    return (
      <div className="subscriptions-error">
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
    <div className="subscriptions-list-container">
      {/* Header */}
      <div className="subscriptions-header">
        <div className="header-title">
          <h1>{t("Subscriptions")}</h1>
          <p>{t("Manage all company subscriptions")}</p>
        </div>
        <button
          className="btn-add-subscription"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus"></i>
          {t("Add Subscription")}
        </button>
      </div>

      {/* Filters */}
      <div className="subscriptions-filters">
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={t("Search by company or plan...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-wrapper">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("All Status")}</option>
            <option value="active">{t("Active")}</option>
            <option value="pending">{t("Pending")}</option>
            <option value="cancelled">{t("Cancelled")}</option>
            <option value="expired">{t("Expired")}</option>
            <option value="trial">{t("Trial")}</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={refetch}>
          <i className="fas fa-sync-alt"></i>
          {t("Refresh")}
        </button>
      </div>

      {/* Table */}
      <div className="subscriptions-table-wrapper">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>{t("Company")}</th>
              <th>{t("Plan")}</th>
              <th>{t("Amount")}</th>
              <th>{t("Status")}</th>
              <th>{t("Start Date")}</th>
              <th>{t("End Date")}</th>
              <th>{t("Payment Method")}</th>
              <th className="text-center">{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table">
                  <i className="fas fa-credit-card"></i>
                  <p>{t("No subscriptions found")}</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <Link
                      to={`/admin/companies/${sub.company_id}`}
                      className="company-link"
                    >
                      {sub.company?.name || "-"}
                    </Link>
                  </td>
                  <td>{sub.plan?.name || "-"}</td>
                  <td className="amount">{formatCurrency(sub.amount)}</td>
                  <td>
                    <StatusBadge
                      status={sub.status}
                      color={getStatusColor(sub.status)}
                      t={t}
                    />
                  </td>
                  <td>{formatDate(sub.starts_at)}</td>
                  <td>{formatDate(sub.ends_at)}</td>
                  <td>{sub.payment_method || "-"}</td>
                  <td>
                    <div className="actions-wrapper">
                      <button
                        className="btn-action edit"
                        onClick={() => handleEdit(sub)}
                        title={t("Edit")}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {sub.status === "active" && (
                        <>
                          <button
                            className="btn-action renew"
                            onClick={() => handleRenew(sub.id)}
                            title={t("Renew")}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          <button
                            className="btn-action cancel"
                            onClick={() => handleCancel(sub.id)}
                            title={t("Cancel")}
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="subscriptions-pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <span className="pagination-info">
            {t("Page {{current}} of {{total}}", {
              current: meta.current_page,
              total: meta.last_page,
            })}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === meta.last_page}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || selectedSubscription) && (
        <SubscriptionModal
          subscription={selectedSubscription}
          formData={formData}
          setFormData={setFormData}
          companies={companies || []}
          plans={plans || []}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSubscription(null);
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

function StatusBadge({ status, color, t }) {
  const statusMap = {
    active: "Active",
    pending: "Pending",
    cancelled: "Cancelled",
    expired: "Expired",
    trial: "Trial",
  };
  return (
    <span className={`status-badge status-${color}`}>
      <span className="status-dot"></span>
      {t(statusMap[status] || status)}
    </span>
  );
}

function SubscriptionModal({
  subscription,
  formData,
  setFormData,
  companies,
  plans,
  onSubmit,
  onClose,
  isSubmitting,
  t,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-fill amount when plan is selected
    if (name === "plan_id" && value) {
      const selectedPlan = plans.find((p) => p.id === parseInt(value));
      if (selectedPlan) {
        setFormData((prev) => ({
          ...prev,
          plan_id: value,
          amount: selectedPlan.price_monthly || prev.amount,
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {subscription ? t("Edit Subscription") : t("Add Subscription")}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="subscription-form">
          <div className="form-row">
            <div className="form-group">
              <label>{t("Company")} *</label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
                disabled={!!subscription}
              >
                <option value="">{t("Select Company")}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Plan")} *</label>
              <select
                name="plan_id"
                value={formData.plan_id}
                onChange={handleChange}
                required
              >
                <option value="">{t("Select Plan")}</option>
                {plans
                  .filter((p) => p.is_active)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price_monthly} EGP
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Start Date")} *</label>
              <input
                type="date"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{t("End Date")}</label>
              <input
                type="date"
                name="ends_at"
                value={formData.ends_at}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Amount (EGP)")} *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>{t("Status")}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">{t("Active")}</option>
                <option value="pending">{t("Pending")}</option>
                <option value="trial">{t("Trial")}</option>
                <option value="cancelled">{t("Cancelled")}</option>
                <option value="expired">{t("Expired")}</option>
              </select>
            </div>
          </div>

          <div className="form-row two-columns">
            <div className="form-group">
              <label>{t("Payment Method")}</label>
              <input
                type="text"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                placeholder={t("Cash, Card, Transfer...")}
              />
            </div>
            <div className="form-group">
              <label>{t("Transaction ID")}</label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleChange}
                placeholder={t("Optional")}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t("Notes")}</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder={t("Additional notes...")}
              />
            </div>
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
              ) : subscription ? (
                t("Update Subscription")
              ) : (
                t("Create Subscription")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
