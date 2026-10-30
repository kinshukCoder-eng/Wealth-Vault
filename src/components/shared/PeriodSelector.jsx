import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectReportingPeriod,
  selectAvailablePeriods,
} from "../../features/selectors";
import { setReportingPeriod } from "../../features/budget/budgetSlice";
import { formatPeriodLabel } from "../../utils/dates";
import { useUI } from "../../contexts/UIContext";

export function PeriodSelector() {
  const dispatch = useDispatch();
  const currentPeriod = useSelector(selectReportingPeriod);
  const periods = useSelector(selectAvailablePeriods);
  const { openBudgetModal } = useUI();

  return (
    <div className="period-selector-wrap" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <label htmlFor="reporting-period-select" className="eyebrow" style={{ margin: 0 }}>
        Period:
      </label>
      <select
        id="reporting-period-select"
        value={currentPeriod}
        onChange={(e) => dispatch(setReportingPeriod(e.target.value))}
        className="period-select"
        style={{
          padding: "0.35rem 0.75rem",
          borderRadius: "var(--radius-sm, 4px)",
          border: "1px solid var(--border-color)",
          background: "var(--surface-color)",
          color: "var(--text-primary)",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
        aria-label="Select reporting month or period"
      >
        <option value="all">All Time</option>
        {periods.map((p) => (
          <option key={p} value={p}>
            {formatPeriodLabel(p)}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="text-button"
        style={{ fontSize: "0.8rem", textDecoration: "underline", padding: "0.25rem 0.5rem" }}
        onClick={openBudgetModal}
        aria-label="Configure budget settings"
        title="Adjust monthly budget"
      >
        <i className="bi bi-gear" style={{ marginRight: "4px" }}></i>
        Budget Settings
      </button>
    </div>
  );
}

export default PeriodSelector;
