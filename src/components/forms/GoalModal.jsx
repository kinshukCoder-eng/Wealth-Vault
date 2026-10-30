import useDialogFocus from '../../hooks/useDialogFocus';
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addGoal, editGoal } from "../../features/goals/goalsSlice";
import { validateGoal } from "../../utils/validation";
import { useUI } from "../../contexts/UIContext";

function GoalModalForm({ editing, onClose }) {
  const dispatch = useDispatch();
  const { showToast } = useUI();

  const [name, setName] = useState(editing?.name || "");
  const [target, setTarget] = useState(editing?.target != null ? String(editing.target) : "");
  const [monthly, setMonthly] = useState(editing?.monthly != null ? String(editing.monthly) : "");
  const [emoji, setEmoji] = useState(editing?.emoji || "🎯");
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
    const validation = validateGoal({ name, target, monthly });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, target: true, monthly: true });
      nameInputRef.current?.focus();
      return;
    }

    const payload = {
      name: name.trim(),
      target: Number(target),
      monthly: monthly ? Number(monthly) : 0,
      emoji: emoji || "🎯",
    };

    if (editing) {
      dispatch(editGoal({ ...payload, id: editing.id }));
      showToast(`Updated goal "${payload.name}"`);
    } else {
      dispatch(addGoal(payload));
      showToast(`Created new goal "${payload.name}"`);
    }

    onClose();
  };

  return (
    <>
      <span className="eyebrow">{editing ? "Modify Goal" : "New Intention"}</span>
      <h2 id="goal-modal-title" style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: "1.5rem" }}>
        {editing ? "Edit Goal" : "What are you saving for?"}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="goal-name">
            Goal Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="goal-name"
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. A new laptop or Emergency fund"
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
          <label htmlFor="goal-target">
            Target Amount (₹) <span aria-hidden="true">*</span>
          </label>
          <input
            id="goal-target"
            type="number"
            min="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="50000"
            aria-required="true"
            aria-invalid={touched.target && Boolean(errors.target)}
          />
          {touched.target && errors.target && (
            <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
              {errors.target}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="goal-monthly">
            Planned Monthly Saving (₹) <small style={{ color: "var(--text-secondary)" }}>(optional)</small>
          </label>
          <input
            id="goal-monthly"
            type="number"
            min="0"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="5000"
          />
          {touched.monthly && errors.monthly && (
            <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
              {errors.monthly}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="goal-emoji">Icon / Symbol</label>
          <select id="goal-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
            <option value="🎯">🎯 Target</option>
            <option value="📱">📱 Tech & Gadgets</option>
            <option value="💻">💻 Laptop / Work</option>
            <option value="✈️">✈️ Travel / Trip</option>
            <option value="🚗">🚗 Vehicle</option>
            <option value="🏠">🏠 Home / Room</option>
            <option value="🎓">🎓 Education</option>
            <option value="🛡️">🛡️ Safety / Emergency</option>
          </select>
        </div>

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            {editing ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </form>
    </>
  );
}

export function GoalModal() {
  const { goalModal, closeGoalModal } = useUI();
  const { isOpen, editing } = goalModal;

  const dialogRef = useDialogFocus(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeGoalModal}
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
        aria-labelledby="goal-modal-title"
      >
        <GoalModalForm
          key={editing?.id || "new"}
          editing={editing}
          onClose={closeGoalModal}
        />
      </div>
    </div>
  );
}

export default GoalModal;
