import { Card, Suit } from "../../types/game";
import { GameStore } from "../gameStore";

// Vérifie si une attaque est bloquée par le Roi
export function isAttackBlockedByKing(attackingCard: Card, defendingKing: Card): boolean {
  // Vérifie si la carte est de la même enseigne et si elle est inférieure ou égale à 6
  if (attackingCard.suit === defendingKing.suit) {
    const blockedValues = ["A", "2", "3", "4", "5", "6"];
    return blockedValues.includes(attackingCard.value);
  }
  return false;
}

// Vérifie si le Roi est battu par une carte autorisée
export function isKingDefeated(attackingCard: Card, defendingKing: Card): boolean {
  const defeatingValues = ["8", "9"];
  return (
    (attackingCard.suit === defendingKing.suit && defeatingValues.includes(attackingCard.value)) ||
    attackingCard.type === "joker"
  );
}

// Met à jour le GameStore lorsque le Roi est battu
export function handleKingDefeat(state: GameStore, attackingCard: Card, defendingKing: Card) {
  // Retire le Roi du terrain
  const updatedColumns = { ...state.columns };
  const column = updatedColumns[defendingKing.suit];
  
  if (column && column.faceCards) {
    // Supprimer le Roi des faceCards
    const { K, ...restFaceCards } = column.faceCards;
    column.faceCards = restFaceCards;

    // Ajouter le Roi à la défausse du joueur courant
    return {
      ...state,
      columns: updatedColumns,
      currentPlayer: {
        ...state.currentPlayer,
        discardPile: [...state.currentPlayer.discardPile, defendingKing]
      },
      message: `Le Roi de ${defendingKing.suit} a été vaincu par ${attackingCard.type === "joker" ? "le Joker" : attackingCard.value} !`,
      hasPlayedAction: true,
      canEndTurn: true,
      playedCardsLastTurn: 1
    };
  }

  return state;
}

// Crée les actions liées à la défense du Roi
export const createKingDefenseActions = (set: any, get: any) => ({
  handleAttackWithKing: (attackingCard: Card, targetSuit: Suit) => {
    const state = get();
    const defendingKing = state.columns[targetSuit]?.faceCards?.K;

    if (!defendingKing) {
      return false; // Pas de Roi présent, l'attaque continue normalement
    }

    // Vérifier si le Roi bloque l'attaque
    if (isAttackBlockedByKing(attackingCard, defendingKing)) {
      set({
        message: `Attaque bloquée par le Roi de ${defendingKing.suit}!`,
        hasPlayedAction: true,
        canEndTurn: true,
        playedCardsLastTurn: 1
      });
      return true; // Attaque bloquée
    }

    // Vérifier si le Roi est vaincu
    if (isKingDefeated(attackingCard, defendingKing)) {
      set(handleKingDefeat(state, attackingCard, defendingKing));
      return true; // Roi vaincu
    }

    return false; // L'attaque continue normalement
  }
});
