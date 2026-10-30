import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectFinancialStats,
  selectInsights,
  selectReportingPeriod,
} from "../features/selectors";
import Header from "../components/shared/Header";
import PeriodSelector from "../components/shared/PeriodSelector";
import { formatINR } from "../utils/currency";
import { formatPeriodLabel } from "../utils/dates";

export function InsightsPage() {
  const navigate = useNavigate();
  const stats = useSelector(selectFinancialStats);
  const insights = useSelector(selectInsights);
  const reportingPeriod = useSelector(selectReportingPeriod);

  const { topCategory, smallPurchases, weekendComparison, budgetInsight } = insights;
  const periodLabel = formatPeriodLabel(reportingPeriod);
  const openReceipts = (filters = {}) => {
    const params = new URLSearchParams(filters);
    if (reportingPeriod !== 'all') params.set('month', reportingPeriod);
    navigate(`/transactions${params.size ? `?${params}` : ''}`);
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Understand · patterns, not guilt"
        title="The story behind your spending."
        sub={`A few signals worth noticing in ${periodLabel}.`}
        actions={<PeriodSelector />}
      />

      {/* Primary Insight: Money Detective */}
      <div className="insight-lead reveal">
        <span className="insight-number">01</span>
        <div>
          <span className="eyebrow">Money Detective · {periodLabel}</span>
          <h2>You spent {formatINR(stats.spending)} this period.</h2>
          <p>
            {topCategory ? (
              <>
                <strong>{topCategory.name}</strong> is your biggest category at{" "}
                <strong>{formatINR(topCategory.amount)}</strong> ({topCategory.percentage}% of spending). That’s
                the clearest place to observe and experiment gently.
              </>
            ) : (
              "No expenses recorded yet for this period."
            )}
          </p>
        </div>
        {topCategory && (
          <button
            type="button"
            className="annotation"
            style={{ cursor: "pointer", background: "none", border: "none" }}
            onClick={() => openReceipts({ category: topCategory.name })}
          >
            filter {topCategory.name} receipts →
          </button>
        )}
      </div>

      <div className="insights-row reveal">
        {/* Signal 1: Money Leaks / Small Purchases */}
        <div className="insight-card">
          <div className="insight-icon">
            <i className="bi bi-droplet"></i>
          </div>
          <span className="eyebrow">Signal detected</span>
          <h2>Micro Purchases</h2>
          {smallPurchases.count > 0 ? (
            <>
              <p>
                Receipts of ₹{smallPurchases.threshold} or less quietly added up to{" "}
                <strong>{formatINR(smallPurchases.total)}</strong> across {smallPurchases.count} transactions (
                {smallPurchases.percentage}% of period spending).
              </p>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: "0.75rem", padding: 0 }}
                onClick={() => openReceipts({ sort: 'lowest' })}
              >
                Inspect smallest receipts ↗
              </button>
            </>
          ) : (
            <p>
              No micro-purchases under ₹{smallPurchases.threshold} detected in this period.
            </p>
          )}
        </div>

        {/* Signal 2: Weekend vs Weekday Pace */}
        <div className="insight-card">
          <div className="insight-icon">
            <i className="bi bi-radar"></i>
          </div>
          <span className="eyebrow">Signal detected</span>
          <h2>Weekend vs Weekday Pacing</h2>
          {weekendComparison ? (
            <>
              <p>
                Average daily spending on weekends was{" "}
                <strong>{formatINR(weekendComparison.avgWeekend)}/day</strong> compared to{" "}
                <strong>{formatINR(weekendComparison.avgWeekday)}/day</strong> on weekdays
                {weekendComparison.ratio && ` (${weekendComparison.ratio}× ratio)`}.
              </p>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: "0.75rem", padding: 0 }}
                onClick={() => openReceipts()}
              >
                See all receipts ↗
              </button>
            </>
          ) : (
            <p>
              Insufficient transaction distribution across both weekdays and weekends in this period to form a pacing comparison.
            </p>
          )}
        </div>
      </div>

      {/* Month Predictor */}
      <div className="month-predictor reveal">
        <div className="predictor-head">
          <div>
            <span className="eyebrow">Period predictor · {periodLabel}</span>
            <h3>Where the period is headed</h3>
          </div>
          <span className="forecast-chip">
            Forecast · {formatINR(stats.projected)}
          </span>
        </div>
        <div className="predict-cols">
          <div className="predict-col">
            <small>Actual spent</small>
            <strong>{formatINR(stats.spending)}</strong>
          </div>
          <div style={{ fontSize: "1.5rem", color: "var(--text-secondary)" }}>→</div>
          <div className="predict-col">
            <small>Projected end</small>
            <strong style={{ color: "var(--accent-primary)" }}>
              {formatINR(stats.projected)}
            </strong>
          </div>
          <div className="predict-col">
            <small>Budget ceiling</small>
            <strong>
              {stats.budget > 0 ? formatINR(stats.budget) : "No budget set"}
            </strong>
          </div>
        </div>

        {budgetInsight && (
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {budgetInsight.status === "within"
              ? `Projection indicates finishing ${formatINR(budgetInsight.amount)} comfortably within your budget ceiling.`
              : `Projection indicates potential overrun by ${formatINR(budgetInsight.amount)} beyond your budget.`}
          </p>
        )}
      </div>
    </div>
  );
}

export default InsightsPage;
