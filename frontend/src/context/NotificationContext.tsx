import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./AuthContext";


type Notification = {
    type: "reminder" | "domain" | "expired"; // ✅ ADD THIS
  message: string;
  date: string;
  link?: string; // ✅ add this
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
  const { isAuthenticated } = useAuth();

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
  .filter((r: any) => !r.is_completed) // ✅ CORRECT FIELD
  .map((r: any) => ({
    type: "reminder",
    message:
      new Date(r.due_date) < now
        ? `⚠ Overdue: ${r.title}`
        : `Reminder: ${r.title}`,
    date: r.due_date
  }));

      // 🌐 Domain alerts
const domainAlerts = domains
  .filter((d: any) => {
    if (!d.expiry_date) return false;

    const expiry = new Date(d.expiry_date);
    const diffDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );

    return diffDays <= 7;
  })
  .map((d: any) => {
    const expiry = new Date(d.expiry_date);
    const diffDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );

    return {
      type: diffDays < 0 ? "expired" : "domain",
      message:
        diffDays < 0
          ? `❌ Domain expired: ${d.domain_name}`
          : `⚠ Domain expiring soon: ${d.domain_name}`,
      date: d.expiry_date,
      link: "/infrastructure/domains" // ✅ ADD THIS
    };
  });
const dismissedDomains = JSON.parse(
  localStorage.getItem("dismissedDomains") || "[]"
);

// ✅ filter only domain alerts
const filteredDomainAlerts = domainAlerts.filter((n: Notification) => {
  const domainName = n.message.split(": ")[1];
  return !dismissedDomains.includes(domainName);
});

// ✅ reminders untouched
setNotifications([...reminderAlerts, ...filteredDomainAlerts]);

    } catch (err) {
      console.error("Notification error", err);
    }
  };

 useEffect(() => {
  if (!isAuthenticated) return;   // ✅ STOP if not logged in

  fetchNotifications();

  const interval = setInterval(fetchNotifications, 60000);

  return () => clearInterval(interval);
}, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ notifications, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};