import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addTransaction, editTransaction } from "../../features/transactions/transactionsSlice";
import { categories } from "../../data/demoData";
import { validateTransaction } from "../../utils/validation";
import { getLocalDateString } from "../../utils/dates";
import { useUI } from "../../contexts/UIContext";

function TransactionModalForm({ editing, onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const [title, setTitle] = useState(editing?.title || "");
  const [amount, setAmount] = useState(editing?.amount != null ? String(editing.amount) : "");
  const [category, setCategory] = useState(editing?.category || categories[0]);
  const [type, setType] = useState(editing?.type || "expense");
  const [date, setDate] = useState(editing?.date || getLocalDateString());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = validateTransaction({ title, amount, category, type, date });
    setErrors(result.errors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateTransaction({ title, amount, category, type, date });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ title: true, amount: true, category: true, type: true, date: true });
      if (validation.errors.title) {
        titleInputRef.current?.focus();
      }
      return;
    }

    const payload = {
      title: title.trim(),
      amount: Math.abs(Number(amount)),
      category,
      type,
      date,
    };

    if (editing) {
      dispatch(editTransaction({ ...payload, id: editing.id }));
      showToast(`Updated "${payload.title}" in ledger`);
    } else {
      dispatch(addTransaction(payload));
      showToast(`Added "${payload.title}" to ledger`);
    }

    onClose();
  };

  return (
    <>
      <span className="eyebrow" style={{ letterSpacing: "1px" }}>
        {editing ? "Modify Entry" : "New Receipt"}
      </span>
      <h2
        id="transaction-modal-title"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "2rem",
          marginBottom: "1.5rem",
        }}
      >
        {editing ? "Edit Receipt" : "Record a Transaction"}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="tx-title">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="tx-title"
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleBlur("title")}
            placeholder="e.g. Groceries or Freelance"
            aria-required="true"
            aria-invalid={touched.title && Boolean(errors.title)}
            aria-describedby={errors.title ? "tx-title-error" : undefined}
          />
          {touched.title && errors.title && (
            <span
              id="tx-title-error"
              className="form-error"
              role="alert"
              style={{
                color: "var(--accent-primary)",
                fontSize: "0.8rem",
                marginTop: "4px",
                display: "block",
              }}
            >
              {errors.title}
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="tx-amount">
            Amount (₹) <span aria-hidden="true">*</span>
          </label>
          <input
            id="tx-amount"
            type="number"
            step="any"
            min="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => handleBlur("amount")}
            placeholder="0.00"
            aria-required="true"
            aria-invalid={touched.amount && Boolean(errors.amount)}
            aria-describedby={errors.amount ? "tx-amount-error" : undefined}
          />
          {touched.amount && errors.amount && (
            <span
              id="tx-amount-error"
              className="form-error"
              role="alert"
              style={{
                color: "var(--accent-primary)",
                fontSize: "0.8rem",
                marginTop: "4px",
                display: "block",
              }}
            >
              {errors.amount}
            </span>
          )}
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="tx-category">Category</label>
          <select
            id="tx-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="form-group">
          <label htmlFor="tx-type">Transaction Type</label>
          <select
            id="tx-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="expense">Expense (Outflow)</option>
            <option value="income">Income (Inflow)</option>
          </select>
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="tx-date">
            Date <span aria-hidden="true">*</span>
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onBlur={() => handleBlur("date")}
            aria-required="true"
            aria-invalid={touched.date && Boolean(errors.date)}
            aria-describedby={errors.date ? "tx-date-error" : undefined}
          />
          {touched.date && errors.date && (
            <span
              id="tx-date-error"
              className="form-error"
              role="alert"
              style={{
                color: "var(--accent-primary)",
                fontSize: "0.8rem",
                marginTop: "4px",
                display: "block",
              }}
            >
              {errors.date}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            {editing ? "Save Changes" : "Record Receipt"}
          </button>
        </div>
      </form>
    </>
  );
}

export function TransactionModal() {
  const { transactionModal, closeTransactionModal } = useUI();
  const { isOpen, editing } = transactionModal;

  const dialogRef = useDialogFocus(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeTransactionModal}
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
        aria-labelledby="transaction-modal-title"
      >
        <TransactionModalForm
          key={editing?.id || "new"}
          editing={editing}
          onClose={closeTransactionModal}
        />
      </div>
    </div>
  );
}

export default TransactionModal;
