"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Achievement = { id: string; label: string; unlockedAt: number };
export type LocalScores = Record<string, number>;

export type PreferencesState = {
  playerId: string;
  playerName: string;
  favoriteCategory: string;
  scores: LocalScores;
  achievements: Achievement[];
};

const initialState: PreferencesState = {
  playerId: "",
  playerName: "Neon Player",
  favoriteCategory: "All",
  scores: {},
  achievements: [],
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    hydrate: (_state, action: PayloadAction<PreferencesState>) => action.payload,
    setPlayerName: (state, action: PayloadAction<string>) => {
      state.playerName = action.payload.trim() || "Neon Player";
    },
    ensurePlayerId: (state, action: PayloadAction<string>) => {
      if (!state.playerId) state.playerId = action.payload;
    },
    setFavoriteCategory: (state, action: PayloadAction<string>) => {
      state.favoriteCategory = action.payload;
    },
    recordScore: (state, action: PayloadAction<{ game: string; score: number }>) => {
      state.scores[action.payload.game] = Math.max(state.scores[action.payload.game] ?? 0, action.payload.score);
    },
    unlockAchievement: (state, action: PayloadAction<{ id: string; label: string }>) => {
      if (!state.achievements.some((item) => item.id === action.payload.id)) {
        state.achievements.push({ ...action.payload, unlockedAt: Date.now() });
      }
    },
  },
});

export const { hydrate, setPlayerName, ensurePlayerId, setFavoriteCategory, recordScore, unlockAchievement } = preferencesSlice.actions;
export default preferencesSlice.reducer;
