import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addVaultItem, editVaultItem } from "../../features/vault/vaultSlice";
import { validateVaultItem } from "../../utils/validation";
import { useUI } from "../../contexts/UIContext";

function VaultModalForm({ editing, onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const [name, setName] = useState(editing?.name || "");
  const [amount, setAmount] = useState(editing?.amount != null ? String(editing.amount) : "");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateVaultItem({ name, amount });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, amount: true });
      nameInputRef.current?.focus();
      return;
    }

    const payload = {
      name: name.trim(),
      amount: Number(amount),
    };

    if (editing) {
      dispatch(editVaultItem({ ...payload, id: editing.id }));
      showToast(`Updated "${payload.name}" in Want Vault`);
    } else {
      dispatch(addVaultItem(payload));
      showToast(`Saved "${payload.name}" to Want Vault`);
    }

    onClose();
  };

  return (
    <>
      <span className="eyebrow">{editing ? "Modify Want" : "Cooling Off"}</span>
      <h2 id="vault-modal-title" style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1.5rem" }}>
        {editing ? "Edit Saved Want" : "Put it in the Vault"}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="vault-name">
            Item Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="vault-name"
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wireless noise-cancelling headphones"
            aria-required="true"
            aria-invalid={touched.name && Boolean(errors.name)}
          />
          {touched.name && errors.name && (
            <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="vault-amount">
            Price (₹) <span aria-hidden="true">*</span>
          </label>
          <input
            id="vault-amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="2500"
            aria-required="true"
            aria-invalid={touched.amount && Boolean(errors.amount)}
          />
          {touched.amount && errors.amount && (
            <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
              {errors.amount}
            </span>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            {editing ? "Save Changes" : "Save to Vault"}
          </button>
        </div>
      </form>
    </>
  );
}

export function VaultModal() {
  const { vaultModal, closeVaultModal } = useUI();
  const { isOpen, editing } = vaultModal;

  const dialogRef = useDialogFocus(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeVaultModal}
      role="presentation"
      style={{ zIndex: 1100 }}
    >
      <div
        className="modal-content"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-modal-title"
      >
        <VaultModalForm
          key={editing?.id || "new"}
          editing={editing}
          onClose={closeVaultModal}
        />
      </div>
    </div>
  );
}

export default VaultModal;
