import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "auto", // 'auto' (80% of income) or 'manual'
  manualAmounts: {
    "2026-03": 12000,
  },
  defaultManual: 15000,
  reportingPeriod: "2026-03", // Default period aligned with demo records
};

const budgetSlice = createSlice({
  name: "budget",
  initialState,
  reducers: {
    setBudgetMode(state, action) {
      state.mode = action.payload; // 'auto' or 'manual'
    },
    setManualBudget(state, action) {
      const { periodKey, amount } = action.payload;
      state.mode = "manual";
      state.manualAmounts[periodKey] = Math.max(0, Number(amount) || 0);
    },
    setDefaultManualBudget(state, action) {
      state.defaultManual = Math.max(0, Number(action.payload) || 0);
    },
    setReportingPeriod(state, action) {
      state.reportingPeriod = action.payload;
    },
    setAllBudget(_state, action) {
      return action.payload;
    },
  },
});

export const {
  setBudgetMode,
  setManualBudget,
  setDefaultManualBudget,
  setReportingPeriod,
  setAllBudget,
} = budgetSlice.actions;

export default budgetSlice.reducer;
