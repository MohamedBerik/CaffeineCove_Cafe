import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import useAlertsSocket from "../hooks/useAlertsSocket";
import api from "../services/axios";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const [alertsRes, countRes] = await Promise.all([
          api.get("/erp/alerts"),
          api.get("/erp/alerts/unread-count"),
        ]);
        console.log("ALERTS API:", alertsRes.data);
        console.log("🔢 COUNT:", countRes.data);

        setAlerts(alertsRes.data);
        setUnreadCount(countRes.data.count);
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user]);

  const addUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  const updateUnreadCount = () => {
    // ✅ دالة تحديث العداد من الباك إند
    const fetchCount = async () => {
      try {
        const response = await api.get("/erp/alerts/unread-count");
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error("❌ Error fetching unread count:", error);
      }
    };
    fetchCount();
  };

  const addAlert = (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
  };

  const markAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)),
    );
  };

  useAlertsSocket((newAlert) => {
    console.log("📨 Raw alert from socket:", newAlert);
    console.log("📋 Alert structure:", Object.keys(newAlert));

    addAlert(newAlert);
    addUnreadCount();
  }, user?.company_id);

  return (
    <AlertContext.Provider
      value={{
        unreadCount,
        addUnreadCount,
        clearUnreadCount,
        updateUnreadCount,
        alerts,
        setAlerts,
        addAlert,
        markAsRead,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
