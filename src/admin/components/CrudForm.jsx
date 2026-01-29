import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createEntity,
  updateEntity,
  getEntityById,
} from "../../services/adminApi";
import { notifyError, notifySuccess } from "../../utils/notify";
import AdminLayout from "../layouts/AdminLayout";

// === schema لكل جدول (حدد الحقول المطلوبة لكل جدول) ===
const tableSchemas = {
  users: { name: "", email: "", password: "", role: "", status: "" },
  products: {
    title_en: "",
    description_en: "",
    price: 0,
    quantity: 0,
    category_id: "",
  },
  categories: { title_en: "", description_en: "", cate_image: "" },
  customers: { name: "", email: "", password: "", status: "" },
  orders: {
    title_en: "",
    description_en: "",
    price: "",
    quantity: 1,
    customer_id: "",
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

const CrudForm = () => {
  const navigate = useNavigate();
  const { table, id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // === Load data (Edit mode) ===
  useEffect(() => {
    if (!tableSchemas[table]) {
      console.error("Unknown table:", table);
      return;
    }

    if (isEdit) {
      setLoading(true);
      getEntityById(table, id)
        .then((res) => setFormData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setFormData(tableSchemas[table]);
    }
  }, [table, id, isEdit]);

  // === Handlers ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await updateEntity(table, id, formData);
        notifySuccess("Updated successfully ✅");
      } else {
        await createEntity(table, formData);
        notifySuccess("Created successfully ✅");
      }

      navigate("/admin/dashboard");
    } catch (err) {
      notifyError("Something went wrong ❌");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // === UI ===
  if (loading) return <p className="p-6">Loading...</p>;

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
                  {Object.keys(formData).map((key) => (
                    <div className="col-md-6 col-lg-4 mb-3" key={key}>
                      <label className="small font-weight-bold text-uppercase text-muted">
                        {key.replace(/_/g, " ")}
                      </label>

                      {key === "role" ? (
                        <select
                          name="role"
                          value={formData[key] || "user"}
                          onChange={handleChange}
                          className="form-control shadow-sm"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : key === "status" ? (
                        <select
                          name="status"
                          value={formData[key] || "active"}
                          onChange={handleChange}
                          className="form-control shadow-sm"
                        >
                          <option value="1">Active</option>
                          <option value="0">Block</option>
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
                  ))}
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
                              className={`fas fa-${
                                isEdit ? "save" : "check"
                              } mr-2`}
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
