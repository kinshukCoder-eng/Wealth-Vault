import React from "react";
import { useUI } from "../../contexts/UIContext";

export function ToastContainer() {
  const { toasts, removeToast } = useUI();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 2000,
        maxWidth: "380px",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="status"
          aria-live="polite"
          style={{
            background: "var(--dark-panel, #1c2127)",
            color: "#ffffff",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            fontSize: "0.875rem",
            borderLeft:
              toast.type === "error"
                ? "4px solid var(--accent-primary)"
                : toast.type === "info"
                ? "4px solid #3b82f6"
                : "4px solid #10b981",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "1rem",
              lineHeight: 1,
              padding: "0.2rem",
            }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
