/**
 * Centralized calculation layer for Wealth Vault.
 * Used consistently across Dashboard, Insights, Smart Tools, Challenges, and Pocket Pal.
 */

import { roundCurrency, formatBudgetPercent } from "./currency";
import {
  isInPeriod,
  getDaysInPeriod,
  isCurrentPeriod,
  isPastPeriod,
  isWeekend,
} from "./dates";

/**
 * Calculates all-time net balance across all transactions.
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateAllTimeBalance(transactions = []) {
  return roundCurrency(
    transactions.reduce((sum, t) => {
      const amt = Number(t.amount) || 0;
      return t.type === "income" ? sum + amt : sum - amt;
    }, 0)
  );
}

/**
 * Derives financial statistics for a given list of transactions and selected period.
 *
 * @param {Array} transactions
 * @param {object} options
 * @param {string} [options.periodKey='all'] - 'YYYY-MM' or 'all'
 * @param {object} [options.budgetConfig] - { mode: 'auto'|'manual', manualAmounts: { [periodKey]: number }, defaultManual: number }
 * @returns {object}
 */
export function deriveFinancialStats(transactions = [], options = {}) {
  const { periodKey = "all", budgetConfig = { mode: "auto" } } = options;

  let allTimeBalance = 0;
  let periodIncome = 0;
  let periodSpending = 0;
  const categories = {};
  const periodTransactions = [];

  // Sort transactions chronologically for time-based analysis
  const sorted = [...transactions].sort((a, b) => {
    return (a.date || "").localeCompare(b.date || "");
  });

  sorted.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === "income") {
      allTimeBalance += amt;
    } else {
      allTimeBalance -= amt;
    }

    if (isInPeriod(t.date, periodKey)) {
      periodTransactions.push(t);
      if (t.type === "income") {
        periodIncome += amt;
      } else {
        periodSpending += amt;
        const cat = t.category || "Other";
        categories[cat] = (categories[cat] || 0) + amt;
      }
    }
  });

  allTimeBalance = roundCurrency(allTimeBalance);
  periodIncome = roundCurrency(periodIncome);
  periodSpending = roundCurrency(periodSpending);

  // Determine budget for this period
  let budget = 0;
  let isBudgetAuto = true;

  if (budgetConfig.mode === "manual") {
    isBudgetAuto = false;
    if (
      budgetConfig.manualAmounts &&
      budgetConfig.manualAmounts[periodKey] !== undefined
    ) {
      budget = Number(budgetConfig.manualAmounts[periodKey]);
    } else if (budgetConfig.defaultManual !== undefined) {
      budget = Number(budgetConfig.defaultManual);
    } else {
      budget = 0;
    }
  } else {
    // Automatic mode: 80% of period income
    isBudgetAuto = true;
    budget = roundCurrency(periodIncome * 0.8);
  }

  budget = roundCurrency(Math.max(0, budget));
  const remaining = roundCurrency(budget - periodSpending);

  // Pacing Score / MoneyPulse calculation
  // Handle zero-budget and edge states gracefully
  let score = 100;
  if (budget === 0) {
    if (periodSpending > 0) {
      score = 0; // Spending with zero budget
    } else {
      score = 100; // No budget and no spending yet
    }
  } else {
    // Continuous scale: 100 with no spending, 50 at the limit, 0 at twice the budget.
    score = Math.max(0, Math.min(100, Math.round(100 - (periodSpending / budget) * 50)));
  }

  // Projection / Forecast
  let projected = periodSpending;
  if (isCurrentPeriod(periodKey)) {
    const today = new Date();
    const elapsedDays = Math.max(1, today.getDate());
    const totalDays = getDaysInPeriod(periodKey);
    // Extrapolate daily spending across remaining month
    const dailyAverage = periodSpending / elapsedDays;
    projected = roundCurrency(dailyAverage * totalDays);
  } else if (isPastPeriod(periodKey)) {
    // Completed historical month: projected equals actual final spending
    projected = periodSpending;
  } else if (periodKey === "all") {
    // All-time: projection is current spending
    projected = periodSpending;
  }

  // Wallet weather calculation
  let weather = "clear";
  let weatherLabel = "Clear.";
  let weatherIcon = "🌤️";
  let weatherDescription = "No spending recorded for this period yet.";

  if (periodSpending > 0 || budget > 0) {
    if (budget > 0) {
      const spendRatio = periodSpending / budget;
      if (spendRatio > 1) {
        weather = "stormy";
        weatherLabel = "Stormy.";
        weatherIcon = "⛈️";
        const overPercent = formatBudgetPercent((spendRatio - 1) * 100);
        weatherDescription = `You're currently ${overPercent} over your ${periodKey === "all" ? "all-time" : "monthly"} budget.`;
      } else if (spendRatio > 0.85) {
        weather = "cloudy";
        weatherLabel = "Cloudy.";
        weatherIcon = "⛅";
        const remainingPercent = Math.round((1 - spendRatio) * 100);
        weatherDescription = `Approaching budget limit with ${remainingPercent}% remaining.`;
      } else {
        weather = "sunny";
        weatherLabel = "Sunny.";
        weatherIcon = "☀️";
        const underPercent = Math.round((1 - spendRatio) * 100);
        weatherDescription = `You're currently ${underPercent}% under your planned ${periodKey === "all" ? "all-time" : "monthly"} budget.`;
      }
    } else {
      weather = "mild";
      weatherLabel = "Mild.";
      weatherIcon = "🌤️";
      weatherDescription = `₹${periodSpending.toLocaleString("en-IN")} spent with no active budget set.`;
    }
  }

  // Category breakdown formatted with percentages
  const categoryBreakdown = Object.entries(categories)
    .map(([name, amount]) => ({
      name,
      amount: roundCurrency(amount),
      percentage:
        periodSpending > 0
          ? Math.round((amount / periodSpending) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    balance: allTimeBalance,
    allTimeBalance,
    income: periodIncome,
    spending: periodSpending,
    budget,
    isBudgetAuto,
    remaining,
    score,
    projected,
    categories,
    categoryBreakdown,
    weather,
    weatherLabel,
    weatherIcon,
    weatherDescription,
    periodTransactions,
  };
}

/**
 * Backward-compatible `derive` function for existing signatures.
 * @param {Array} transactions
 * @returns {object}
 */
export function derive(transactions = []) {
  return deriveFinancialStats(transactions, {
    periodKey: "all",
    budgetConfig: { mode: "auto" },
  });
}

/**
 * Generates explainable data-driven insights from transactions and stats.
 *
 * @param {Array} transactions
 * @param {object} stats
 * @param {string} periodKey
 * @returns {object}
 */
export function generateInsights(transactions = [], stats, periodKey = "all") {
  const periodExpenses = (stats?.periodTransactions || transactions).filter(
    (t) => t.type === "expense" && isInPeriod(t.date, periodKey)
  );

  // 1. Largest category
  const topCategory = stats?.categoryBreakdown?.[0] || null;

  // 2. Small purchases detection (documented threshold: <= ₹300)
  const SMALL_PURCHASE_THRESHOLD = 300;
  const smallPurchases = periodExpenses.filter(
    (t) => Number(t.amount) <= SMALL_PURCHASE_THRESHOLD
  );
  const smallTotal = roundCurrency(
    smallPurchases.reduce((sum, t) => sum + Number(t.amount), 0)
  );
  const smallPercentage =
    stats.spending > 0
      ? Math.round((smallTotal / stats.spending) * 100)
      : 0;

  // 3. Weekend vs Weekday analysis (normalized daily averages)
  let weekdayTotal = 0;
  const weekdayDates = new Set();
  let weekendTotal = 0;
  const weekendDates = new Set();

  periodExpenses.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (isWeekend(t.date)) {
      weekendTotal += amt;
      weekendDates.add(t.date);
    } else {
      weekdayTotal += amt;
      weekdayDates.add(t.date);
    }
  });

  const weekendDayCount = weekendDates.size;
  const weekdayDayCount = weekdayDates.size;

  let weekendComparison = null;
  if (weekendDayCount > 0 && weekdayDayCount > 0) {
    const avgWeekend = weekendTotal / weekendDayCount;
    const avgWeekday = weekdayTotal / weekdayDayCount;
    const ratio = avgWeekday > 0 ? (avgWeekend / avgWeekday).toFixed(1) : null;

    weekendComparison = {
      avgWeekend: roundCurrency(avgWeekend),
      avgWeekday: roundCurrency(avgWeekday),
      ratio,
      isHigherOnWeekend: avgWeekend > avgWeekday,
      weekendTotal: roundCurrency(weekendTotal),
      weekdayTotal: roundCurrency(weekdayTotal),
    };
  }

  // 4. Budget comparison message
  let budgetInsight = null;
  if (stats.budget > 0) {
    const diff = stats.projected - stats.budget;
    budgetInsight = {
      status: diff > 0 ? "over" : "within",
      amount: Math.abs(diff),
      percent: Math.round((stats.projected / stats.budget) * 100),
    };
  }

  return {
    topCategory,
    smallPurchases: {
      count: smallPurchases.length,
      total: smallTotal,
      percentage: smallPercentage,
      threshold: SMALL_PURCHASE_THRESHOLD,
    },
    weekendComparison,
    budgetInsight,
  };
}

/**
 * Calculates consecutive no-expense days up to the given reference date.
 * Does not falsely claim a streak if there are zero transactions in history.
 *
 * @param {Array} transactions
 * @param {Date} [referenceDate=new Date()]
 * @returns {{ streak: number, hasHistory: boolean }}
 */
export function calculateNoExpenseStreak(transactions = [], referenceDate = new Date()) {
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length === 0) {
    return { streak: 0, hasHistory: false };
  }

  const expenseDates = new Set(expenses.map((t) => (t.date || "").slice(0, 10)));
  let streak = 0;
  const cursor = new Date(referenceDate);

  // Check each day backwards
  for (let i = 0; i < 30; i++) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    if (expenseDates.has(dateStr)) {
      // Hit a day with expense
      break;
    } else {
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, hasHistory: true };
}
