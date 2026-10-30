import { describe, it, expect } from "vitest";
import {
  deriveFinancialStats,
  generateInsights,
  calculateNoExpenseStreak,
} from "../utils/calculations";
import { roundCurrency, formatINR, isValidAmount } from "../utils/currency";
import {
  getLocalDateString,
  parseLocalDate,
  isInPeriod,
  calculateElapsedDays,
} from "../utils/dates";

describe("Currency & Precision Calculations", () => {
  it("rounds floating-point currency cleanly to 2 decimal places", () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(roundCurrency(150.456)).toBe(150.46);
    expect(roundCurrency("invalid")).toBe(0);
  });

  it("formats Indian Rupee (INR) amounts correctly", () => {
    expect(formatINR(1580)).toContain("1,580");
    expect(formatINR(100000)).toContain("1,00,000");
  });

  it("validates financial amounts strictly", () => {
    expect(isValidAmount(150)).toBe(true);
    expect(isValidAmount("250.50")).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-50)).toBe(false);
    expect(isValidAmount("")).toBe(false);
  });
});

describe("Date & Period Calculations", () => {
  it("formats local calendar date YYYY-MM-DD without timezone shift", () => {
    const d = new Date(2026, 2, 24); // March 24, 2026
    expect(getLocalDateString(d)).toBe("2026-03-24");
  });

  it("parses local date accurately", () => {
    const parsed = parseLocalDate("2026-03-24");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(24);
  });

  it("accurately filters transactions within period", () => {
    expect(isInPeriod("2026-03-15", "2026-03")).toBe(true);
    expect(isInPeriod("2026-04-01", "2026-03")).toBe(false);
    expect(isInPeriod("2026-04-01", "all")).toBe(true);
  });

  it("calculates cooling-off elapsed days without negative or future distortion", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateElapsedDays(tenDaysAgo)).toBe(10);

    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateElapsedDays(futureDate)).toBe(0);
  });
});

describe("Financial Statistics Engine", () => {
  const sampleTransactions = [
    { id: "t1", title: "Freelance", category: "Other", amount: 20000, type: "income", date: "2026-03-01" },
    { id: "t2", title: "Rent", category: "Bills", amount: 8000, type: "expense", date: "2026-03-05" },
    { id: "t3", title: "Groceries", category: "Food", amount: 2000, type: "expense", date: "2026-03-07" },
    { id: "t4", title: "April Bonus", category: "Other", amount: 5000, type: "income", date: "2026-04-01" },
  ];

  it("distinguishes all-time net balance from period income & spending", () => {
    const statsMarch = deriveFinancialStats(sampleTransactions, { periodKey: "2026-03" });
    // Total income: 20000 + 5000 = 25000; Total expense: 10000. All time balance = 15000
    expect(statsMarch.balance).toBe(15000);
    // Period March: Income = 20000, Spending = 10000
    expect(statsMarch.income).toBe(20000);
    expect(statsMarch.spending).toBe(10000);
    // Auto budget: 80% of 20000 = 16000
    expect(statsMarch.budget).toBe(16000);
    expect(statsMarch.remaining).toBe(6000);
    expect(statsMarch.score).toBeGreaterThan(0);
  });

  it("handles empty transaction history gracefully", () => {
    const stats = deriveFinancialStats([], { periodKey: "2026-03" });
    expect(stats.balance).toBe(0);
    expect(stats.income).toBe(0);
    expect(stats.spending).toBe(0);
    expect(stats.budget).toBe(0);
    expect(stats.remaining).toBe(0);
    expect(stats.score).toBe(100);
  });

  it("handles zero budget without division by zero error", () => {
    const stats = deriveFinancialStats(
      [{ id: "t1", title: "Coffee", category: "Food", amount: 200, type: "expense", date: "2026-03-02" }],
      { periodKey: "2026-03", budgetConfig: { mode: "manual", manualAmounts: { "2026-03": 0 } } }
    );
    expect(stats.budget).toBe(0);
    expect(stats.remaining).toBe(-200);
    expect(Number.isFinite(stats.score)).toBe(true);
    expect(stats.score).toBe(0);
  });

  it("handles negative balances and budget overruns correctly", () => {
    const stats = deriveFinancialStats(
      [
        { id: "t1", title: "Small job", category: "Other", amount: 1000, type: "income", date: "2026-03-01" },
        { id: "t2", title: "Emergency repair", category: "Bills", amount: 5000, type: "expense", date: "2026-03-03" },
      ],
      { periodKey: "2026-03" }
    );
    expect(stats.balance).toBe(-4000);
    expect(stats.spending).toBe(5000);
    expect(stats.remaining).toBeLessThan(0);
    expect(stats.weather).toBe("stormy");
  });

  it("generates data-driven explainable insights", () => {
    const stats = deriveFinancialStats(sampleTransactions, { periodKey: "2026-03" });
    const insights = generateInsights(sampleTransactions, stats, "2026-03");

    expect(insights.topCategory.name).toBe("Bills");
    expect(insights.topCategory.amount).toBe(8000);
  });

  it("calculates streak honestly without assuming a 5-day streak on zero history", () => {
    const emptyResult = calculateNoExpenseStreak([]);
    expect(emptyResult.hasHistory).toBe(false);
    expect(emptyResult.streak).toBe(0);
  });
});

describe('MoneyPulse regression', () => {
  it('never increases as spending passes through the budget limit', () => {
    const scores=[0,100,299,300,301,450,600,900].map(amount => deriveFinancialStats([{type:'expense',amount,date:'2026-03-01'}],{periodKey:'2026-03',budgetConfig:{mode:'manual',manualAmounts:{'2026-03':300}}}).score);
    expect(scores[0]).toBe(100); expect(scores[3]).toBe(50); expect(scores[6]).toBe(0);
    scores.slice(1).forEach((score,i) => expect(score).toBeLessThanOrEqual(scores[i]));
  });
});
