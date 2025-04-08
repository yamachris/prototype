import { StateCreator } from "zustand";
import { GameStore } from "../types/store";
import { Suit, Card } from "../../types/game";

export const createColumnActions = (set) => ({
  handleCardPlace: (suit: Suit, position: number) => {
    set((state: GameStore) => {
      const column = state.columns[suit];

      // Activation avec As + Joker
      if (state.selectedCards.length === 2) {
        const [card1, card2] = state.selectedCards;
        const ace = card1.value === "A" ? card1 : card2;
        const joker = card1.type === "JOKER" ? card1 : card2;

        if (ace.value === "A" && joker.type === "JOKER" && ace.suit === suit) {
          const newHand = state.currentPlayer.hand.filter(
            (c: Card) => !state.selectedCards.some((s: Card) => s.id === c.id)
          );
          const newReserve = state.currentPlayer.reserve.filter(
            (c: Card) => !state.selectedCards.some((s: Card) => s.id === c.id)
          );

          return {
            ...state,
            columns: {
              ...state.columns,
              [suit]: {
                ...column,
                hasLuckyCard: true,
                cards: [ace],
                reserveSuit: joker,
                activatorType: "JOKER",
              },
            },
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
            },
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 2,
            message: `Colonne ${suit} activée avec As et Joker`,
          };
        }
      }

      return state;
    });
  },
});
