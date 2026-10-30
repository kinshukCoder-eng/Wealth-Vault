import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectEnhancedGoals } from "../features/selectors";
import {
  addGoal,
  deleteGoal,
  deleteContribution,
  reorderGoal,
} from "../features/goals/goalsSlice";
import Header from "../components/shared/Header";
import { formatINR } from "../utils/currency";
import { formatDate } from "../utils/dates";
import { validateGoal } from "../utils/validation";
import { useUI } from "../contexts/UIContext";

export function GoalsPage() {
  const dispatch = useDispatch();
  const goals = useSelector(selectEnhancedGoals);
  const {
    openAddGoal,
    openEditGoal,
    openContributionModal,
    showConfirm,
    showToast,
  } = useUI();

  // Sidebar inline form
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [expandedHistoryGoalId, setExpandedHistoryGoalId] = useState(null);

  const handleInlineAddGoal = (e) => {
    e.preventDefault();
    const validation = validateGoal({ name, target, monthly });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, target: true, monthly: true });
      return;
    }

    dispatch(
      addGoal({
        name: name.trim(),
        target: Number(target),
        monthly: monthly ? Number(monthly) : 0,
        emoji: "🎯",
      })
    );

    showToast(`Added goal "${name.trim()}"`);
    setName("");
    setTarget("");
    setMonthly("");
    setErrors({});
    setTouched({});
  };

  const handleDeleteGoal = (goal) => {
    showConfirm({
      title: "Remove Goal?",
      message: `Are you sure you want to remove the goal "${goal.name}"? Recorded contributions will also be removed.`,
      confirmText: "Remove Goal",
      cancelText: "Keep Goal",
      isDestructive: true,
      onConfirm: () => {
        dispatch(deleteGoal(goal.id));
        showToast(`Removed goal "${goal.name}"`);
      },
    });
  };

  const handleDeleteContribution = (goal, contribution) => {
    showConfirm({
      title: "Remove Contribution?",
      message: `Remove contribution of ₹${Number(contribution.amount).toLocaleString("en-IN")} dated ${formatDate(contribution.date)}?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      isDestructive: true,
      onConfirm: () => {
        dispatch(
          deleteContribution({
            goalId: goal.id,
            contributionId: contribution.id,
          })
        );
        showToast(`Removed contribution`);
      },
    });
  };

  const moveGoal = (goalId, direction) => {
    const currentIndex = goals.findIndex((goal) => goal.id === goalId);
    const target = goals[currentIndex + direction];

    if (target) {
      dispatch(reorderGoal({ sourceId: goalId, targetId: target.id }));
    }
  };

  const getGoalMessage = (goal) => {
    if (goal.isExceeded) {
      return "You've reached this goal. Future you says thank you! 🎉";
    }
    if (goal.monthly > 0 && goal.estimatedMonths !== null) {
      return `At your planned saving pace of ${formatINR(goal.monthly)}/mo, you will reach this in approximately ${goal.estimatedMonths} ${goal.estimatedMonths === 1 ? "month" : "months"}.`;
    }
    return "Every saved rupee brings this a little closer. Set a monthly pace to estimate completion.";
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Improve · future you"
        title="Give your next chapter a number."
        sub="Goals turn a vague wish into a gentle monthly plan."
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={openAddGoal}
            style={{ fontSize: "0.85rem" }}
          >
            + New Goal
          </button>
        }
      />

      {/* Financial Semantics Banner */}
      <div
        className="reveal"
        style={{
          background: "var(--surface-color)",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 1.25rem",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        <i className="bi bi-info-circle-fill" style={{ color: "var(--accent-primary)", fontSize: "1.1rem" }}></i>
        <span>
          <strong>Savings Allocation Note:</strong> Goal contributions record money you designate for savings. They do not deduct from your wallet transactions ledger or reduce your current cash balance.
        </span>
      </div>

      <div className="row g-4">
        {/* Goals List */}
        <div className="col-lg-8">
          {goals.length === 0 ? (
            <div className="paper-panel reveal" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <i className="bi bi-bullseye" style={{ fontSize: "2.5rem", color: "var(--text-secondary)" }}></i>
              <h3 style={{ margin: "1rem 0 0.5rem" }}>No savings goals yet</h3>
              <p style={{ color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
                Setting a target gives your spare rupees purpose and momentum. Add your first goal using the form.
              </p>
            </div>
          ) : (
            goals.map((goal, goalIndex) => {
              const contributions = goal.contributions || [];
              const isHistoryOpen = expandedHistoryGoalId === goal.id;

              return (
                <section
                  className="goal-card reveal"
                  key={goal.id}
                  style={{ marginBottom: "1.25rem" }}
                >
                  <div className="goal-symbol">{goal.emoji || "🎯"}</div>

                  <div className="goal-copy" style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span className="eyebrow">
                          Target · {formatINR(goal.target)}
                          {goal.monthly > 0 && ` (${formatINR(goal.monthly)}/mo planned)`}
                        </span>
                        <h2>{goal.name}</h2>
                      </div>
                      {goal.isExceeded && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--accent-primary)",
                            color: "white",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "2px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          Completed
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.5rem 0" }}>
                      {getGoalMessage(goal)}
                    </p>

                    <div className="progress-line" role="progressbar" aria-valuenow={goal.progress} aria-valuemin="0" aria-valuemax="100">
                      <i style={{ width: `${goal.progress}%` }}></i>
                    </div>

                    <div className="goal-meta" style={{ marginTop: "0.5rem" }}>
                      <b>{formatINR(goal.totalSaved)} saved</b>
                      <span>
                        {goal.totalSaved >= goal.target
                          ? "100% complete"
                          : `${goal.progress}% complete (${formatINR(goal.remaining)} remaining)`}
                      </span>
                    </div>

                    {/* Contribution Actions */}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.85rem" }}
                        onClick={() => openContributionModal(goal.id, goal.name)}
                      >
                        + Record Contribution
                      </button>

                      <button
                        type="button"
                        className="text-button"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => openEditGoal(goal)}
                      >
                        <i className="bi bi-pencil" style={{ marginRight: "4px" }}></i>
                        Edit Goal
                      </button>

                      {contributions.length > 0 && (
                        <button
                          type="button"
                          className="text-button"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => setExpandedHistoryGoalId(isHistoryOpen ? null : goal.id)}
                        >
                          <i className={`bi ${isHistoryOpen ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ marginRight: "4px" }}></i>
                          {isHistoryOpen ? "Hide History" : `History (${contributions.length})`}
                        </button>
                      )}
                    </div>

                    {/* Contribution History Dropdown */}
                    {isHistoryOpen && contributions.length > 0 && (
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "0.75rem",
                          background: "var(--surface-secondary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        }}
                      >
                        <h4 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Contribution History</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {contributions.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.8rem",
                                borderBottom: "1px dashed var(--border-color)",
                                paddingBottom: "0.35rem",
                              }}
                            >
                              <div>
                                <strong>+{formatINR(c.amount)}</strong>
                                <span style={{ color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
                                  on {formatDate(c.date)}
                                </span>
                                {c.note && (
                                  <span style={{ fontStyle: "italic", color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
                                    "{c.note}"
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteContribution(goal, c)}
                                aria-label="Remove contribution"
                                title="Remove this contribution"
                                style={{ color: "var(--accent-primary)", padding: "0 0.25rem" }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="goal-actions">
                    {goals.length > 1 && (
                      <div className="goal-order-controls" aria-label={`Reorder ${goal.name}`}>
                        <button
                          type="button"
                          onClick={() => moveGoal(goal.id, -1)}
                          disabled={goalIndex === 0}
                          aria-label={`Move ${goal.name} up`}
                          title="Move up"
                        >
                          <i className="bi bi-chevron-up" aria-hidden="true"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGoal(goal.id, 1)}
                          disabled={goalIndex === goals.length - 1}
                          aria-label={`Move ${goal.name} down`}
                          title="Move down"
                        >
                          <i className="bi bi-chevron-down" aria-hidden="true"></i>
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="goal-remove"
                      onClick={() => handleDeleteGoal(goal)}
                      aria-label={`Remove goal ${goal.name}`}
                    >
                      Remove ×
                    </button>
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* Sidebar Goal Form */}
        <div className="col-lg-4">
          <section className="goal-form-box reveal">
            <span className="eyebrow">New intention</span>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
              What are you saving for?
            </h2>

            <form onSubmit={handleInlineAddGoal} noValidate>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="e.g. A new laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Goal title"
                  aria-invalid={touched.name && Boolean(errors.name)}
                />
                {touched.name && errors.name && (
                  <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <input
                  type="number"
                  min="1"
                  placeholder="Target amount (e.g. 50000)"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  aria-label="Target amount"
                  aria-invalid={touched.target && Boolean(errors.target)}
                />
                {touched.target && errors.target && (
                  <span className="form-error" style={{ color: "var(--accent-primary)", fontSize: "0.8rem" }}>
                    {errors.target}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <input
                  type="number"
                  min="0"
                  placeholder="Monthly planned (e.g. 5000)"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  aria-label="Monthly saving target"
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Add goal ↗
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default GoalsPage;
