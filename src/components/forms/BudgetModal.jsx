import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectBudget,
  selectReportingPeriod,
  selectFinancialStats,
} from "../../features/selectors";
import {
  setBudgetMode,
  setManualBudget,
} from "../../features/budget/budgetSlice";
import { formatPeriodLabel } from "../../utils/dates";
import { validateBudget } from "../../utils/validation";
import { useUI } from "../../contexts/UIContext";

function BudgetModalForm({ onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const budgetConfig = useSelector(selectBudget);
  const reportingPeriod = useSelector(selectReportingPeriod);
  const stats = useSelector(selectFinancialStats);

  const initialManual =
    budgetConfig.manualAmounts?.[reportingPeriod] ??
    budgetConfig.defaultManual ??
    15000;

  const [mode, setMode] = useState(budgetConfig.mode || "auto");
  const [manualAmount, setManualAmount] = useState(String(initialManual));
  const [errors, setErrors] = useState({});

  const amountInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateBudget({ mode, amount: manualAmount });
    if (!validation.isValid) {
      setErrors(validation.errors);
      amountInputRef.current?.focus();
      return;
    }

    if (mode === "auto") {
      dispatch(setBudgetMode("auto"));
      showToast(`Set budget to Automatic (80% of income: ₹${stats.budget.toLocaleString("en-IN")})`);
    } else {
      const num = Math.max(0, Number(manualAmount) || 0);
      dispatch(setManualBudget({ periodKey: reportingPeriod, amount: num }));
      showToast(`Manual budget set to ₹${num.toLocaleString("en-IN")} for ${formatPeriodLabel(reportingPeriod)}`);
    }

    onClose();
  };

  return (
    <>
      <span className="eyebrow">Pacing & Planning</span>
      <h2 id="budget-modal-title" style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1rem" }}>
        Monthly Budget
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Configuring budget for <strong>{formatPeriodLabel(reportingPeriod)}</strong>.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Budget Calculation Mode</label>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "normal" }}>
              <input
                type="radio"
                name="budgetMode"
                value="auto"
                checked={mode === "auto"}
                onChange={() => setMode("auto")}
              />
              <span>Automatic (80% of Income)</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "normal" }}>
              <input
                type="radio"
                name="budgetMode"
                value="manual"
                checked={mode === "manual"}
                onChange={() => setMode("manual")}
              />
              <span>Manual Fixed Amount</span>
            </label>
          </div>
        </div>

        {mode === "auto" ? (
          <div
            style={{
              background: "var(--surface-secondary)",
              padding: "1rem",
              borderRadius: "4px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Calculated dynamically from period income:
            </div>
            <div style={{ fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: 700, marginTop: "0.25rem" }}>
              ₹{stats.budget.toLocaleString("en-IN")}
            </div>
            <small style={{ color: "var(--text-secondary)" }}>
              Based on ₹{stats.income.toLocaleString("en-IN")} total income in {formatPeriodLabel(reportingPeriod)}.
            </small>
          </div>
        ) : (
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="manual-budget-input">
              Target Budget Amount (₹) <span aria-hidden="true">*</span>
            </label>
            <input
              id="manual-budget-input"
              ref={amountInputRef}
              type="number"
              min="0"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="e.g. 15000"
              aria-required="true"
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && (
              <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem", display: "block", marginTop: "4px" }}>
                {errors.amount}
              </span>
            )}
            <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "4px" }}>
              Set to 0 if you want to track spending without a spending ceiling.
            </small>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save Budget
          </button>
        </div>
      </form>
    </>
  );
}

export function BudgetModal() {
  const { budgetModal, closeBudgetModal } = useUI();
  const { isOpen } = budgetModal;

  const dialogRef = useDialogFocus(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeBudgetModal}
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
        aria-labelledby="budget-modal-title"
      >
        <BudgetModalForm onClose={closeBudgetModal} />
      </div>
    </div>
  );
}

export default BudgetModal;
