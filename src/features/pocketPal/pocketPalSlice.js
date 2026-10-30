import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
};

const pocketPalSlice = createSlice({
  name: "pocketPal",
  initialState,
  reducers: {
    addMessage(state, action) {
      // payload: { id, text, sender: 'user'|'bot', timestamp }
      state.messages.push({
        id: action.payload.id || `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text: action.payload.text,
        sender: action.payload.sender,
        timestamp: action.payload.timestamp || new Date().toISOString(),
      });
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
});

export const { addMessage, clearMessages } = pocketPalSlice.actions;

export default pocketPalSlice.reducer;
