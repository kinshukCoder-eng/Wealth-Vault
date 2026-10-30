import { createSlice } from "@reduxjs/toolkit";
import { demoState } from "../../data/demoData";
import { sanitizeVaultItem } from "../../utils/persistence";

const initialVault = demoState.vault.map(sanitizeVaultItem);

const vaultSlice = createSlice({
  name: "vault",
  initialState: initialVault,
  reducers: {
    addVaultItem: {
      prepare(item) {
        return {
          payload: {
            ...sanitizeVaultItem(item),
            id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            date: item.date || new Date().toISOString(),
          },
        };
      },
      reducer(state, action) {
        state.unshift(action.payload);
      },
    },
    editVaultItem(state, action) {
      const index = state.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) {
        state[index] = {
          ...state[index],
          name: action.payload.name || state[index].name,
          amount: Math.abs(Number(action.payload.amount) || state[index].amount),
        };
      }
    },
    deleteVaultItem(state, action) {
      return state.filter((v) => v.id !== action.payload);
    },
    setAllVault(_state, action) {
      return action.payload;
    },
  },
});

export const {
  addVaultItem,
  editVaultItem,
  deleteVaultItem,
  setAllVault,
} = vaultSlice.actions;

export default vaultSlice.reducer;
