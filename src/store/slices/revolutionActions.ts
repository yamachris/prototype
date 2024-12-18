import { StateCreator } from "zustand";
import { GameStore } from "../gameStore";
import { Suit, initialAttackButtons } from "../../types/game";
import { AudioManager } from "../../sound-design/audioManager";

export const createRevolutionActions: StateCreator<GameStore> = (set) => ({
  checkRevolution: (suit: Suit) => {
    set((state: GameStore) => {
      const column = state.columns[suit];

      // Vérifie si la colonne est complète (10 cartes)
      if (column.cards.length === 10) {
        // Jouer le son de révolution
        const audioManager = AudioManager.getInstance();
        audioManager.playRevolutionSound();

        // Récupérer la carte de reserveSuit si elle existe
        const reserveSuitCard = column.reserveSuit;

        // Séparer les cartes face (valet et roi) des autres cartes
        const faceCards = column.cards.filter((card) => card.value === "J" || card.value === "K");

        // Ne défausser que les cartes qui ne sont pas des valets ou des rois
        const cardsToDiscard = column.cards.filter((card) => card.value !== "J" && card.value !== "K");

        // Ajouter l'activateur à la défausse si présent
        if (reserveSuitCard) {
          cardsToDiscard.push(reserveSuitCard);
        }

        // Réinitialise la colonne mais garde les cartes face
        const updatedColumn = {
          ...column,
          cards: faceCards, // Garde les valets et les rois dans la colonne
          isLocked: false,
          hasLuckyCard: false,
          activatorType: null,
          sequence: [],
          reserveSuit: null,
          isReserveSuitLocked: false, // S'assure que la colonne n'est pas verrouillée
          faceCards: column.faceCards, // Préserve les cartes face existantes
          attackStatus: {
            attackButtons: initialAttackButtons,
          },
        };

        // Met à jour l'état du jeu
        return {
          ...state,
          columns: {
            ...state.columns,
            [suit]: updatedColumn,
          },
          currentPlayer: {
            ...state.currentPlayer,
            discardPile: [...state.currentPlayer.discardPile, ...cardsToDiscard],
          },
          playedCardsLastTurn: 1,

          nextPhase: state.currentPlayer.hand.length + state.currentPlayer.reserve.length === 7 ? "discard" : state.phase,
          message: "🎉 RÉVOLUTION ! La colonne a été réinitialisée et peut être réactivée.",
          showRevolutionPopup: true,
          hasPlayedAction: true,
        };
      }

      return state;
    });
  },
});
