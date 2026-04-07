import React, { createContext, useState, useContext } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);

  // ✅ أضف هاتين الدالتين
  const addUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  const addAlert = (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
  };

  return (
    <AlertContext.Provider
      value={{
        unreadCount,
        addUnreadCount,
        clearUnreadCount,
        alerts,
        addAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
