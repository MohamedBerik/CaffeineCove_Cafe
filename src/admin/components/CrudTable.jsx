// src/pages/admin/CrudTable.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { notifyError, notifySuccess } from "../../utils/notify";
import AdminLayout from "../layouts/AdminLayout";
import "./CrudTable.css";

const ERP_TABLES = ["orders", "invoices", "purchase-orders"];

const CrudTable = () => {
  const { table } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const baseUrl = ERP_TABLES.includes(table) ? "/erp" : "/admin";

  const fetchTableData = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`${baseUrl}/${table}`, {
        params: {
          page: pageNum,
          per_page: 10,
          search: searchTerm,
        },
      });

      setData(res.data.data ?? res.data);
      setTotalPages(res.data.last_page ?? 1);
    } catch (err) {
      notifyError("Failed to fetch table data");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(page);
  }, [table, page, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.post(`${baseUrl}/${table}/${id}/delete`);
      notifySuccess("Deleted successfully");
      fetchTableData(page);
    } catch (err) {
      notifyError("Delete failed");
      console.error(err);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.post(`${baseUrl}/orders/${id}/confirm`);
      notifySuccess("Order confirmed & email sent");
      fetchTableData(page);
    } catch (err) {
      notifyError("Failed to confirm order");
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`${baseUrl}/orders/${id}/cancel`);
      notifySuccess("Order cancelled");
      fetchTableData(page);
    } catch (err) {
      notifyError("Failed to cancel order");
      console.error(err);
    }
  };

  const handlePayInvoice = async (id) => {
    const amount = prompt("Enter payment amount:");
    if (!amount) return;
    try {
      await api.post(`${baseUrl}/invoices/${id}/pay`, {
        amount: parseFloat(amount),
      });
      notifySuccess("Payment recorded");
      fetchTableData(page);
    } catch (err) {
      notifyError("Failed to process payment");
      console.error(err);
    }
  };

  const columns = data.length ? Object.keys(data[0]) : [];

  if (loading)
    return (
      <div className="crud-loading">
        <div className="loading-content">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Loading table data...</p>
        </div>
      </div>
    );

  return (
    <div className="crud-container">
      <AdminLayout />

      <div className="crud-header">
        <h1>{table.replace(/_/g, " ")} Management</h1>
        <input
          type="text"
          placeholder={`Search ${table}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div>
          <button onClick={() => navigate(`/admin/${table}/create`)}>
            Add New
          </button>
          <button onClick={() => navigate(`/admin/dashboard`)}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, " ")}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                {columns.map((col) => (
                  <td key={col} title={String(item[col] ?? "-")}>
                    {String(item[col] ?? "-")}
                  </td>
                ))}
                <td className="actions-cell">
                  {ERP_TABLES.includes(table) && table === "orders" && (
                    <>
                      <button onClick={() => handleConfirm(item.id)}>✔</button>
                      <button onClick={() => handleCancel(item.id)}>✖</button>
                    </>
                  )}
                  {ERP_TABLES.includes(table) && table === "invoices" && (
                    <button onClick={() => handlePayInvoice(item.id)}>
                      Pay
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/${table}/${item.id}/edit`)}
                  >
                    ✎
                  </button>
                  <button onClick={() => handleDelete(item.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrudTable;
