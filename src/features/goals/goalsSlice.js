import { createSlice } from "@reduxjs/toolkit";
import { demoState } from "../../data/demoData";
import { migrateGoal } from "../../utils/persistence";

const initialGoals = demoState.goals.map(migrateGoal);

const goalsSlice = createSlice({
  name: "goals",
  initialState: initialGoals,
  reducers: {
    addGoal: {
      prepare(goal) {
        return {
          payload: {
            ...migrateGoal(goal),
            id: `g_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            initialSaved: 0,
            contributions: [],
          },
        };
      },
      reducer(state, action) {
        state.unshift(action.payload);
      },
    },
    editGoal(state, action) {
      const index = state.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        const existing = state[index];
        state[index] = {
          ...existing,
          name: action.payload.name ?? existing.name,
          target: Number(action.payload.target) || existing.target,
          monthly: action.payload.monthly !== undefined ? Number(action.payload.monthly) : existing.monthly,
          emoji: action.payload.emoji || existing.emoji,
        };
      }
    },
    deleteGoal(state, action) {
      return state.filter((g) => g.id !== action.payload);
    },
    reorderGoal(state, action) {
      const { sourceId, targetId } = action.payload;
      const sourceIndex = state.findIndex((goal) => goal.id === sourceId);
      const targetIndex = state.findIndex((goal) => goal.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        return;
      }

      const [movedGoal] = state.splice(sourceIndex, 1);
      state.splice(targetIndex, 0, movedGoal);
    },
    addContribution: {
      prepare({ goalId, amount, date, note = "" }) {
        return {
          payload: {
            goalId,
            contribution: {
              id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              amount: Math.abs(Number(amount) || 0),
              date: date || new Date().toISOString().slice(0, 10),
              note: note.trim(),
            },
          },
        };
      },
      reducer(state, action) {
        const goal = state.find((g) => g.id === action.payload.goalId);
        if (goal) {
          if (!Array.isArray(goal.contributions)) {
            goal.contributions = [];
          }
          goal.contributions.unshift(action.payload.contribution);
        }
      },
    },
    deleteContribution(state, action) {
      const { goalId, contributionId } = action.payload;
      const goal = state.find((g) => g.id === goalId);
      if (goal && Array.isArray(goal.contributions)) {
        goal.contributions = goal.contributions.filter(
          (c) => c.id !== contributionId
        );
      }
    },
    setAllGoals(_state, action) {
      return action.payload;
    },
  },
});

export const {
  addGoal,
  editGoal,
  deleteGoal,
  reorderGoal,
  addContribution,
  deleteContribution,
  setAllGoals,
} = goalsSlice.actions;

export default goalsSlice.reducer;
