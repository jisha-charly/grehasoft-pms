import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
}

const DeleteConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item?",
  confirmText = "Delete",
}) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <span style={{ color: "#dc3545", marginRight: "8px" }}>⚠</span>
            {title}
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <p style={{ marginBottom: "8px" }}>{message}</p>
          <small style={{ color: "#6c757d" }}>
            This action can be reversed if soft delete is enabled.
          </small>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button style={cancelBtnStyle} onClick={onClose}>
            Cancel
          </button>
          <button
            style={deleteBtnStyle}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1050,
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

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: "#f1f1f1",
  border: "none",
  padding: "6px 14px",
  borderRadius: "6px",
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  backgroundColor: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "6px 14px",
  borderRadius: "6px",
  cursor: "pointer",
};

export default DeleteConfirmModal;