import { createSelector } from "@reduxjs/toolkit";
import {
  deriveFinancialStats,
  generateInsights,
  calculateNoExpenseStreak,
} from "../utils/calculations";
import {
  getPeriodKey,
  getCurrentWeekRange,
  isInPeriod,
} from "../utils/dates";
import { roundCurrency } from "../utils/currency";

// Base State Selectors
export const selectTransactions = (state) => state.transactions;
export const selectGoals = (state) => state.goals;
export const selectVault = (state) => state.vault;
export const selectBudget = (state) => state.budget;
export const selectChallenges = (state) => state.challenges;
export const selectPocketPal = (state) => state.pocketPal;

export const selectReportingPeriod = (state) => state.budget.reportingPeriod || "2026-03";

/**
 * Returns sorted list of distinct periods available in transactions.
 */
export const selectAvailablePeriods = createSelector(
  [selectTransactions],
  (transactions) => {
    const periodSet = new Set();
    // Always include current month
    periodSet.add(getPeriodKey(new Date()));
    // And default demo period
    periodSet.add("2026-03");

    transactions.forEach((t) => {
      if (t.date) {
        periodSet.add(getPeriodKey(t.date));
      }
    });

    return Array.from(periodSet).sort((a, b) => b.localeCompare(a));
  }
);

/**
 * Primary memoized financial statistics selector.
 */
export const selectFinancialStats = createSelector(
  [selectTransactions, selectReportingPeriod, selectBudget],
  (transactions, reportingPeriod, budgetConfig) => {
    return deriveFinancialStats(transactions, {
      periodKey: reportingPeriod,
      budgetConfig,
    });
  }
);

/**
 * Memoized insights derived from current period and transactions.
 */
export const selectInsights = createSelector(
  [selectTransactions, selectFinancialStats, selectReportingPeriod],
  (transactions, stats, reportingPeriod) => {
    return generateInsights(transactions, stats, reportingPeriod);
  }
);

/**
 * Computed Goals selector with live contribution totals, remaining amounts, and progress.
 */
export const selectEnhancedGoals = createSelector([selectGoals], (goals) => {
  return goals.map((goal) => {
    const target = Number(goal.target) || 0;
    const initialSaved = Number(goal.initialSaved) || 0;
    const contributionsTotal = (goal.contributions || []).reduce(
      (sum, c) => sum + (Number(c.amount) || 0),
      0
    );
    const totalSaved = roundCurrency(initialSaved + contributionsTotal);
    const remaining = Math.max(0, roundCurrency(target - totalSaved));
    const progress = target > 0 ? Math.min(100, Math.round((totalSaved / target) * 100)) : 0;
    const isExceeded = totalSaved >= target;

    const monthly = Number(goal.monthly) || 0;
    let estimatedMonths = null;
    if (isExceeded) {
      estimatedMonths = 0;
    } else if (monthly > 0) {
      estimatedMonths = Math.ceil(remaining / monthly);
    }

    return {
      ...goal,
      target,
      initialSaved,
      contributionsTotal,
      totalSaved,
      remaining,
      progress,
      isExceeded,
      monthly,
      estimatedMonths,
    };
  });
});

/**
 * Live Challenge evaluation based on actual data.
 */
export const selectEvaluatedChallenges = createSelector(
  [
    selectTransactions,
    selectEnhancedGoals,
    selectChallenges,
    selectReportingPeriod,
  ],
  (transactions, goals, challenges, reportingPeriod) => {
    const { activeChallenges = [], claimedXP = {} } = challenges;

    // 1. Weekly Food Challenge: Stay under ₹1,000 this week
    const weekRange = getCurrentWeekRange();
    const foodExpensesThisWeek = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.category === "Food" &&
        t.date >= weekRange.start &&
        t.date <= weekRange.end
    );
    const foodSpentThisWeek = roundCurrency(
      foodExpensesThisWeek.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );
    const foodBudgetLimit = 1000;
    const isFoodChallengePassed = foodSpentThisWeek <= foodBudgetLimit;
    const foodKey = `weekly-food_${weekRange.start}`;
    const isFoodXPClaimed = Boolean(claimedXP[foodKey]);

    // 2. Monthly Savings Challenge: Save ₹500 this month (calculated from goal contributions in period)
    const goalContributionsThisPeriod = goals.reduce((total, goal) => {
      const matching = (goal.contributions || []).filter((c) =>
        isInPeriod(c.date, reportingPeriod)
      );
      return (
        total +
        matching.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
      );
    }, 0);
    const savingsTarget = 500;
    const isSavingsChallengePassed = goalContributionsThisPeriod >= savingsTarget;
    const savingsKey = `monthly-savings_${reportingPeriod}`;
    const isSavingsXPClaimed = Boolean(claimedXP[savingsKey]);

    // 3. No-expense day streak
    const streakResult = calculateNoExpenseStreak(transactions);

    return {
      activeChallenges,
      streak: streakResult.streak,
      hasStreakHistory: streakResult.hasHistory,
      weeklyFood: {
        spent: foodSpentThisWeek,
        limit: foodBudgetLimit,
        isPassed: isFoodChallengePassed,
        progressPercent: Math.min(100, Math.round((foodSpentThisWeek / foodBudgetLimit) * 100)),
        isClaimed: isFoodXPClaimed,
        weekRange,
      },
      monthlySavings: {
        saved: roundCurrency(goalContributionsThisPeriod),
        target: savingsTarget,
        isPassed: isSavingsChallengePassed,
        progressPercent: Math.min(100, Math.round((goalContributionsThisPeriod / savingsTarget) * 100)),
        isClaimed: isSavingsXPClaimed,
      },
    };
  }
);
