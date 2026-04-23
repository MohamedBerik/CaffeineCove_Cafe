import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../../services/axios";
import toast from "react-hot-toast";
import "./BillingPage.css";

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [cardData, setCardData] = useState({
    card_number: "",
    card_exp_month: "",
    card_exp_year: "",
    card_cvc: "",
    card_name: "",
    is_default: true,
  });
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState(null);

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
    onSuccess: (response) => {
      const { payment_url, subscription_id } = response.data;

      // ✅ افتح iframe PayMob
      setPaymentUrl(payment_url);
      setPendingSubscriptionId(subscription_id);
      setShowPaymentIframe(true);
      setShowPlansModal(false);

      toast.success(t("Redirecting to payment gateway..."));
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to initiate payment"),
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

  const changeMutation = useMutation({
    mutationFn: ({ planId, cycle }) =>
      axios.post("/erp/billing/change", {
        plan_id: planId,
        billing_cycle: cycle,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["current-subscription"]);
      queryClient.invalidateQueries(["billing-invoices"]);
      toast.success(t("Plan changed successfully"));
      setShowPlansModal(false);
      setSelectedPlan(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("Failed to change plan"));
    },
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: (data) => axios.post("/erp/billing/payment-methods", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["payment-methods"]);
      toast.success(t("Payment method added successfully"));
      setShowPaymentModal(false);
      resetCardForm();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || t("Failed to add payment method"),
      );
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

  const handleChangePlan = () => {
    if (subscription?.plan) {
      setSelectedPlan(subscription.plan);
    }
    setShowPlansModal(true);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;

    // ✅ لو فيه اشتراك حالي → change
    if (subscription && subscription.status === "active") {
      changeMutation.mutate({
        planId: selectedPlan.id,
        cycle: billingCycle,
      });
    } else {
      // ✅ لو مفيش → subscribe جديد
      subscribeMutation.mutate({
        planId: selectedPlan.id,
        cycle: billingCycle,
      });
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(t("Are you sure you want to cancel your subscription?"))
    ) {
      cancelMutation.mutate();
    }
  };

  const handleAddPaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentIframe(false);
    setPaymentUrl("");
    setPendingSubscriptionId(null);

    // تحديث بيانات الاشتراك
    queryClient.invalidateQueries(["current-subscription"]);
    queryClient.invalidateQueries(["billing-invoices"]);

    toast.success(t("Payment successful! Your subscription is now active."));
  };

  const handlePaymentCancel = () => {
    setShowPaymentIframe(false);
    setPaymentUrl("");

    // إلغاء الاشتراك المعلق
    if (pendingSubscriptionId) {
      axios
        .post(`/erp/billing/cancel-pending/${pendingSubscriptionId}`)
        .catch(console.error);
      setPendingSubscriptionId(null);
    }

    toast.error(t("Payment was cancelled."));
  };

  const resetCardForm = () => {
    setCardData({
      card_number: "",
      card_exp_month: "",
      card_exp_year: "",
      card_cvc: "",
      card_name: "",
      is_default: true,
    });
  };

  const getCardBrand = (number) => {
    const firstDigit = number.charAt(0);
    const firstTwoDigits = number.substring(0, 2);

    if (number.startsWith("4")) return "Visa";
    if (number.startsWith("5")) return "Mastercard";
    if (number.startsWith("34") || number.startsWith("37")) return "Amex";
    if (number.startsWith("6")) return "Discover";
    return "Card";
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();

    const brand = getCardBrand(cardData.card_number);
    const last4 = cardData.card_number.slice(-4);

    addPaymentMethodMutation.mutate({
      stripe_token: "tok_" + Math.random().toString(36).substr(2, 9),
      card_brand: brand,
      card_last4: last4,
      card_exp_month: parseInt(cardData.card_exp_month),
      card_exp_year: parseInt(cardData.card_exp_year),
      is_default: cardData.is_default,
    });
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

  const getDaysLeft = (endsAt) => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  useEffect(() => {
    const handleMessage = (event) => {
      // PayMob بتبعت رسالة لما الدفع ينجح
      if (event.data?.type === "payment_success") {
        handlePaymentSuccess();
      }
      if (event.data?.type === "payment_failed") {
        handlePaymentCancel();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
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
                  {formatCurrency(subscription.amount)} /{" "}
                  {t(subscription.billing_cycle || "month")}
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
          <button className="btn-add-payment" onClick={handleAddPaymentMethod}>
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

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t("Add Payment Method")}</h2>
              <button
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="payment-form">
              <div className="form-group">
                <label>{t("Cardholder Name")}</label>
                <input
                  type="text"
                  value={cardData.card_name}
                  onChange={(e) =>
                    setCardData({ ...cardData, card_name: e.target.value })
                  }
                  placeholder={t("John Doe")}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t("Card Number")}</label>
                <div className="card-input-wrapper">
                  <input
                    type="text"
                    value={cardData.card_number}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        card_number: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="4242 4242 4242 4242"
                    maxLength="16"
                    required
                  />
                  {cardData.card_number && (
                    <span className="card-brand-icon">
                      <i
                        className={getCardIcon(
                          getCardBrand(cardData.card_number),
                        )}
                      ></i>
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row three-columns">
                <div className="form-group">
                  <label>{t("Expiry Month")}</label>
                  <input
                    type="text"
                    value={cardData.card_exp_month}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        card_exp_month: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="MM"
                    maxLength="2"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Expiry Year")}</label>
                  <input
                    type="text"
                    value={cardData.card_exp_year}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        card_exp_year: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="YYYY"
                    maxLength="4"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("CVC")}</label>
                  <input
                    type="text"
                    value={cardData.card_cvc}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        card_cvc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={cardData.is_default}
                    onChange={(e) =>
                      setCardData({ ...cardData, is_default: e.target.checked })
                    }
                  />
                  {t("Set as default payment method")}
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowPaymentModal(false)}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={addPaymentMethodMutation.isPending}
                >
                  {addPaymentMethodMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {t("Processing...")}
                    </>
                  ) : (
                    t("Add Card")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Iframe Modal */}
      {showPaymentIframe && paymentUrl && (
        <div className="modal-overlay">
          <div
            className="payment-modal"
            style={{ maxWidth: "600px", padding: 0 }}
          >
            <div className="modal-header">
              <h2>{t("Complete Your Payment")}</h2>
              <button className="modal-close" onClick={handlePaymentCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: "1rem" }}>
              <iframe
                src={paymentUrl}
                width="100%"
                height="600"
                frameBorder="0"
                style={{ borderRadius: "12px" }}
                title="PayMob Payment"
              />
              <p className="iframe-note">
                <i className="fas fa-shield-alt"></i>{" "}
                {t("Your payment is secure and encrypted by PayMob")}
              </p>
            </div>
          </div>
        </div>
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
                  {plan.features &&
                    Array.isArray(plan.features) &&
                    plan.features.slice(0, 5).map((feature, idx) => (
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
