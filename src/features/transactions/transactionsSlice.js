import { createSlice } from "@reduxjs/toolkit";
import { demoState } from "../../data/demoData";
import { sanitizeTransaction } from "../../utils/persistence";

const initialTransactions = demoState.transactions.map(sanitizeTransaction);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState: initialTransactions,
  reducers: {
    addTransaction: {
      prepare(transaction) {
        return {
          payload: {
            ...sanitizeTransaction(transaction),
            id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          },
        };
      },
      reducer(state, action) {
        state.unshift(action.payload);
      },
    },
    editTransaction(state, action) {
      const index = state.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state[index] = {
          ...state[index],
          ...sanitizeTransaction(action.payload),
          id: action.payload.id, // Guarantee ID preservation
        };
      }
    },
    deleteTransaction(state, action) {
      return state.filter((t) => t.id !== action.payload);
    },
    resetTransactions() {
      // Specifically and exclusively resets transactions to original demo records
      return demoState.transactions.map(sanitizeTransaction);
    },
    setAllTransactions(_state, action) {
      return action.payload;
    },
  },
});

export const {
  addTransaction,
  editTransaction,
  deleteTransaction,
  resetTransactions,
  setAllTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
