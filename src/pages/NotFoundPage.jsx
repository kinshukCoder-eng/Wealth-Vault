import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/shared/Header";

export function NotFoundPage() {
  return (
    <div className="page-wrap" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <Header
        eyebrow="404 · Uncharted territory"
        title="Page not found"
        sub="The page or receipt you are looking for does not exist in your vault."
      />

      <div className="reveal" style={{ marginTop: "2rem" }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: "460px", margin: "0 auto 2rem" }}>
          You might have typed an unfamiliar route or followed an outdated link. Return to your money companion:
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="primary-button">
            Back to Home ↗
          </Link>
          <Link to="/dashboard" className="text-button">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
