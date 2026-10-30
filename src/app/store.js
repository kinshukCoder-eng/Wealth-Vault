import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer from "../features/transactions/transactionsSlice";
import goalsReducer from "../features/goals/goalsSlice";
import vaultReducer from "../features/vault/vaultSlice";
import budgetReducer from "../features/budget/budgetSlice";
import challengesReducer from "../features/challenges/challengesSlice";
import pocketPalReducer from "../features/pocketPal/pocketPalSlice";
import { loadPersistedState, persistApplicationState } from "../utils/persistence";

const persisted = loadPersistedState();

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    goals: goalsReducer,
    vault: vaultReducer,
    budget: budgetReducer,
    challenges: challengesReducer,
    pocketPal: pocketPalReducer,
  },
  preloadedState: {
    transactions: persisted.transactions,
    goals: persisted.goals,
    vault: persisted.vault,
    budget: persisted.budget,
    challenges: persisted.challenges,
    pocketPal: { messages: [] },
  },
});

// Subscribe to store updates to persist domain data safely
let saveTimeout = null;
store.subscribe(() => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const state = store.getState();
    persistApplicationState({
      transactions: state.transactions,
      goals: state.goals,
      vault: state.vault,
      budget: state.budget,
      challenges: state.challenges,
      reportingPeriod: state.budget.reportingPeriod,
    });
  }, 100);
});
