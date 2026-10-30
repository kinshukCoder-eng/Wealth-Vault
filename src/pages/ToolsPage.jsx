import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectFinancialStats } from "../features/selectors";
import { addVaultItem } from "../features/vault/vaultSlice";
import { validateVaultItem } from "../utils/validation";
import Header from "../components/shared/Header";
import { formatINR } from "../utils/currency";

export function ToolsPage() {
  const stats = useSelector(selectFinancialStats);

  // Independent calculator states
  const [whatIfAmount, setWhatIfAmount] = useState(3000);
  const [purchaseAmount, setPurchaseAmount] = useState(800);
  const [hourlyRate, setHourlyRate] = useState(100);

  // Parse safe numbers
  const safeWhatIf = Math.max(0, Number(whatIfAmount) || 0);
  const safePurchase = Math.max(0, Number(purchaseAmount) || 0);
  const safeHourly = Math.max(0, Number(hourlyRate) || 0);

  // What-If derived calculations
  const hypotheticalBalance = stats.balance - safeWhatIf;
  const budgetImpact =
    stats.budget > 0 ? (safeWhatIf / stats.budget) * 100 : 0;
  const hypotheticalRemainingBudget = stats.remaining - safeWhatIf;

  // Money → Time derived calculation
  const workHours = safeHourly > 0 ? safePurchase / safeHourly : null;
  const workDays = workHours !== null ? workHours / 8 : null;

  const dispatch = useDispatch();
  const [reflection, setReflection] = useState(null);
  const [itemName, setItemName] = useState("");
  const [cheaperPrice, setCheaperPrice] = useState("");
  const [vaultError, setVaultError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const validPurchase = Number.isFinite(safePurchase) && safePurchase > 0;
  const alternative = Number(cheaperPrice);
  const validAlternative = cheaperPrice.trim() !== "" && Number.isFinite(alternative) && alternative >= 0 && alternative < safePurchase;
  const savings = validAlternative ? safePurchase - alternative : 0;

  const saveForLater = (event) => {
    event.preventDefault();
    const validation = validateVaultItem({ name: itemName, amount: safePurchase });
    if (!validation.isValid) {
      setVaultError(validation.errors.name || validation.errors.amount);
      return;
    }
    dispatch(addVaultItem({ name: itemName.trim(), amount: safePurchase }));
    setSavedMessage(`Saved “${itemName.trim()}” to Want Vault for ${formatINR(safePurchase)}.`);
    setReflection(null);
    setItemName("");
    setVaultError("");
  };

  const copyToMoneyTime = () => {
    setPurchaseAmount(safeWhatIf);
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Decide · before you spend"
        title="Try the decision on first."
        sub="A small pause can make the future feel more visible."
      />

      <div className="row g-4 mt-2 reveal">
        {/* =========================
            WALLET WHAT-IF
        ========================= */}
        <div className="col-lg-6">
          <div className="tool-box">
            <div style={{ gridColumn: "1 / -1" }}>
              <span className="eyebrow">Wallet What-If</span>
              <h2 className="what-if-title">
                What if I spend {formatINR(safeWhatIf)}?
              </h2>

              <div className="what-if-input-wrap">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={whatIfAmount}
                  onChange={(e) => setWhatIfAmount(e.target.value)}
                  placeholder="3000"
                  aria-label="What-if spending amount"
                />
              </div>

              <div className="progress-line" role="progressbar" aria-valuenow={Math.min(100, Math.round(budgetImpact))} aria-valuemin="0" aria-valuemax="100">
                <i style={{ width: `${Math.min(100, budgetImpact)}%` }}></i>
              </div>
            </div>

            <div>
              <span className="eyebrow">Hypothetical Balance</span>
              <strong
                style={{
                  fontSize: "1.5rem",
                  fontFamily: "var(--font-serif)",
                  color:
                    hypotheticalBalance < 0
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                }}
              >
                {formatINR(hypotheticalBalance)}
              </strong>
            </div>

            <div>
              <span className="eyebrow">Budget Impact</span>
              <strong
                style={{
                  fontSize: "1.5rem",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {stats.budget > 0 ? `${Math.round(budgetImpact)}%` : "N/A"}
              </strong>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <span className="eyebrow">Hypothetical Remaining Budget</span>
              <strong
                style={{
                  fontSize: "1.5rem",
                  fontFamily: "var(--font-serif)",
                  color:
                    hypotheticalRemainingBudget < 0
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                }}
              >
                {formatINR(hypotheticalRemainingBudget)}
              </strong>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: "0.8rem", padding: 0 }}
                onClick={copyToMoneyTime}
              >
                Compare this amount in Money → Time ↓
              </button>
            </div>
          </div>
        </div>

        {/* =========================
            MONEY → TIME
        ========================= */}
        <div className="col-lg-6">
          <div className="tool-box dark">
            <div style={{ gridColumn: "1 / -1" }}>
              <span className="eyebrow">Money → Time</span>
              <h2>What does a purchase cost in hours?</h2>

              <label htmlFor="purchase-amt-input" className="tool-input-label">
                Purchase amount (₹)
              </label>
              <input
                id="purchase-amt-input"
                type="number"
                min="0"
                step="any"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="800"
                aria-label="Target purchase amount in rupees"
              />

              <label htmlFor="hourly-rate-input" className="tool-input-label">
                Hourly earning rate (₹/hr)
              </label>
              <input
                id="hourly-rate-input"
                type="number"
                min="0"
                step="any"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="100"
                aria-label="Hourly wage in rupees per hour"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              {workHours !== null ? (
                <>
                  <div className="money-time-results">
                    <div>
                      <strong>{workHours.toFixed(1)}</strong>
                      <span>Hours</span>
                    </div>
                    <div>
                      <strong>{workDays.toFixed(1)}</strong>
                      <span>{workDays === 1 ? "Workday" : "Workdays"}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      color: "#9ca3af",
                      marginTop: "0.5rem",
                    }}
                  >
                    for a {formatINR(safePurchase)} purchase at {formatINR(safeHourly)}/hour
                    <span style={{ display: "block", marginTop: "0.25rem" }}>
                      Based on an 8-hour workday
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#9ca3af", fontSize: "0.9rem", padding: "1rem 0" }}>
                  Please enter an hourly earning rate greater than ₹0 to calculate the time equivalent.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            SPENDLESS
        ========================= */}
        <div className="col-lg-12">
          <div className="tool-box green mt-2">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <span className="eyebrow">Spendless</span>
                <h2>Think with your future self.</h2>
                <p style={{ fontSize: "0.85rem", maxWidth: "600px" }}>
                  Considering {formatINR(safePurchase)}? Give it some time, or see what a cheaper option saves.
                </p>
                <p style={{ fontSize: "0.75rem" }}>Uses your purchase amount and hourly rate from Money → Time.</p>
              </div>
              <div className="reflection-actions">
                <button type="button" className="primary-button" disabled={!validPurchase}
                  aria-expanded={reflection === "wait"} aria-controls="purchase-reflection"
                  onClick={() => { setReflection("wait"); setSavedMessage(""); setVaultError(""); }}>
                  Wait on it
                </button>
                <button type="button" className="text-button" disabled={!validPurchase}
                  aria-expanded={reflection === "compare"} aria-controls="purchase-reflection"
                  onClick={() => { setReflection("compare"); setSavedMessage(""); }}>
                  Compare a cheaper option →
                </button>
              </div>
            </div>
            {!validPurchase && <p role="status">Enter a purchase amount greater than ₹0 in Money → Time to get started.</p>}
            {savedMessage && <p role="status" className="spendless-feedback">{savedMessage}</p>}
            <div id="purchase-reflection">
              {reflection === "wait" && (
                <form className="reflection-panel" onSubmit={saveForLater} noValidate>
                  <h3>Save it for later.</h3>
                  <p>Keep this {formatINR(safePurchase)} purchase in Want Vault while you decide.</p>
                  <label htmlFor="reflection-item">What are you considering?</label>
                  <input id="reflection-item" autoFocus value={itemName} maxLength={80}
                    onChange={(event) => { setItemName(event.target.value); setVaultError(""); }}
                    placeholder="e.g. Headphones" aria-invalid={Boolean(vaultError)} aria-describedby="reflection-error" />
                  <p id="reflection-error" role="alert">{vaultError}</p>
                  <div className="reflection-actions">
                    <button className="primary-button" type="submit" disabled={!validPurchase}>Save to Want Vault</button>
                    <button className="text-button" type="button" onClick={() => setReflection(null)}>Cancel</button>
                  </div>
                </form>
              )}
              {reflection === "compare" && (
                <div className="reflection-panel">
                  <h3>A lighter alternative.</h3>
                  <label htmlFor="cheaper-price">Alternative price (₹)</label>
                  <input id="cheaper-price" type="number" min="0" step="any" autoFocus
                    value={cheaperPrice} onChange={(event) => setCheaperPrice(event.target.value)} placeholder="Enter a lower price" />
                  <div className="reflection-feedback" aria-live="polite">
                    {validPurchase && validAlternative ? (
                      <p className="reflection-savings">
                        Save <strong>{formatINR(savings)}</strong> compared with {formatINR(safePurchase)}.
                        {safeHourly > 0 && Number.isFinite(safeHourly) ? (
                          <span> That’s {(savings / safeHourly).toFixed(1)} hours · {(savings / safeHourly / 8).toFixed(1)} workdays saved, based on an 8-hour workday.</span>
                        ) : <span> Enter a positive hourly rate in Money → Time to see the time saved.</span>}
                      </p>
                    ) : cheaperPrice !== "" && <p>Enter a price from ₹0 up to, but below, {formatINR(safePurchase)}.</p>}
                  </div>
                  <button type="button" className="text-button" onClick={() => setReflection(null)}>Close comparison</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolsPage;
