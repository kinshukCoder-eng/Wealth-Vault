import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectFinancialStats,
  selectReportingPeriod,
  selectTransactions,
} from "../features/selectors";
import Header from "../components/shared/Header";
import MoneyPulse from "../components/shared/MoneyPulse";
import PeriodSelector from "../components/shared/PeriodSelector";
import { formatINR } from "../utils/currency";
import { formatHeaderDate, formatDate, formatPeriodLabel } from "../utils/dates";

export function DashboardPage() {
  const navigate = useNavigate();
  const stats = useSelector(selectFinancialStats);
  const reportingPeriod = useSelector(selectReportingPeriod);
  const allTransactions = useSelector(selectTransactions);

  // Recent 4 expenses sorted by actual date descending
  const recentExpenses = [...allTransactions]
    .filter((t) => t.type === "expense")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 4);

  // Categories max amount for bar chart scaling
  const maxCategoryAmount = Math.max(
    ...stats.categoryBreakdown.map((c) => c.amount),
    1
  );

  return (
    <div className="page-wrap">
      <Header
        eyebrow={formatHeaderDate()}
        title="Welcome back."
        sub={`Here’s what your wallet is doing for ${formatPeriodLabel(reportingPeriod)}.`}
        actions={<PeriodSelector />}
      />

      <div className="stats-grid reveal">
        <div className="stat-block">
          <span>Current balance</span>
          <strong style={{ color: stats.balance < 0 ? "var(--accent-primary)" : "inherit" }}>
            {formatINR(stats.balance)}
          </strong>
        </div>
        <div className="stat-block">
          <span>{formatPeriodLabel(reportingPeriod)} income</span>
          <strong>{formatINR(stats.income)}</strong>
        </div>
        <div className="stat-block">
          <span>{formatPeriodLabel(reportingPeriod)} spending</span>
          <strong>{formatINR(stats.spending)}</strong>
        </div>
        <div className="stat-block">
          <span>
            {stats.remaining < 0 ? "Budget overrun" : "Budget remaining"}
          </span>
          <strong style={{ color: stats.remaining < 0 ? "var(--accent-primary)" : "inherit" }}>
            {formatINR(stats.remaining)}
          </strong>
        </div>
      </div>

      <MoneyPulse stats={stats} periodKey={reportingPeriod} />

      <div className="row g-4 mt-1">
        {/* Category Breakdown Bar Chart */}
        <div className="col-lg-8">
          <section className="paper-panel reveal">
            <div className="panel-head">
              <span className="eyebrow">Spending pulse</span>
              <h2>{formatPeriodLabel(reportingPeriod)}, by category</h2>
              <span
                className="eyebrow"
                style={{
                  color: "var(--accent-primary)",
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                {stats.categoryBreakdown.length > 0
                  ? `${stats.categoryBreakdown.length} active spending categories`
                  : "No category spending recorded"}
              </span>
            </div>

            <div className="bar-chart">
              {stats.categoryBreakdown.length > 0 ? (
                stats.categoryBreakdown.map(({ name, amount, percentage }) => (
                  <div key={name} className="bar-row">
                    <span style={{ minWidth: "110px" }}>{name}</span>
                    <div style={{ flex: 1, margin: "0 1rem" }}>
                      <i
                        style={{
                          width: `${Math.min(100, (amount / maxCategoryAmount) * 100)}%`,
                        }}
                      ></i>
                    </div>
                    <b>{formatINR(amount)}</b>
                    <small style={{ color: "var(--text-secondary)", marginLeft: "0.5rem", width: "40px", textAlign: "right" }}>
                      {percentage}%
                    </small>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-secondary)", padding: "1.5rem 0", textAlign: "center" }}>
                  No expenses recorded in this period. Add transactions to see category distribution.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Wallet Weather Panel */}
        <div className="col-lg-4">
          <section className="weather-panel reveal">
            <span className="eyebrow">Wallet weather</span>
            <div className="weather-icon" role="img" aria-label={stats.weatherLabel}>
              {stats.weatherIcon}
            </div>
            <h2>{stats.weatherLabel}</h2>
            <p>{stats.weatherDescription}</p>
            <button
              type="button"
              className="text-button"
              style={{ color: "#1a232c" }}
              onClick={() => navigate("/insights")}
            >
              Read the forecast ↗
            </button>
          </section>
        </div>
      </div>

      {/* Recent Receipts Panel */}
      <section className="paper-panel reveal recent-panel mt-4">
        <div
          className="panel-head"
          style={{
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "1rem",
            marginBottom: "0",
          }}
        >
          <h2 style={{ fontSize: "1.5rem" }}>Recent receipts</h2>
          <button
            type="button"
            className="text-button"
            style={{ fontSize: "0.8rem" }}
            onClick={() => navigate("/transactions")}
          >
            View ledger →
          </button>
        </div>

        <div className="recent-receipts-list">
          {recentExpenses.length > 0 ? (
            recentExpenses.map((t) => (
              <div key={t.id} className="receipt-row">
                <span className="category-icon">
                  <i className="bi bi-bag"></i>
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {t.category} · {formatDate(t.date)}
                  </small>
                </div>
                <b>−{formatINR(t.amount)}</b>
              </div>
            ))
          ) : (
            <div style={{ padding: "1.5rem 0", color: "var(--text-secondary)", textAlign: "center" }}>
              No recent receipts recorded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
