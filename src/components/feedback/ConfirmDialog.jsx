import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useEffect, useRef } from "react";
import { useUI } from "../../contexts/UIContext";

export function ConfirmDialog() {
  const { confirmDialog, closeConfirm } = useUI();
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    isDestructive,
  } = confirmDialog;

  const dialogRef = useDialogFocus(isOpen);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          closeConfirm();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, closeConfirm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
    closeConfirm();
  };

  return (
    <div
      className="modal-overlay"
      onClick={closeConfirm}
      role="presentation"
      style={{ zIndex: 1200 }}
    >
      <div
        className="modal-content"
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px" }}
      >
        <span className="eyebrow" style={{ color: isDestructive ? "var(--accent-primary)" : "inherit" }}>
          {isDestructive ? "Action Required" : "Confirm"}
        </span>
        <h2 id="confirm-dialog-title" style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "0.5rem 0 1rem" }}>
          {title}
        </h2>
        <p id="confirm-dialog-desc" style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: "1.5" }}>
          {message}
        </p>

        <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button
            type="button"
            ref={cancelBtnRef}
            className="text-button"
            onClick={closeConfirm}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="primary-button"
            style={{
              backgroundColor: isDestructive ? "var(--accent-primary)" : undefined,
              borderColor: isDestructive ? "var(--accent-primary)" : undefined,
            }}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
