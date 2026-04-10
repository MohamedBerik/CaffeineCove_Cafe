import { useEffect, useState } from "react";
import api from "../../services/axios";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async (pageNumber = 1, append = false) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/erp/alerts?page=${pageNumber}&filter=${filter}`,
      );

      const newAlerts = res.data.data;

      setAlerts((prev) => (append ? [...prev, ...newAlerts] : newAlerts));

      setHasMore(res.data.meta.has_more);
    } catch (err) {
      console.error("❌ Error loading alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchAlerts(1, false);
  }, [filter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAlerts(nextPage, true);
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>

      {/* Filters */}
      <div className="filters">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("unread")}>Unread</button>
        <button onClick={() => setFilter("high")}>High</button>
      </div>

      {/* List */}
      <div className="notifications-list">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`notification-card ${alert.read ? "read" : ""}`}
            onClick={() => alertClick(alert)}
          >
            <div className="message">{alert.message}</div>
            <div className="time">{new Date(alert.time).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default NotificationsPage;
