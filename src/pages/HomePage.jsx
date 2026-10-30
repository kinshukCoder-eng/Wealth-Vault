import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectFinancialStats, selectReportingPeriod } from "../features/selectors";
import MoneyPulse from "../components/shared/MoneyPulse";
import { formatINR } from "../utils/currency";
import { formatPeriodLabel } from "../utils/dates";

export function HomePage() {
  const navigate = useNavigate();
  const stats = useSelector(selectFinancialStats);
  const reportingPeriod = useSelector(selectReportingPeriod);

  return (
    <>
      <section className="hero">
        <div className="hero-copy reveal">
          <span className="eyebrow">A little clarity. A wealth of possibility.</span>
          <h1>
            Your money.<br />
            <em>A finer future.</em>
          </h1>
          <p>
            See the bigger picture. Master the little decisions.
            A considered approach to your everyday wealth.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/dashboard")}
            >
              Start tracking ↗
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/insights")}
            >
              Discover your insights ↗
            </button>
          </div>
        </div>

        <div className="hero-visual reveal">
          <div className="vault-orbit" aria-hidden="true" />
          <div className="receipt-card-home">
            <div className="receipt-top">
              <span>WEALTH VAULT</span>
              <i className="bi bi-shield-lock" aria-hidden="true"></i>
            </div>
            <div className="receipt-balance">
              {formatINR(stats.balance)}
              <small>current balance</small>
            </div>
            <div className="vault-card-art" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>
            <div className="receipt-line">
              <span>{formatPeriodLabel(reportingPeriod).toUpperCase()}</span>
              <b>{formatINR(stats.spending)} spent</b>
            </div>
          </div>
          <div className="vault-caption"><span>01 / YOUR PERSONAL VAULT</span><span>PRIVATE BY DESIGN</span></div>
        </div>
      </section>

      <div className="home-steps reveal">
        <div className="home-step">
          <span>01</span>
          <h3>Track</h3>
          <p>See every rupee without the guilt.</p>
        </div>
        <div className="home-step">
          <span>02</span>
          <h3>Understand</h3>
          <p>Find patterns hiding in plain sight.</p>
        </div>
        <div className="home-step">
          <span>03</span>
          <h3>Improve</h3>
          <p>Make one better decision at a time.</p>
        </div>
      </div>

      <div className="home-bottom reveal">
        <div>
          <span className="eyebrow" style={{ letterSpacing: "2px" }}>
            A calmer way to budget
          </span>
          <h2 style={{ fontSize: "3rem", lineHeight: "1.1" }}>
            Clarity feels better
            <br />
            <em>than control.</em>
          </h2>
        </div>
        <MoneyPulse stats={stats} periodKey={reportingPeriod} />
      </div>
    </>
  );
}

export default HomePage;
