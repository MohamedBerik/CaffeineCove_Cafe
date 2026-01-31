// src/pages/admin/CrudForm.jsx
import { useEffect, useState } from "react";
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
    price: 0,
    quantity: 0,
    category_id: "",
  },
  categories: {
    title_en: "",
    title_ar: "",
    description_en: "",
    description_ar: "",
    cate_image: "",
  },
  customers: { name: "", email: "", password: "", status: "1" },
  orders: {
    title_en: "",
    description_en: "",
    price: 0,
    quantity: 1,
    customer_id: "",
    status: "pending", // ERP field
  },
  invoices: {
    title: "",
    total: 0,
    status: "pending", // pending, partial, paid
    customer_id: "",
  },
  "purchase-orders": {
    title: "",
    quantity: 0,
    price: 0,
    supplier_id: "",
    status: "pending",
  },
  employees: { name: "", email: "", password: "", salary: 0 },
  sales: {
    title_en: "",
    description_en: "",
    price: 0,
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
};

const ERP_TABLES = ["orders", "invoices", "purchase-orders"];

const CrudForm = () => {
  const navigate = useNavigate();
  const { table, id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = ERP_TABLES.includes(table) ? "/erp" : "/admin";

  // === Load Data for Edit ===
  useEffect(() => {
    if (!tableSchemas[table]) {
      console.error("Unknown table:", table);
      return;
    }

    if (isEdit) {
      setLoading(true);
      api
        .get(`${baseUrl}/${table}/${id}`)
        .then((res) => setFormData(res.data))
        .catch((err) => {
          console.error(err);
          notifyError("Failed to load data");
        })
        .finally(() => setLoading(false));
    } else {
      setFormData(tableSchemas[table]);
    }
  }, [table, id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await api.put(`${baseUrl}/${table}/${id}`, formData);
        notifySuccess("Updated successfully ✅");
      } else {
        await api.post(`${baseUrl}/${table}`, formData);
        notifySuccess("Created successfully ✅");
      }
      navigate("/admin/dashboard");
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
      if (table === "orders") return ["pending", "confirmed", "cancelled"];
      if (table === "invoices") return ["pending", "partial", "paid"];
      if (table === "purchase-orders") return ["pending", "received", "paid"];
      return ["active", "blocked"];
    }
    if (key === "role") return ["user", "admin"];
    return null;
  };

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
                {isEdit ? "Edit" : "New"} {table.replace(/_/g, " ")}
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
                            value={formData[key] || ""}
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
                              typeof formData[key] === "number"
                                ? "number"
                                : "text"
                            }
                            name={key}
                            value={formData[key] || ""}
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
