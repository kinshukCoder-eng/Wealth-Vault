import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFinancialStats,
  selectReportingPeriod,
  selectPocketPal,
} from "../features/selectors";
import {
  addMessage,
  clearMessages,
} from "../features/pocketPal/pocketPalSlice";
import Header from "../components/shared/Header";
import { formatINR } from "../utils/currency";
import { formatPeriodLabel } from "../utils/dates";
import { useUI } from "../contexts/UIContext";

/**
 * Extracts a financial amount from user query if present.
 * Matches: ₹3000, ₹ 3,000, 3000, 450.50
 */
function extractAmountFromText(text) {
  if (!text) return null;
  // Match rupee symbol or digits with optional commas and decimals
  const match = text.match(/(?:₹\s*|rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (match && match[1]) {
    const cleanNum = parseFloat(match[1].replace(/,/g, ""));
    return Number.isFinite(cleanNum) && cleanNum > 0 ? cleanNum : null;
  }
  return null;
}

export function PocketPalPage() {
  const dispatch = useDispatch();
  const stats = useSelector(selectFinancialStats);
  const reportingPeriod = useSelector(selectReportingPeriod);
  const { messages } = useSelector(selectPocketPal);
  const { showConfirm, showToast } = useUI();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const periodLabel = formatPeriodLabel(reportingPeriod);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClearChat = () => {
    showConfirm({
      title: "Clear Conversation?",
      message: "Do you want to reset your current Pocket Pal discussion history?",
      confirmText: "Clear Chat",
      cancelText: "Keep",
      isDestructive: false,
      onConfirm: () => {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        setIsTyping(false);
        dispatch(clearMessages());
        showToast("Conversation cleared");
      },
    });
  };

  const generatePalReply = (query) => {
    const lower = query.toLowerCase().trim();

    // 1. Affordability intent: "afford", "can i buy", "can i spend"
    if (lower.includes("afford") || lower.includes("can i buy") || lower.includes("can i spend")) {
      const amount = extractAmountFromText(query);
      if (!amount) {
        return `How much is the purchase you're considering? (e.g., "Can I afford ₹2,500?"). Your current cash balance is ${formatINR(stats.balance)} and remaining ${periodLabel} budget is ${formatINR(stats.remaining)}.`;
      }

      const balanceRemaining = stats.balance - amount;
      const budgetRemaining = stats.remaining - amount;

      if (balanceRemaining < 0) {
        return `A ${formatINR(amount)} purchase exceeds your current wallet balance of ${formatINR(stats.balance)} by ${formatINR(Math.abs(balanceRemaining))}. This would put you in negative cash flow.`;
      } else if (stats.budget > 0 && budgetRemaining < 0) {
        return `You have sufficient cash in hand (${formatINR(stats.balance)}), but spending ${formatINR(amount)} would exceed your ${periodLabel} planned budget by ${formatINR(Math.abs(budgetRemaining))}. Note: this is a pacing guide, not a guarantee.`;
      } else {
        return `Based on your data, you can afford ${formatINR(amount)}. After this purchase, your balance will be ${formatINR(balanceRemaining)}${stats.budget > 0 ? ` and remaining budget will be ${formatINR(budgetRemaining)}` : ""}. Remember to consider any active savings goals!`;
      }
    }

    // 2. Largest category intent: "where", "most", "highest", "top category"
    if (lower.includes("where") || lower.includes("most") || lower.includes("highest category") || lower.includes("top category")) {
      const top = stats.categoryBreakdown?.[0];
      if (top) {
        return `In ${periodLabel}, most of your money went to ${top.name} (${formatINR(top.amount)}, making up ${top.percentage}% of your spending).`;
      } else {
        return `You haven't recorded any expenses in ${periodLabel} yet!`;
      }
    }

    // 3. Balance intent: "balance", "how much money", "in my wallet"
    if (lower.includes("balance") || lower.includes("in my wallet") || lower.includes("cash in hand")) {
      return `Your current all-time net wallet balance is ${formatINR(stats.balance)}.`;
    }

    // 4. Budget intent: "budget", "remaining budget", "left to spend"
    if (lower.includes("budget") || lower.includes("left to spend") || lower.includes("left to plan")) {
      if (stats.budget > 0) {
        return `For ${periodLabel}, your planned budget is ${formatINR(stats.budget)}. You've spent ${formatINR(stats.spending)}, leaving ${formatINR(stats.remaining)} (${stats.isBudgetAuto ? "calculated as 80% of income" : "manual target"}).`;
      } else {
        return `No budget ceiling is configured for ${periodLabel}. You've spent ${formatINR(stats.spending)} so far.`;
      }
    }

    // 5. Savings intent: "save", "savings", "how much can i save"
    if (lower.includes("save") || lower.includes("savings")) {
      if (stats.income > 0) {
        const potentialSavings = Math.max(0, stats.income - stats.spending);
        return `In ${periodLabel}, you earned ${formatINR(stats.income)} and spent ${formatINR(stats.spending)}. If no further spending occurs, you will retain ${formatINR(potentialSavings)} in savings.`;
      } else {
        return `No income has been recorded yet for ${periodLabel}. Record income in your ledger to calculate saving capacity.`;
      }
    }

    // 6. Forecast / Projected intent: "forecast", "projected", "month end", "future"
    if (lower.includes("forecast") || lower.includes("projected") || lower.includes("month end")) {
      return `Based on daily pacing in ${periodLabel}, your projected spending is ${formatINR(stats.projected)}${stats.budget > 0 ? ` against your ${formatINR(stats.budget)} budget.` : "."}`;
    }

    // 7. Spending pace / "too much" intent
    if (lower.includes("too much") || lower.includes("spending pace") || lower.includes("how am i doing")) {
      if (stats.budget > 0) {
        const pct = Math.round((stats.spending / stats.budget) * 100);
        return `You've used ${pct}% of your ${periodLabel} budget (${formatINR(stats.spending)} out of ${formatINR(stats.budget)}). MoneyPulse score: ${stats.score}/100.`;
      } else {
        return `You've spent ${formatINR(stats.spending)} in ${periodLabel}. Consider setting a monthly budget to measure pacing.`;
      }
    }

    // Default structured guide
    return `I am your local, private assistant. Ask me:
• "Where did most of my money go?"
• "Can I afford ₹2,500?"
• "What is my current balance?"
• "What is my remaining budget?"
• "What is my projected spending?"`;
  };

  const handleSend = (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    dispatch(addMessage({ text, sender: "user" }));
    setInput("");
    setIsTyping(true);

    timerRef.current = setTimeout(() => {
      const reply = generatePalReply(text);
      dispatch(addMessage({ text: reply, sender: "bot" }));
      setIsTyping(false);
    }, 450);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="page-wrap">
      <Header
        eyebrow="Pocket Pal · Your money, decoded"
        title="Ask the question behind the question."
        sub={`A structured guide to your ${periodLabel} data. Completely private, on-device, and rule-based.`}
        actions={
          messages.length > 0 && (
            <button
              type="button"
              className="text-button"
              style={{ fontSize: "0.8rem" }}
              onClick={handleClearChat}
            >
              Clear conversation
            </button>
          )
        }
      />

      <div className="pal-box reveal mt-4">
        {messages.length === 0 ? (
          <>
            <div
              className="insight-icon"
              style={{ background: "#1c2127", color: "white", border: "none" }}
            >
              <i className="bi bi-chat-square-text"></i>
            </div>
            <span className="eyebrow" style={{ color: "var(--text-secondary)" }}>
              Pocket Pal says
            </span>
            <h2>
              Ask me where your money went, what you can afford, or how to pace your month.
            </h2>
          </>
        ) : (
          <div
            className="chat-history"
            role="log"
            aria-label="Pocket Pal conversation"
            aria-live="polite"
            style={{
              marginBottom: "2rem",
              maxHeight: "420px",
              overflowY: "auto",
              paddingRight: "0.5rem",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: "1rem",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background:
                      msg.sender === "user" ? "var(--accent-primary)" : "var(--surface-color, white)",
                    color: msg.sender === "user" ? "white" : "var(--text-primary, #1c2127)",
                    padding: "0.75rem 1.25rem",
                    borderRadius:
                      msg.sender === "user"
                        ? "12px 12px 0 12px"
                        : "12px 12px 12px 0",
                    border:
                      msg.sender === "bot"
                        ? "1px solid var(--border-color, rgba(0,0,0,0.1))"
                        : "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    maxWidth: "85%",
                    lineHeight: "1.5",
                    textAlign: "left",
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--surface-color, white)",
                    color: "var(--text-secondary)",
                    padding: "0.5rem 1rem",
                    borderRadius: "12px 12px 12px 0",
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                  }}
                >
                  Pocket Pal is calculating...
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="pal-input-wrap">
          <input
            ref={inputRef}
            placeholder="Type your question (e.g. Can I afford ₹2,500?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            aria-label="Ask Pocket Pal a question"
          />
          <button
            type="submit"
            className="primary-button"
            style={{ borderRadius: "2px", padding: "0.5rem 1.25rem" }}
            disabled={!input.trim() || isTyping}
          >
            Ask Pal ↗
          </button>
        </form>

        <div className="pal-tags" style={{ flexWrap: "wrap", marginTop: "1rem" }}>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("Where did most of my money go?")}
          >
            Where did most of my money go?
          </button>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("Can I afford ₹3,000?")}
          >
            Can I afford ₹3,000?
          </button>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("What is my remaining budget?")}
          >
            What is my remaining budget?
          </button>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("What is my current balance?")}
          >
            What is my current balance?
          </button>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("How much can I save?")}
          >
            How much can I save?
          </button>
          <button
            type="button"
            className="pal-tag"
            onClick={() => handleSend("What's my projected spending?")}
          >
            What's my projected spending?
          </button>
        </div>

        <div className="pal-footer mt-4" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <i className="bi bi-shield-check" style={{ marginRight: "4px" }}></i>
          Pocket Pal runs locally in your browser. No external AI APIs or data sharing.
        </div>
      </div>
    </div>
  );
}

export default PocketPalPage;
