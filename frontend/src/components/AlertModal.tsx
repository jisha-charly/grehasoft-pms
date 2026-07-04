import React, { useEffect, useRef } from "react";
import { AlertVariant } from "../types/alert";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant: "success" | "error" | "warning" | "info";
  buttonText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant,
  buttonText = "OK",
}) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Focus Trapping & Restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the dismiss button after a short delay for smooth transition
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }

        if (e.key === "Tab") {
          if (!containerRef.current) return;
          const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([-1])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Visual configuration based on variant
  let icon = "ℹ";
  let iconColor = "#007bff"; // Info Blue
  let defaultTitle = "Information";
  let btnColor = "#007bff";

  switch (variant) {
    case "success":
      icon = "✓";
      iconColor = "#28a745"; // Success Green
      defaultTitle = "Success";
      btnColor = "#28a745";
      break;
    case "error":
      icon = "✖";
      iconColor = "#dc3545"; // Danger Red
      defaultTitle = "Error";
      btnColor = "#dc3545";
      break;
    case "warning":
      icon = "⚠";
      iconColor = "#fd7e14"; // Warning Amber
      defaultTitle = "Warning";
      btnColor = "#fd7e14";
      break;
    case "info":
    default:
      icon = "ℹ";
      iconColor = "#007bff";
      defaultTitle = "Information";
      btnColor = "#007bff";
      break;
  }

  const finalTitle = title || defaultTitle;

  return (
    <div 
      style={overlayStyle}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-message"
    >
      <div style={modalStyle} ref={containerRef}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle} id="alert-modal-title">
            <span style={{ color: iconColor, marginRight: "8px", fontWeight: "bold" }}>{icon}</span>
            {finalTitle}
          </div>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle} id="alert-modal-message">
          <p style={{ marginBottom: "0px", wordBreak: "break-word" }}>{message}</p>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            ref={buttonRef}
            style={{
              ...buttonStyle,
              backgroundColor: btnColor,
            }}
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES (Matching DeleteConfirmModal) ================= */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  width: "420px",
  borderRadius: "14px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  overflow: "hidden",
  animation: "fadeIn 0.2s ease-in-out",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "18px 20px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
  fontSize: "16px",
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const bodyStyle: React.CSSProperties = {
  padding: "20px",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "16px 20px",
  borderTop: "1px solid #eee",
};

const closeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
};

const buttonStyle: React.CSSProperties = {
  color: "#fff",
  border: "none",
  padding: "6px 18px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};

export default AlertModal;
