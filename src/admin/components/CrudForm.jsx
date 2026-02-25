// src/pages/admin/CrudForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/axios";
import { notifyError, notifySuccess } from "../../utils/notify";
import AdminLayout from "../layouts/AdminLayout";

// === schema لكل جدول (لـ form defaults) ===
const tableSchemas = {
  users: { name: "", email: "", password: "", role: "user", status: "1" },
  products: {
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
    unit_price: 0,
    quantity: 0,
    category_id: "",
    product_image: "",
  },
  categories: {
    cate_image: "",
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
  },
  customers: { name: "", email: "", password: "", status: "1" },

  // NOTE: لو انت بتستخدم ERP module للأوامر والفواتير… ده مكانه
  orders: {
    customer_id: "",
    status: "pending",
    total: "",
    created_by: "",
  },

  invoices: {
    title: "",
    total: 0,
    status: "pending",
    customer_id: "",
  },
  "purchase-orders": {
    title: "",
    quantity: 0,
    unit_price: 0,
    supplier_id: "",
    status: "pending",
  },
  employees: { name: "", email: "", password: "", salary: 0 },
  sales: {
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
    unit_price: 0,
    quantity: 0,
    employee_id: "",
  },
  reservations: {
    name: "",
    email: "",
    persons: 1,
    date: "",
    time: "",
    message: "",
  },
  suppliers: {
    name: "",
    email: "",
    phone: "",
  },
  appointments: {
    patient_id: "",
    doctor_name: "",
    appointment_date: "",
    appointment_time: "",
    status: "scheduled",
    notes: "",
  },
};

// ERP endpoints base (/erp) vs admin endpoints base (/admin)
const ERP_TABLES = ["orders", "invoices", "purchase-orders"];

// UI route alias -> API resource mapping
const TABLE_ALIAS = {
  patients: "customers",
};

// optional nice labels
const UI_LABELS = {
  patients: "Patients",
  customers: "Customers",
};

const CrudForm = () => {
  const navigate = useNavigate();
  const { table, id } = useParams();
  const isEdit = Boolean(id);

  // Resolve alias: route table -> api table
  const apiTable = useMemo(() => TABLE_ALIAS[table] ?? table, [table]);

  // Resolve schema by apiTable (NOT route table)
  const schema = useMemo(() => tableSchemas[apiTable], [apiTable]);

  // Determine base url by apiTable
  const baseUrl = useMemo(
    () => (ERP_TABLES.includes(apiTable) ? "/erp" : "/admin"),
    [apiTable],
  );

  const pageTitle = useMemo(
    () => UI_LABELS[table] ?? table.replace(/_/g, " "),
    [table],
  );

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // === Load Data for Edit ===
  useEffect(() => {
    if (!schema) {
      console.error("Unknown table:", table, "-> apiTable:", apiTable);
      return;
    }

    if (isEdit) {
      setLoading(true);
      api
        .get(`${baseUrl}/${apiTable}/${id}`)
        .then((res) => {
          // بعض الـ APIs بتلف الداتا داخل data
          const payload = res.data?.data ?? res.data;
          setFormData(payload);
        })
        .catch((err) => {
          console.error(err);
          notifyError("Failed to load data");
        })
        .finally(() => setLoading(false));
    } else {
      setFormData(schema);
    }
  }, [table, apiTable, id, isEdit, baseUrl, schema]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // convert number fields if schema says number
    const shouldBeNumber =
      schema && typeof schema[name] === "number" && value !== "";

    setFormData((prev) => ({
      ...prev,
      [name]: shouldBeNumber ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await api.put(`${baseUrl}/${apiTable}/${id}`, formData);
        notifySuccess("Updated successfully ✅");
      } else {
        await api.post(`${baseUrl}/${apiTable}`, formData);
        notifySuccess("Created successfully ✅");
      }

      // رجّع المستخدم لنفس القائمة اللي كان فيها (patients أو customers…)
      navigate(`/admin/${table}`);
    } catch (err) {
      notifyError("Something went wrong ❌");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  // === Determine select options for ERP-specific fields ===
  const getOptions = (key) => {
    if (key === "status") {
      if (apiTable === "orders") return ["pending", "confirmed", "cancelled"];
      if (apiTable === "invoices")
        return ["unpaid", "partially_paid", "paid", "cancelled"];
      if (apiTable === "purchase-orders")
        return ["pending", "received", "paid"];
      return ["active", "blocked"];
    }
    if (key === "role") return ["user", "admin"];
    return null;
  };

  // guard: schema missing
  if (!schema) {
    return (
      <div className="container-fluid">
        <AdminLayout />
        <p className="p-6">Unknown table: {String(table)}</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <AdminLayout />
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-gradient-info text-white">
              <h3 className="card-title">
                <i
                  className={`fas fa-${isEdit ? "edit" : "plus-square"} mr-2`}
                ></i>
                {isEdit ? "Edit" : "New"} {pageTitle}
              </h3>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  {Object.keys(formData).map((key) => {
                    const options = getOptions(key);
                    return (
                      <div className="col-md-6 col-lg-4 mb-3" key={key}>
                        <label className="small font-weight-bold text-uppercase text-muted">
                          {key.replace(/_/g, " ")}
                        </label>

                        {options ? (
                          <select
                            name={key}
                            value={formData[key] ?? ""}
                            onChange={handleChange}
                            className="form-control shadow-sm"
                          >
                            {options.map((o) => (
                              <option key={o} value={o}>
                                {o.charAt(0).toUpperCase() + o.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              typeof schema[key] === "number"
                                ? "number"
                                : "text"
                            }
                            name={key}
                            value={formData[key] ?? ""}
                            onChange={handleChange}
                            className="form-control shadow-sm"
                            placeholder={`${key.replace(/_/g, " ")}...`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="btn btn-outline-danger mr-2"
                    >
                      <i className="fas fa-times mr-1"></i> Cancel
                    </button>

                    <div className="ml-auto">
                      <button
                        type="submit"
                        className="btn btn-success px-4"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm mr-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i
                              className={`fas fa-${isEdit ? "save" : "check"} mr-2`}
                            ></i>
                            {isEdit ? "Save Changes" : "Submit"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrudForm;
