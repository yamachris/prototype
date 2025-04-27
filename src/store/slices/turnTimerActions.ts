import { StateCreator } from "zustand";
import { GameStore } from "../types/store";
import { Card } from "../../types/game";
import { shuffleDeck } from "../../utils/deck";

export interface TurnTimerState {
  timeLeft: number;
  turnStartTime: number;
  isSpeedTurn: boolean;
  consecutiveTimeouts: number;
  totalTimeouts: number;
  showTimeoutPopup: boolean;
  showSpeedTurnPopup: boolean;
}

export interface TurnTimerActions {
  startTurnTimer: () => void;
  handleTimeOut: () => void;
  updateConsecutiveTimeouts: () => void;
  closeTimeoutPopup: () => void;
  closeSpeedTurnPopup: () => void;
  resetTimeoutCounter: () => void;
}

// Version désactivée - la logique est maintenant directement dans GameStore.ts
export const createTurnTimerActions: StateCreator<GameStore> = (set, get) => ({
  // État initial
  timeLeft: 30,
  turnStartTime: 0,
  isSpeedTurn: false,
  consecutiveTimeouts: 0,
  totalTimeouts: 0,
  showTimeoutPopup: false,
  showSpeedTurnPopup: false,

  // Méthodes - versions simplifiées pour éviter les conflits
  startTurnTimer: () => {
    set((state) => {
      const duration = state.isSpeedTurn ? 15 : 30;
      return {
        timeLeft: duration,
        turnStartTime: Date.now(),
        isSpeedTurn: false,
        showSpeedTurnPopup: state.isSpeedTurn,
      };
    });
  },

  // Fonction vide - la version de GameStore.ts sera utilisée
  handleTimeOut: () => {
    console.log("CETTE FONCTION NE DEVRAIT PAS ÊTRE APPELÉE - UTILISER GAMESTORE.TS");
  },

  // Fonction vide - la version de GameStore.ts sera utilisée
  updateConsecutiveTimeouts: () => {
    console.log("CETTE FONCTION NE DEVRAIT PAS ÊTRE APPELÉE - UTILISER GAMESTORE.TS");
  },

  closeTimeoutPopup: () => {
    set({ showTimeoutPopup: false });
  },

  closeSpeedTurnPopup: () => {
    set({ showSpeedTurnPopup: false });
  },

  resetTimeoutCounter: () => {
    set({ consecutiveTimeouts: 0 });
  },
});
