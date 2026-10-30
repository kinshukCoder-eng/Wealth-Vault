import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addContribution } from "../../features/goals/goalsSlice";
import { validateContribution } from "../../utils/validation";
import { getLocalDateString } from "../../utils/dates";
import { useUI } from "../../contexts/UIContext";

function ContributionModalForm({ goalId, goalName, onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const amountInputRef = useRef(null);

  useEffect(() => {
    amountInputRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateContribution({ amount, date });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ amount: true, date: true });
      amountInputRef.current?.focus();
      return;
    }

    dispatch(
      addContribution({
        goalId,
        amount: Number(amount),
        date,
        note: note.trim(),
      })
    );

    showToast(`Added ₹${Number(amount).toLocaleString("en-IN")} towards "${goalName}"`);
    onClose();
  };

  return (
    <>
      <span className="eyebrow">Record Progress</span>
      <h2 id="contrib-modal-title" style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Add to {goalName}
      </h2>

      {/* Financial Semantics Notice */}
      <div
        style={{
          background: "var(--surface-secondary)",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 1rem",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          lineHeight: "1.4",
        }}
      >
        <i className="bi bi-info-circle" style={{ marginRight: "6px", color: "var(--accent-primary)" }}></i>
        <strong>Savings Allocation:</strong> This tracks progress toward your goal. It does not deduct from your wallet ledger or record an expense.
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="contrib-amount">
            Contribution Amount (₹) <span aria-hidden="true">*</span>
          </label>
          <input
            id="contrib-amount"
            ref={amountInputRef}
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2000"
            aria-required="true"
            aria-invalid={touched.amount && Boolean(errors.amount)}
          />
          {touched.amount && errors.amount && (
            <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
              {errors.amount}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="contrib-date">
            Date <span aria-hidden="true">*</span>
          </label>
          <input
            id="contrib-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contrib-note">Note / Source (optional)</label>
          <input
            id="contrib-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. March stipend or Birthday gift"
          />
        </div>

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save Contribution
          </button>
        </div>
      </form>
    </>
  );
}

export function ContributionModal() {
  const { contributionModal, closeContributionModal } = useUI();
  const { isOpen, goalId, goalName } = contributionModal;

  const dialogRef = useDialogFocus(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeContributionModal}
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
        aria-labelledby="contrib-modal-title"
      >
        <ContributionModalForm
          key={goalId || "new"}
          goalId={goalId}
          goalName={goalName}
          onClose={closeContributionModal}
        />
      </div>
    </div>
  );
}

export default ContributionModal;
