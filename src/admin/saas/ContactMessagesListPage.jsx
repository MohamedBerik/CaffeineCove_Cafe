import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/axios";
import "./ContactMessagesListPage.css";

export default function ContactMessagesListPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/saas/contact-messages");
      const payload = res.data || {};
      const rowsData = Array.isArray(payload.data)
        ? payload.data
        : payload.data?.data || [];
      setRows(rowsData);
    } catch (err) {
      setError(err?.response?.data?.msg || t("Failed to load messages."));
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const subject = String(item.subject || "").toLowerCase();
      return name.includes(q) || email.includes(q) || subject.includes(q);
    });
  }, [rows, search]);

  const markAsRead = async (item) => {
    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);
      await api.post(`/saas/contact-messages/${item.id}/read`);
      await loadMessages();
    } catch (err) {
      setActionError(t("Failed to mark as read."));
    } finally {
      setActingId(null);
    }
  };

  const deleteMessage = async (item) => {
    const ok = window.confirm(
      t('Are you sure you want to delete message from "{{name}}"?', {
        name: item.name,
      }),
    );
    if (!ok) return;
    try {
      setActionError("");
      setActionSuccess("");
      setActingId(item.id);
      await api.delete(`/saas/contact-messages/${item.id}`);
      setActionSuccess(t("Message deleted successfully."));
      await loadMessages();
    } catch (err) {
      setActionError(t("Failed to delete message."));
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString(
      i18n.language === "ar" ? "ar-EG" : "en-US",
    );
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "320px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t("Loading...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-messages-page">
      <div className="page-header">
        <div className="header-text">
          <h1 className="page-title">{t("Contact Messages")}</h1>
          <p className="page-subtitle">
            {t("Messages received from the contact form")}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadMessages}>
            <i className="fas fa-sync-alt me-2"></i>
            {t("Refresh")}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {actionError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {actionSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionSuccess("")}
          ></button>
        </div>
      )}

      <div className="filters-card">
        <div className="filters-card-header">
          <i className="fas fa-filter me-2"></i>
          <h5 className="mb-0">{t("Filters")}</h5>
        </div>
        <div className="filters-card-body">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-search me-1"></i>
                {t("Search")}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={t("Name, email, subject...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearch("")}
              >
                <i className="fas fa-eraser me-2"></i>
                {t("Clear")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="messages-card">
        <div className="messages-card-header">
          <i className="fas fa-envelope me-2"></i>
          <h5 className="mb-0">{t("Messages List")}</h5>
          <span className="message-count">
            {filteredRows.length} {t("messages")}
          </span>
        </div>
        <div className="messages-card-body">
          {filteredRows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox empty-icon"></i>
              <p className="empty-text">{t("No messages found.")}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="messages-table">
                <thead>
                  <tr>
                    <th>{t("ID")}</th>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Subject")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item.id} className={!item.read_at ? "unread" : ""}>
                      <td data-label={t("ID")}>#{item.id}</td>
                      <td data-label={t("Name")}>{item.name}</td>
                      <td data-label={t("Email")}>
                        <a href={`mailto:${item.email}`}>{item.email}</a>
                      </td>
                      <td data-label={t("Phone")}>{item.phone || "-"}</td>
                      <td data-label={t("Subject")}>{item.subject}</td>
                      <td data-label={t("Date")}>
                        {formatDate(item.created_at)}
                      </td>
                      <td data-label={t("Status")}>
                        <span
                          className={`status-badge ${item.read_at ? "status-read" : "status-unread"}`}
                        >
                          {item.read_at ? t("Read") : t("Unread")}
                        </span>
                      </td>
                      <td data-label={t("Actions")}>
                        <div className="action-buttons">
                          {!item.read_at && (
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => markAsRead(item)}
                              disabled={actingId === item.id}
                              title={t("Mark as Read")}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteMessage(item)}
                            disabled={actingId === item.id}
                            title={t("Delete")}
                          >
                            {actingId === item.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="fas fa-trash-alt"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
