import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../../services/axios";

export default function TreatmentPlanDetailsPage() {
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cashSummary, setCashSummary] = useState(null);
  const [procedures, setProcedures] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemForm, setItemForm] = useState({
    procedure_id: "",
    tooth_number: "",
    surface: "",
    notes: "",
    price: "",
  });

  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState("");
  const [itemSuccess, setItemSuccess] = useState("");

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      setItemError("");
      setItemSuccess("");

      const [planRes, itemsRes, summaryRes, cashRes, proceduresRes] =
        await Promise.all([
          axios.get(`/erp/treatment-plans/${id}`),
          axios.get(`/erp/treatment-plans/${id}/items`),
          axios.get(`/erp/treatment-plans/${id}/summary`),
          axios.get(`/erp/treatment-plans/${id}/cash-summary`),
          axios.get(`/erp/procedures`),
        ]);

      setPlan(planRes.data || null);
      setItems(itemsRes.data?.data || []);
      setSummary(summaryRes.data?.data || null);
      setCashSummary(cashRes.data?.data || null);

      const proceduresPayload = proceduresRes.data || {};
      const proceduresRows = Array.isArray(proceduresPayload.data)
        ? proceduresPayload.data
        : proceduresPayload.data?.data || [];

      setProcedures(proceduresRows);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to load treatment plan details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItem = async (e) => {
    e.preventDefault();

    try {
      setSavingItem(true);
      setItemError("");
      setItemSuccess("");

      const payload = {
        procedure_id: Number(itemForm.procedure_id),
        tooth_number: itemForm.tooth_number || null,
        surface: itemForm.surface || null,
        notes: itemForm.notes || null,
      };

      if (itemForm.price !== "") {
        payload.price = Number(itemForm.price);
      }

      await axios.post(`/erp/treatment-plans/${id}/items`, payload);

      setItemSuccess("Item added successfully.");

      setItemForm({
        procedure_id: "",
        tooth_number: "",
        surface: "",
        notes: "",
        price: "",
      });

      await loadAll();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        setItemError(firstError || "Failed to add item.");
      } else {
        setItemError(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to add item.",
        );
      }
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      setItemError("");
      setItemSuccess("");

      await axios.delete(`/erp/treatment-plan-items/${itemId}`);

      setItemSuccess("Item deleted successfully.");
      await loadAll();
    } catch (err) {
      setItemError(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to delete item.",
      );
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("en-US");
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const planData = plan?.data || plan || {};
  const customer = planData.customer || {};
  const invoices = summary?.invoices || [];
  const totals = summary?.totals || {};
  const cash = cashSummary?.cash || {};
  const credit = cashSummary?.customer_credit_balance || {};

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}

      <div className="d-flex justify-content-between mb-4">
        <h3 className="fw-bold">Treatment Plan Details</h3>

        <div className="d-flex gap-2">
          <Link
            to="/admin/erp/treatment-plans"
            className="btn btn-outline-secondary"
          >
            Back
          </Link>

          {customer.id && (
            <Link
              to={`/admin/erp/patients/${customer.id}/profile`}
              className="btn btn-outline-primary"
            >
              Patient
            </Link>
          )}
        </div>
      </div>

      {/* PLAN INFO */}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <InfoItem label="Title" value={planData.title} />

            <InfoItem label="Patient" value={customer.name} />

            <InfoItem
              label="Status"
              value={<StatusBadge status={planData.status} />}
            />

            <InfoItem label="Total Cost" value={money(planData.total_cost)} />

            <InfoItem label="Created" value={formatDate(planData.created_at)} />

            <div className="col-12">
              <div className="small text-muted">Notes</div>
              <div className="fw-semibold">{planData.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}

      <div className="row g-3 mb-4">
        <KpiCard title="Total Invoiced" value={money(totals.total_invoiced)} />

        <KpiCard
          title="Total Paid"
          value={money(totals.total_paid)}
          color="success"
        />

        <KpiCard
          title="Remaining"
          value={money(totals.remaining_on_plan)}
          color="warning"
        />

        <KpiCard title="Net Cash" value={money(cash.net_cash)} color="dark" />
      </div>

      {/* PLAN ITEMS */}

      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h5 className="mb-0">Plan Items</h5>
        </div>

        <div className="card-body p-0">
          {items.length === 0 ? (
            <div className="p-3 text-muted">No items found.</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Procedure</th>
                  <th>Tooth</th>
                  <th>Surface</th>
                  <th>Price</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.procedureRef?.name || item.procedure}</td>

                    <td>{item.tooth_number || "-"}</td>

                    <td>{item.surface || "-"}</td>

                    <td>{money(item.price)}</td>

                    <td>{item.notes || "-"}</td>

                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteItem(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* INVOICES */}

      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Linked Invoices</h5>
        </div>

        <div className="card-body p-0">
          {invoices.length === 0 ? (
            <div className="p-3 text-muted">No invoices linked.</div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Number</th>
                  <th>Total</th>
                  <th>Net Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link
                        to={`/admin/erp/invoices/${inv.id}`}
                        className="text-decoration-none"
                      >
                        {inv.number}
                      </Link>
                    </td>

                    <td>{money(inv.total)}</td>

                    <td>{money(inv.net_paid)}</td>

                    <td>{money(inv.remaining)}</td>

                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color = "primary" }) {
  return (
    <div className="col-md-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small">{title}</div>
          <div className={`fw-bold text-${color}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="col-md-4">
      <div className="small text-muted">{label}</div>
      <div className="fw-semibold">{value || "-"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  let cls = "secondary";

  if (value === "completed") cls = "success";
  else if (value === "cancelled") cls = "danger";
  else if (value === "active") cls = "warning";

  return <span className={`badge bg-${cls}`}>{status}</span>;
}
