import React, { createContext, useState, useContext } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ أضف هاتين الدالتين
  const addUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <AlertContext.Provider
      value={{ unreadCount, addUnreadCount, clearUnreadCount }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
