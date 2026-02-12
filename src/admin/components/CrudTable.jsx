// src/pages/admin/CrudTable.jsx
import { useEffect, useState, useCallback } from "react";
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const baseUrl = ERP_TABLES.includes(table) ? "/erp" : "/admin";

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTableData = useCallback(
    async (pageNum = 1) => {
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
    },
    [table, searchTerm, baseUrl],
  );

  useEffect(() => {
    fetchTableData(page);
  }, [page, fetchTableData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchTableData(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchTableData]);

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

  const formatColumnName = (col) => {
    return col.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns = data.length ? Object.keys(data[0]) : [];

  if (loading) {
    return (
      <div className="crud-loading">
        <div className="loading-content">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Loading table data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <AdminLayout />

      <div className="crud-header">
        <div className="header-title-section">
          <h1>{formatColumnName(table)} Management</h1>
          <div className="mobile-controls">
            <button
              className="mobile-menu-btn"
              onClick={() =>
                document
                  .querySelector(".crud-controls")
                  .classList.toggle("show")
              }
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>

        <div className="crud-controls">
          <div className="search-container">
            <i className="fa-solid fa-search search-icon"></i>
            <input
              type="text"
              placeholder={`Search ${table.replace(/_/g, " ")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search table"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate(`/admin/${table}/create`)}
            >
              <i className="fa-solid fa-plus"></i>
              {!isMobile && " Add New"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/admin/dashboard`)}
            >
              <i className="fa-solid fa-dashboard"></i>
              {!isMobile && " Dashboard"}
            </button>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="no-data">
          <i className="fa-solid fa-database"></i>
          <p>No data found{searchTerm && ` for "${searchTerm}"`}</p>
          {searchTerm && (
            <button className="btn-link" onClick={() => setSearchTerm("")}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {!isMobile &&
                    columns.map((col) => (
                      <th key={col}>{formatColumnName(col)}</th>
                    ))}
                  {isMobile && (
                    <>
                      <th>Item</th>
                      <th>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="data-row">
                    {!isMobile ? (
                      <>
                        {columns.map((col) => (
                          <td key={col} className="table-cell">
                            <div
                              className="cell-content"
                              title={String(item[col] ?? "-")}
                            >
                              {String(item[col] ?? "-")}
                            </div>
                          </td>
                        ))}
                        <td className="actions-cell">
                          <div className="action-buttons-group">
                            {ERP_TABLES.includes(table) &&
                              table === "orders" && (
                                <>
                                  <button
                                    className="btn-icon btn-success"
                                    onClick={() => handleConfirm(item.id)}
                                    title="Confirm order"
                                  >
                                    <i className="fa-solid fa-check"></i>
                                  </button>
                                  <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleCancel(item.id)}
                                    title="Cancel order"
                                  >
                                    <i className="fa-solid fa-xmark"></i>
                                  </button>
                                </>
                              )}
                            {ERP_TABLES.includes(table) &&
                              table === "invoices" && (
                                <button
                                  className="btn-icon btn-primary"
                                  onClick={() => handlePayInvoice(item.id)}
                                  title="Pay invoice"
                                >
                                  <i className="fa-solid fa-credit-card"></i>
                                </button>
                              )}
                            {table === "customers" && (
                              <button
                                className="btn-icon btn-info"
                                onClick={() =>
                                  navigate(
                                    `/admin/erp/customers/${item.id}/statement`,
                                  )
                                }
                                title="View statement"
                              >
                                <i className="fa-solid fa-file-invoice"></i>
                              </button>
                            )}
                            {table === "suppliers" && (
                              <button
                                className="btn-icon btn-info"
                                onClick={() =>
                                  navigate(
                                    `/admin/erp/suppliers/${item.id}/statement`,
                                  )
                                }
                                title="View statement"
                              >
                                <i className="fa-solid fa-file-invoice"></i>
                              </button>
                            )}
                            <button
                              className="btn-icon btn-warning"
                              onClick={() =>
                                navigate(`/admin/${table}/${item.id}/edit`)
                              }
                              title="Edit"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="mobile-cell">
                          <div className="mobile-item">
                            <div className="mobile-item-id">ID: {item.id}</div>
                            <div className="mobile-item-preview">
                              {columns.slice(0, 2).map((col, idx) => (
                                <div key={col} className="preview-field">
                                  <span className="field-label">
                                    {formatColumnName(col)}:
                                  </span>
                                  <span className="field-value">
                                    {String(item[col] ?? "-")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="actions-cell mobile-actions">
                          <div className="mobile-action-buttons">
                            <button
                              className="btn-icon btn-warning"
                              onClick={() =>
                                navigate(`/admin/${table}/${item.id}/edit`)
                              }
                              title="Edit"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            {ERP_TABLES.includes(table) &&
                              table === "orders" && (
                                <button
                                  className="btn-icon btn-success"
                                  onClick={() => handleConfirm(item.id)}
                                  title="Confirm"
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                              )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <i className="fa-solid fa-chevron-left"></i>
                {!isMobile && " Previous"}
              </button>

              <div className="page-numbers">
                {(() => {
                  const pages = [];
                  const showPages = isMobile ? 3 : 5;
                  let start = Math.max(1, page - Math.floor(showPages / 2));
                  let end = Math.min(totalPages, start + showPages - 1);

                  if (end - start + 1 < showPages) {
                    start = Math.max(1, end - showPages + 1);
                  }

                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`page-btn ${page === i ? "active" : ""}`}
                        aria-label={`Page ${i}`}
                      >
                        {i}
                      </button>,
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="pagination-btn"
              >
                {!isMobile && "Next "}
                <i className="fa-solid fa-chevron-right"></i>
              </button>

              {!isMobile && (
                <div className="page-info">
                  Page {page} of {totalPages}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CrudTable;
