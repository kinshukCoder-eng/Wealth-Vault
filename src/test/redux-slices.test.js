import { describe, it, expect } from "vitest";
import transactionsReducer, {
  addTransaction,
  editTransaction,
  deleteTransaction,
  resetTransactions,
} from "../features/transactions/transactionsSlice";
import goalsReducer, {
  addGoal,
  addContribution,
  deleteContribution,
  reorderGoal,
} from "../features/goals/goalsSlice";
import vaultReducer, {
  addVaultItem,
  editVaultItem,
  deleteVaultItem,
} from "../features/vault/vaultSlice";
import budgetReducer, {
  setBudgetMode,
  setManualBudget,
  setReportingPeriod,
} from "../features/budget/budgetSlice";
import challengesReducer, {
  toggleChallenge,
  claimXP,
} from "../features/challenges/challengesSlice";
import pocketPalReducer, {
  addMessage,
  clearMessages,
} from "../features/pocketPal/pocketPalSlice";
import { demoState } from "../data/demoData";

describe("Redux Slices & Domain Actions", () => {
  it("adds, edits, and deletes transactions cleanly", () => {
    let state = [];
    state = transactionsReducer(
      state,
      addTransaction({
        title: "Coffee",
        amount: 150,
        category: "Food",
        type: "expense",
        date: "2026-03-24",
      })
    );
    expect(state.length).toBe(1);
    expect(state[0].title).toBe("Coffee");
    expect(state[0].amount).toBe(150);

    const id = state[0].id;
    state = transactionsReducer(
      state,
      editTransaction({
        id,
        title: "Cold Brew Coffee",
        amount: 220,
        category: "Food",
        type: "expense",
        date: "2026-03-24",
      })
    );
    expect(state[0].title).toBe("Cold Brew Coffee");
    expect(state[0].amount).toBe(220);
    expect(state[0].id).toBe(id); // ID preserved

    state = transactionsReducer(state, deleteTransaction(id));
    expect(state.length).toBe(0);
  });

  it("resets ONLY transactions to original demo records", () => {
    const custom = [{ id: "t99", title: "Custom", amount: 10, type: "expense", date: "2026-03-01" }];
    const reset = transactionsReducer(custom, resetTransactions());
    expect(reset.length).toBe(demoState.transactions.length);
    expect(reset[0].id).toBe("t1");
  });

  it("manages goals and contributions", () => {
    let state = [];
    state = goalsReducer(
      state,
      addGoal({ name: "Laptop", target: 80000, monthly: 5000, emoji: "💻" })
    );
    expect(state.length).toBe(1);
    const goalId = state[0].id;

    // Add contribution
    state = goalsReducer(
      state,
      addContribution({
        goalId,
        amount: 10000,
        date: "2026-03-20",
        note: "Freelance check",
      })
    );
    expect(state[0].contributions.length).toBe(1);
    expect(state[0].contributions[0].amount).toBe(10000);

    const contribId = state[0].contributions[0].id;
    // Delete contribution
    state = goalsReducer(
      state,
      deleteContribution({ goalId, contributionId: contribId })
    );
    expect(state[0].contributions.length).toBe(0);
  });

  it("reorders goals without changing their data", () => {
    const state = [
      { id: "g1", name: "First", target: 1000 },
      { id: "g2", name: "Second", target: 2000 },
      { id: "g3", name: "Third", target: 3000 },
    ];

    const reordered = goalsReducer(
      state,
      reorderGoal({ sourceId: "g1", targetId: "g3" })
    );

    expect(reordered.map((goal) => goal.id)).toEqual(["g2", "g3", "g1"]);
    expect(reordered.find((goal) => goal.id === "g1").target).toBe(1000);
  });

  it("manages Want Vault items", () => {
    let state = [];
    state = vaultReducer(state, addVaultItem({ name: "Monitor", amount: 15000 }));
    expect(state.length).toBe(1);
    expect(state[0].name).toBe("Monitor");

    const id = state[0].id;
    state = vaultReducer(state, editVaultItem({ id, name: "4K Monitor", amount: 18000 }));
    expect(state[0].name).toBe("4K Monitor");
    expect(state[0].amount).toBe(18000);

    state = vaultReducer(state, deleteVaultItem(id));
    expect(state.length).toBe(0);
  });

  it("configures budget modes and periods", () => {
    let state = { mode: "auto", manualAmounts: {}, defaultManual: 15000, reportingPeriod: "2026-03" };
    state = budgetReducer(state, setManualBudget({ periodKey: "2026-03", amount: 18000 }));
    expect(state.mode).toBe("manual");
    expect(state.manualAmounts["2026-03"]).toBe(18000);

    state = budgetReducer(state, setBudgetMode("auto"));
    expect(state.mode).toBe("auto");

    state = budgetReducer(state, setReportingPeriod("2026-04"));
    expect(state.reportingPeriod).toBe("2026-04");
  });

  it("tracks challenges and prevents duplicate XP claims", () => {
    let state = { activeChallenges: ["weekly-food"], claimedXP: {} };
    state = challengesReducer(state, toggleChallenge("monthly-savings"));
    expect(state.activeChallenges).toContain("monthly-savings");

    state = challengesReducer(state, claimXP({ challengeId: "weekly-food", periodKey: "2026-03-23" }));
    expect(state.claimedXP["weekly-food_2026-03-23"]).toBe(true);
  });

  it("preserves Pocket Pal session messages and supports clear chat", () => {
    let state = { messages: [] };
    state = pocketPalReducer(state, addMessage({ text: "Hello", sender: "user" }));
    state = pocketPalReducer(state, addMessage({ text: "Hi Arjun", sender: "bot" }));
    expect(state.messages.length).toBe(2);

    state = pocketPalReducer(state, clearMessages());
    expect(state.messages.length).toBe(0);
  });
});
