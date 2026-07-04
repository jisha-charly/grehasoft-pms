import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { AlertOptions, QueuedAlert } from "../types/alert";
import AlertModal from "../components/AlertModal";
import { registerAlertService } from "../services/alertService";

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<void>;
}

export const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<QueuedAlert | null>(null);
  
  // Track alert history hashes within 1500ms to deduplicate
  const alertHistory = useRef<{ [hash: string]: number }>({});

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Deduplication check
      const hash = `${options.variant}-${options.title || ""}-${options.message}`;
      const now = Date.now();
      const lastTriggered = alertHistory.current[hash] || 0;
      
      if (now - lastTriggered < 1500) {
        // Discard duplicate alert within 1500ms window
        resolve();
        return;
      }
      
      // Update throttle timestamp
      alertHistory.current[hash] = now;

      // Limit queue to 10 entries
      setQueue((prev) => {
        if (prev.length >= 10) {
          console.warn("Alert queue size limit reached (10). Discarding new alert request to prevent memory bloat.");
          resolve();
          return prev;
        }
        
        const newQueued: QueuedAlert = { options, resolve };
        return [...prev, newQueued];
      });
    });
  }, []);

  // Register service callback
  useEffect(() => {
    registerAlertService(showAlert);
  }, [showAlert]);

  // Process alert queue
  useEffect(() => {
    if (!activeAlert && queue.length > 0) {
      const nextAlert = queue[0];
      setActiveAlert(nextAlert);
      setQueue((prev) => prev.slice(1));
    }
  }, [activeAlert, queue]);

  const handleClose = () => {
    if (activeAlert) {
      activeAlert.resolve();
      setActiveAlert(null);
    }
  };

  // Provider unmount cleanup
  useEffect(() => {
    return () => {
      // Resolve all pending alerts in queue if unmounting
      queue.forEach((alert) => alert.resolve());
      if (activeAlert) {
        activeAlert.resolve();
      }
    };
  }, [queue, activeAlert]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {activeAlert && (
        <AlertModal
          isOpen={!!activeAlert}
          onClose={handleClose}
          variant={activeAlert.options.variant}
          title={activeAlert.options.title}
          message={activeAlert.options.message}
          buttonText={activeAlert.options.buttonText}
        />
      )}
    </AlertContext.Provider>
  );
};
export default AlertContext;
