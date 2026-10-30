import { createSlice, nanoid } from "@reduxjs/toolkit";
import { personalChallengeError } from '../../utils/personalChallenges';
import { getLocalDateString } from '../../utils/dates';

const initialState = {
  activeChallenges: ["weekly-food", "monthly-savings"],
  claimedXP: {}, // key: `${challengeId}_${periodKey}` -> true
};

const challengesSlice = createSlice({
  name: "challenges",
  initialState,
  reducers: {
    addPersonalChallenge: {
      prepare(input) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + Number(input.days) - 1);
        return { payload: { ...input, name: input.name.trim(), id: nanoid(), start: getLocalDateString(start), end: getLocalDateString(end) } };
      },
      reducer(state, { payload }) {
        if (personalChallengeError(payload)) return;
        state.personalChallenges ??= [];
        state.personalChallenges.push(payload);
        state.activeChallenges.push(payload.id);
      },
    },
    toggleChallenge(state, action) {
      const challengeId = action.payload;
      if (state.activeChallenges.includes(challengeId)) {
        state.activeChallenges = state.activeChallenges.filter(
          (id) => id !== challengeId
        );
      } else {
        state.activeChallenges.push(challengeId);
      }
    },
    claimXP(state, action) {
      const { challengeId, periodKey } = action.payload;
      const key = `${challengeId}_${periodKey}`;
      if (state.claimedXP[key]) return;
      state.claimedXP[key] = true;
      if (action.payload.achievement) {
        state.achievements ??= {};
        state.achievements[key] = action.payload.achievement;
      }
    },
    setChallengeTarget(state, { payload: { key, value } }) {
      if (!Number.isFinite(value) || value <= 0 || state.claimedXP[key]) return;
      state.targets ??= {};
      state.targets[key] = value;
    },
    confirmNoSpend(state, { payload: date }) {
      state.confirmedDays ??= [];
      if (!state.confirmedDays.includes(date)) state.confirmedDays.push(date);
    },
    undoNoSpend(state, { payload: date }) {
      state.confirmedDays = (state.confirmedDays || []).filter((day) => day !== date);
    },
    startPurchasePause(state, { payload }) {
      if (![1, 3, 7, 14, 30].includes(payload.days) || !payload.itemId || !Number.isFinite(Date.parse(payload.startedAt))) return;
      state.purchasePauses ??= {};
      if (!state.purchasePauses[payload.itemId]) state.purchasePauses[payload.itemId] = payload;
    },
    setAllChallenges(_state, action) {
      return action.payload;
    },
  },
});

export const {
  addPersonalChallenge,
  toggleChallenge,
  claimXP,
  setChallengeTarget,
  confirmNoSpend,
  undoNoSpend,
  startPurchasePause,
  setAllChallenges,
} = challengesSlice.actions;

export default challengesSlice.reducer;
