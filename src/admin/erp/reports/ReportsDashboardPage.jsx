import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function ReportsDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: today,
    to: today,
    doctor_id: "",
  });

  const reportCards = useMemo(
    () => [
      {
        title: "Revenue Report",
        description: "Track revenue, paid amounts, and outstanding balances.",
        icon: "fas fa-money-bill-wave",
        color: "success",
        to: "/admin/erp/reports/revenue",
      },
      {
        title: "Appointments Report",
        description:
          "Review scheduled, completed, cancelled, and no-show visits.",
        icon: "fas fa-calendar-check",
        color: "primary",
        to: "/admin/erp/reports/appointments",
      },
      {
        title: "Doctor Performance",
        description:
          "Compare doctors by appointment volume and completed visits.",
        icon: "fas fa-user-md",
        color: "info",
        to: "/admin/erp/reports/doctors",
      },
      {
        title: "Payments Report",
        description: "Analyze payments, refunds, and payment methods.",
        icon: "fas fa-credit-card",
        color: "warning",
        to: "/admin/erp/reports/payments",
      },
      {
        title: "Treatment Plans Report",
        description: "Review plan totals, invoicing, and collection progress.",
        icon: "fas fa-notes-medical",
        color: "secondary",
        to: "/admin/erp/reports/treatment-plans",
      },
      {
        title: "Patients Report",
        description:
          "See active patients, new registrations, and patient activity.",
        icon: "fas fa-users",
        color: "dark",
        to: "/admin/erp/reports/patients",
      },
    ],
    [],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 className="fw-bold mb-1">Clinic Reports</h3>
          <p className="text-muted mb-0">
            Reporting hub for finance, appointments, doctors, and patient
            activity
          </p>
        </div>

        <Link to="/admin/erp" className="btn btn-outline-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Global Filters</h5>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">From</label>
              <input
                type="date"
                className="form-control"
                name="from"
                value={filters.from}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">To</label>
              <input
                type="date"
                className="form-control"
                name="to"
                value={filters.to}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Doctor ID</label>
              <input
                type="number"
                className="form-control"
                name="doctor_id"
                value={filters.doctor_id}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mt-3 small text-muted">
            These filters are UI-ready and can be wired to report APIs next.
          </div>
        </div>
      </div>

      <div className="row g-4">
        {reportCards.map((card) => (
          <div className="col-12 col-md-6 col-xl-4" key={card.to}>
            <Link to={card.to} className="text-decoration-none text-dark">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className={`text-${card.color} bg-${card.color} bg-opacity-10 rounded p-3`}
                    >
                      <i className={card.icon}></i>
                    </div>

                    <span className="badge bg-light text-dark">Report</span>
                  </div>

                  <h5 className="fw-bold mb-2">{card.title}</h5>
                  <p className="text-muted mb-0">{card.description}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="card shadow-sm border-0 mt-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Recommended First Reports</h5>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <ReportHint
              title="Revenue Report"
              text="Most important for management because it connects invoices, payments, refunds, and remaining balances."
            />
            <ReportHint
              title="Appointments Report"
              text="Critical for operations because it shows booking load, completion rate, cancellation, and no-show patterns."
            />
            <ReportHint
              title="Doctor Performance"
              text="Useful for comparing doctors and planning schedules, staffing, and productivity."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportHint({ title, text }) {
  return (
    <div className="col-12 col-md-4">
      <div className="border rounded p-3 h-100 bg-light">
        <div className="fw-bold mb-2">{title}</div>
        <div className="text-muted small">{text}</div>
      </div>
    </div>
  );
}
