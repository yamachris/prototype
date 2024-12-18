import { StateCreator } from "zustand";
import { GameStore } from "../gameStore";
import { Card, Suit } from "../../types/game";
import { AudioManager } from "../../sound-design/audioManager";

export const createSacrificeActions: StateCreator<GameStore> = (set, get) => ({
  showSacrificePopup: false,
  availableCards: [],

  canBeSacrificed: (card: Card): boolean => {
    return !["A", "7", "10"].includes(card.value);
  },

  getEligibleCardsForSacrifice: (suit: Suit, count: number): Card[] => {
    const state = get();
    const column = state.columns[suit];
    
    if (!column || !column.cards.length) return [];

    // Trouver l'index du 7 dans la colonne
    const sevenIndex = column.cards.findIndex(card => card.value === "7");
    
    // Si un 7 est présent, ne prendre que les cartes au-dessus
    const cardsToConsider = sevenIndex !== -1 
      ? column.cards.slice(0, sevenIndex) 
      : column.cards;

    const eligibleCards = cardsToConsider
      .filter(card => get().canBeSacrificed(card))
      .sort((a, b) => {
        const valueOrder = ["2", "3", "4", "5", "6", "8", "9", "J", "Q", "K"];
        return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
      });

    return eligibleCards.slice(0, count);
  },

  setSacrificeMode: (mode: boolean) => {
    const state = get();
    
    // Si on active le mode sacrifice, récupérer toutes les cartes jouées sur le terrain
    const availableCards = mode ? Object.values(state.columns).flatMap(column => 
      column.cards.filter(card => 
        !["A", "7", "10"].includes(card.value) &&
        (state.selectedCards[0]?.value !== "J" || ["8", "9"].includes(card.value))
      )
    ) : [];

    set({
      showSacrificePopup: mode,
      availableCards
    });
  },

  sacrificeSpecialCard: (selectedCards: Card[]) => {
    const state = get();
    const specialCard = state.selectedCards[0];
    
    if (!specialCard || selectedCards.length === 0) return;

    // Vérifier le nombre de cartes requis
    const requiredCards = specialCard.value === "K" ? 3 : specialCard.value === "Q" ? 2 : 1;
    if (selectedCards.length !== requiredCards) return;

    AudioManager.getInstance().playRevolutionSound();

    set(state => {
      // Retirer les cartes sacrifiées des colonnes
      const updatedColumns = { ...state.columns };
      selectedCards.forEach(card => {
        const column = updatedColumns[card.suit];
        if (column) {
          column.cards = column.cards.filter(c => c.id !== card.id);
        }
      });

      // Pour le Roi et le Valet, ajouter la carte spéciale aux faceCards
      if (specialCard.value === "K" || specialCard.value === "J") {
        const column = updatedColumns[specialCard.suit];
        column.faceCards = {
          ...column.faceCards,
          [specialCard.value]: specialCard
        };
      }

      // Calculer le bonus de santé
      let healthBonus = specialCard.value === "Q" ? 2 : 0;

      // Retirer la carte spéciale de la main ou de la réserve
      const newHand = state.currentPlayer.hand.filter(c => c.id !== specialCard.id);
      const newReserve = state.currentPlayer.reserve.filter(c => c.id !== specialCard.id);

      // Mettre toutes les cartes sacrifiées dans la défausse
      const cardsToDiscard = [...selectedCards];
      if (specialCard.value === "Q") {
        cardsToDiscard.push(specialCard);
      }

      return {
        columns: updatedColumns,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          health: state.currentPlayer.health + healthBonus,
          maxHealth: specialCard.value === "Q" ? state.currentPlayer.maxHealth + healthBonus : state.currentPlayer.maxHealth,
          discardPile: [...state.currentPlayer.discardPile, ...cardsToDiscard]
        },
        selectedCards: [],
        showSacrificePopup: false,
        hasPlayedAction: true,
        availableCards: [], // Réinitialiser les cartes disponibles
        message: specialCard.value === "K" ? "Roi placé après sacrifice de 3 unités" :
                specialCard.value === "Q" ? "Dame sacrifiée, +2 points de vie" :
                "Valet placé après sacrifice"
      };
    });
  }
});
