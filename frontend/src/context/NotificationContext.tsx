import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

type Notification = {
  type: "reminder" | "domain";
  message: string;
  date: string;
};

type NotificationContextType = {
  notifications: Notification[];
  refreshNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within provider");
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      const [remindersRes, domainsRes] = await Promise.all([
        axiosInstance.get("/reminders/"),
        axiosInstance.get("/infrastructure/domains/")
      ]);

      const reminders = remindersRes.data.results || remindersRes.data || [];
      const domains = domainsRes.data.results || domainsRes.data || [];

      const now = new Date();

      // 🔔 Reminder alerts
      const reminderAlerts = reminders
        .filter((r: any) => r.status !== "completed")
        .map((r: any) => ({
          type: "reminder",
          message: `Reminder: ${r.title}`,
          date: r.reminder_date
        }));

      // 🌐 Domain alerts
      const domainAlerts = domains
        .filter((d: any) => {
          if (!d.expiry_date) return false;
          const days =
            (new Date(d.expiry_date).getTime() - now.getTime()) /
            (1000 * 3600 * 24);
          return days <= 7 && days >= 0;
        })
        .map((d: any) => ({
          type: "domain",
          message: `Domain expiring: ${d.domain_name}`,
          date: d.expiry_date
        }));

      setNotifications([...reminderAlerts, ...domainAlerts]);

    } catch (err) {
      console.error("Notification error", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000); // auto refresh

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};