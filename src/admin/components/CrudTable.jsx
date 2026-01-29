import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deleteEntity } from "../../services/adminApi";
import api from "../../services/axios";
import "./CrudTable.css";
import AdminLayout from "../layouts/AdminLayout";
import { notifyError, notifySuccess } from "../../utils/notify";

const CrudTable = () => {
  const { table } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/${table}`);

      const tableData = Array.isArray(res.data)
        ? res.data
        : (res.data.data ?? []);

      setData(tableData);
    } catch (err) {
      notifyError("Dashboard fetch error");
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [table]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await deleteEntity(table, id);
    notifySuccess("Deleted successfully");
    fetchTableData();
  };

  const handleViewDetails = (item) => {
    setSelectedRow(selectedRow?.id === item.id ? null : item);
  };

  if (loading) {
    return (
      <div className="crud-loading">
        <div className="loading-content">
          <i class="fa-solid fa-spinner"></i>
          <p>Loading table data...</p>
        </div>
      </div>
    );
  }

  const columns = data.length ? Object.keys(data[0]) : [];

  return (
    <div className="crud-container">
      <AdminLayout />
      {/* Header Section */}
      <div className="crud-header">
        <div className="header-top">
          <div className="title-section">
            <h1 className="page-title">
              {table.replace(/_/g, " ")} Management
            </h1>
            <p className="page-subtitle">
              Manage all records in the database table
            </p>
          </div>
          <button
            onClick={() => navigate(`/admin/${table}/create`)}
            className="btn btn-success"
          >
            <span>Add New Record</span>
          </button>
          <button
            onClick={() => navigate(`/admin/dashboard`)}
            className="btn btn-outline-dark"
          >
            <span>
              <i class="fa-solid fa-arrow-right"></i>
            </span>
          </button>
        </div>

        <div className="info-card">
          <div className="record-count">
            {data.length} {data.length === 1 ? "Record" : "Records"}
          </div>
          <div className="table-info">
            Table: <code>{table}</code>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <i class="fa-solid fa-table"></i>
            <h3>No Data Found</h3>
            <p>
              There are no records in this table yet. Start by adding a new one.
            </p>
            <button
              onClick={() => navigate(`/admin/${table}/create`)}
              className="create-button"
            >
              <i class="fa-solid fa-plus"></i>
              <span>Create First Record</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          {/* Responsive Container */}
          <div className="table-responsive">
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
                  <>
                    <tr key={item.id}>
                      {columns.map((col) => (
                        <td key={col} title={String(item[col] ?? "-")}>
                          {String(item[col] ?? "-")}
                        </td>
                      ))}
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="action-btn view-btn"
                            title="View Details"
                          >
                            <i class="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/${table}/${item.id}/edit`)
                            }
                            className="action-btn edit-btn"
                            title="Edit"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="action-btn delete-btn"
                            title="Delete"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {selectedRow?.id === item.id && (
                      <tr className="details-row">
                        <td colSpan={columns.length + 1}>
                          <div className="details-card">
                            <h4>
                              <i class="fa-solid fa-eye"></i>
                              <span>Record Details</span>
                            </h4>
                            <div className="details-grid">
                              {columns.map((col) => (
                                <div key={col} className="detail-item">
                                  <div className="detail-label">
                                    {col.replace(/_/g, " ")}
                                  </div>
                                  <div className="detail-value">
                                    {String(item[col] ?? "Empty")}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="details-footer">
                              <button
                                onClick={() => setSelectedRow(null)}
                                className="close-details-btn"
                              >
                                Close Details
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="table-footer">
            <div className="footer-content">
              <div className="footer-item">
                Showing <strong>{data.length}</strong> records
              </div>
              <div className="footer-item">
                Columns: <strong>{columns.length}</strong>
              </div>
              <div className="footer-item">
                Table: <code>{table}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {data.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Records</div>
            <div className="stat-value">{data.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Columns</div>
            <div className="stat-value">{columns.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Actions Available</div>
            <div className="stat-value">3</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudTable;
