import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../services/axios";
import toast from "react-hot-toast";
import "./BillingPage.css";

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");

  // ========================= Queries =========================
  const { data: subscription, isLoading: loadingSub } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: async () => {
      const res = await axios.get("/erp/billing/subscription");
      return res.data.data;
    },
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ["billing-invoices"],
    queryFn: async () => {
      const res = await axios.get("/erp/billing/invoices");
      return res.data.data;
    },
  });

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ["available-plans"],
    queryFn: async () => {
      const res = await axios.get("/erp/billing/plans");
      return res.data.data;
    },
    enabled: showPlansModal,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await axios.get("/erp/billing/payment-methods");
      return res.data.data;
    },
  });

  // ========================= Mutations =========================
  const subscribeMutation = useMutation({
    mutationFn: ({ planId, cycle }) =>
      axios.post("/erp/billing/subscribe", {
        plan_id: planId,
        billing_cycle: cycle,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["current-subscription"]);
      queryClient.invalidateQueries(["billing-invoices"]);
      toast.success(t("Subscription updated successfully"));
      setShowPlansModal(false);
      setSelectedPlan(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to update subscription"),
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => axios.post("/erp/billing/cancel"),
    onSuccess: () => {
      queryClient.invalidateQueries(["current-subscription"]);
      toast.success(t("Subscription cancelled successfully"));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to cancel subscription"),
      );
    },
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: (data) => axios.post("/erp/billing/payment-methods", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success(t("Payment method added successfully"));
    },
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (id) => axios.delete(`/erp/billing/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success(t("Payment method removed"));
    },
  });

  // ========================= Handlers =========================
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // ✅ أضف الـ Handler ده
  const handleChangePlan = () => {
    // اختيار الخطة الحالية تلقائيًا لما تفتح الـ Modal
    if (subscription?.plan) {
      setSelectedPlan(subscription.plan);
    }
    setShowPlansModal(true);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    subscribeMutation.mutate({
      planId: selectedPlan.id,
      cycle: billingCycle,
    });
  };

  const handleCancel = () => {
    if (
      window.confirm(t("Are you sure you want to cancel your subscription?"))
    ) {
      cancelMutation.mutate();
    }
  };

  const formatCurrency = (value) => {
    const lang = i18n.language === "ar" ? "ar-EG" : "en-US";
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));
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

  const getDaysLeft = (endsAt) => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ========================= Loading State =========================
  if (loadingSub) {
    return (
      <div className="billing-loading">
        <div className="loading-spinner"></div>
        <p>{t("Loading billing information...")}</p>
      </div>
    );
  }

  // ========================= UI =========================
  return (
    <div className="billing-page">
      {/* Header */}
      <div className="billing-header">
        <h1>{t("Billing & Subscription")}</h1>
        <p>{t("Manage your subscription and payment methods")}</p>
      </div>

      {/* Current Plan */}
      <div className="billing-section">
        <h2>{t("Current Plan")}</h2>
        <div className="current-plan-card">
          {subscription ? (
            <>
              <div className="plan-info">
                <div className="plan-name">
                  <h3>{subscription.plan?.name || t("No Active Plan")}</h3>
                  <StatusBadge status={subscription.status} t={t} />
                </div>
                <p className="plan-price">
                  {formatCurrency(subscription.amount)} / {t("month")}
                </p>
                <p className="plan-period">
                  {t("Started")}: {formatDate(subscription.starts_at)}
                </p>
                {subscription.ends_at && (
                  <p className="plan-period">
                    {t("Renews on")}: {formatDate(subscription.ends_at)}
                    {getDaysLeft(subscription.ends_at) > 0 && (
                      <span className="days-left">
                        ({getDaysLeft(subscription.ends_at)} {t("days left")})
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="plan-actions">
                <button className="btn-change-plan" onClick={handleChangePlan}>
                  {t("Change Plan")}
                </button>
                {subscription.status === "active" && (
                  <button className="btn-cancel-plan" onClick={handleCancel}>
                    {t("Cancel Subscription")}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-plan">
              <p>{t("You don't have an active subscription")}</p>
              <button
                className="btn-choose-plan"
                onClick={() => setShowPlansModal(true)}
              >
                {t("Choose a Plan")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="billing-section">
        <h2>{t("Payment Methods")}</h2>
        <div className="payment-methods-list">
          {paymentMethods?.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="payment-method-icon">
                <i className={getCardIcon(method.card_brand)}></i>
              </div>
              <div className="payment-method-info">
                <span className="card-brand">{method.card_brand}</span>
                <span className="card-number">•••• {method.card_last4}</span>
                <span className="card-expiry">
                  {t("Expires")} {method.card_exp_month}/{method.card_exp_year}
                </span>
              </div>
              {method.is_default && (
                <span className="default-badge">{t("Default")}</span>
              )}
              <button
                className="btn-remove"
                onClick={() => removePaymentMethodMutation.mutate(method.id)}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button className="btn-add-payment">
            <i className="fas fa-plus"></i>
            {t("Add Payment Method")}
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="billing-section">
        <h2>{t("Billing History")}</h2>
        {loadingInvoices ? (
          <p>{t("Loading...")}</p>
        ) : invoices?.length > 0 ? (
          <div className="invoices-table-wrapper">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>{t("Invoice")}</th>
                  <th>{t("Date")}</th>
                  <th>{t("Amount")}</th>
                  <th>{t("Status")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.number}</td>
                    <td>{formatDate(invoice.created_at)}</td>
                    <td>{formatCurrency(invoice.amount)}</td>
                    <td>
                      <StatusBadge status={invoice.status} t={t} />
                    </td>
                    <td>
                      <button className="btn-download">
                        <i className="fas fa-download"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">{t("No billing history")}</p>
        )}
      </div>

      {/* Plans Modal */}
      {showPlansModal && (
        <PlansModal
          plans={plans}
          currentPlan={subscription?.plan}
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          onSelect={handleSelectPlan}
          onSubscribe={handleSubscribe}
          onClose={() => {
            setShowPlansModal(false);
            setSelectedPlan(null);
          }}
          isSubmitting={subscribeMutation.isPending}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}
    </div>
  );
}

// ========================= Sub-Components =========================

function StatusBadge({ status, t }) {
  const statusMap = {
    active: { label: "Active", class: "success" },
    pending: { label: "Pending", class: "warning" },
    cancelled: { label: "Cancelled", class: "danger" },
    expired: { label: "Expired", class: "secondary" },
    trial: { label: "Trial", class: "info" },
  };
  const info = statusMap[status] || { label: status, class: "secondary" };
  return (
    <span className={`status-badge status-${info.class}`}>{t(info.label)}</span>
  );
}

function PlansModal({
  plans,
  currentPlan,
  selectedPlan,
  billingCycle,
  setBillingCycle,
  onSelect,
  onSubscribe,
  onClose,
  isSubmitting,
  formatCurrency,
  t,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plans-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("Choose Your Plan")}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="billing-cycle-toggle">
          <button
            className={`cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            {t("Monthly")}
          </button>
          <button
            className={`cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            {t("Yearly")}
            <span className="save-badge">{t("Save 20%")}</span>
          </button>
        </div>

        <div className="plans-grid">
          {plans?.map((plan) => {
            const price =
              billingCycle === "monthly"
                ? plan.price_monthly
                : plan.price_yearly || plan.price_monthly * 10;
            const isCurrent = currentPlan?.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onSelect(plan)}
              >
                {isCurrent && (
                  <span className="current-badge">{t("Current")}</span>
                )}
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">{formatCurrency(price)}</span>
                  <span className="period">
                    /{t(billingCycle === "monthly" ? "mo" : "yr")}
                  </span>
                </div>
                <ul className="plan-features">
                  {plan.features?.slice(0, 5).map((feature, idx) => (
                    <li key={idx}>
                      <i className="fas fa-check"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button
            className="btn-subscribe"
            onClick={onSubscribe}
            disabled={!selectedPlan || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {t("Processing...")}
              </>
            ) : (
              t("Subscribe")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCardIcon(brand) {
  const icons = {
    visa: "fa-cc-visa",
    mastercard: "fa-cc-mastercard",
    amex: "fa-cc-amex",
    discover: "fa-cc-discover",
  };
  return icons[brand?.toLowerCase()] || "fa-credit-card";
}
