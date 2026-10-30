import { formatBudgetPercent } from '../../utils/currency';
import React from "react";
import { formatPeriodLabel } from "../../utils/dates";

export function MoneyPulse({ stats, periodKey = "all" }) {
  const score = stats?.score ?? 100;
  const isBudgetSet = stats?.budget > 0;
  const periodLabel = formatPeriodLabel(periodKey);
  const budgetLabel = periodKey === "all" ? "all-time budget" : "monthly budget";

  let message = "Your wallet is finding its rhythm.";
  let detailBadge = "Balanced";
  let detailNote = "pacing cleanly";

  if (isBudgetSet) {
    if (stats.spending <= stats.budget) {
      const underPercent = Math.round(((stats.budget - stats.spending) / stats.budget) * 100);
      message = stats.spending === stats.budget ? `You have used your full ${budgetLabel}.` : `You are ${underPercent}% under your planned ${budgetLabel}.`;
      detailBadge = `${underPercent}% remaining`;
      detailNote = "within target";
    } else {
      const overPercent = formatBudgetPercent(((stats.spending - stats.budget) / stats.budget) * 100);
      message = `You are ${overPercent} over your planned ${budgetLabel}.`;
      detailBadge = `${overPercent} overrun`;
      detailNote = "review expenses";
    }
  } else if (stats?.spending > 0) {
    message = `Tracking ₹${Number(stats.spending).toLocaleString("en-IN")} spent across this period.`;
    detailBadge = "Active";
    detailNote = "no budget set";
  } else {
    message = "No transactions recorded yet for this period.";
    detailBadge = "Pristine";
    detailNote = "ready to start";
  }

  return (
    <section className="pulse-panel reveal" aria-label="MoneyPulse budget pacing status">
      <div>
        <span className="eyebrow">Financial forecast · {periodLabel}</span>
        <h2>
          MoneyPulse <span className="pulse-dot"></span>
        </h2>
        <p>{message}</p>
        <div className="pulse-detail">
          <b>{detailBadge}</b>
          <span>{detailNote} · budget pacing gauge</span>
        </div>
      </div>
      <div
        className="score-ring"
        style={{ "--score": `${Math.max(0, Math.min(100, score)) * 3.6}deg` }}
        role="img"
        aria-label={`MoneyPulse score: ${score} out of 100`}
      >
        <div>
          <strong>{score}</strong>
          <span>/ 100</span>
        </div>
      </div>
    </section>
  );
}

export default MoneyPulse;
