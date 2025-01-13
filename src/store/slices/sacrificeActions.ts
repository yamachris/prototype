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
    const sevenIndex = column.cards.findIndex((card) => card.value === "7");

    // Si un 7 est présent, ne prendre que les cartes au-dessus
    const cardsToConsider = sevenIndex !== -1 ? column.cards.slice(0, sevenIndex) : column.cards;

    const eligibleCards = cardsToConsider
      .filter((card) => get().canBeSacrificed(card))
      .sort((a, b) => {
        const valueOrder = ["2", "3", "4", "5", "6", "8", "9", "J", "Q", "K"];
        return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
      });

    return eligibleCards.slice(0, count);
  },

  setSacrificeMode: (mode: boolean) => {
    const state = get();
    const selectedCard = state.selectedCards[0];

    if (!mode || !selectedCard) {
      set({
        showSacrificePopup: false,
        availableCards: [],
        selectedSacrificeCards: []
      });
      return;
    }

    // Récupérer toutes les cartes jouées sur le terrain
    const availableCards = Object.values(state.columns)
      .filter(column => {
        // Vérifier si la colonne existe et a des cartes
        if (!column || !column.cards || column.cards.length === 0) return false;
        
        return true;
      })
      .flatMap(column => {
        const cards = column.cards.filter((card, index) => {
          // Ne jamais permettre le sacrifice du 10
          if (card.value === '10') return false;

          // Ne pas permettre le sacrifice si la colonne a 10 cartes (il faut d'abord sacrifier la plus haute)
          if (column.cards.length >= 10) {
            // On ne permet que le sacrifice de la carte la plus haute
            return index === column.cards.length - 1;
          }

          // Vérifier si un Joker est présent au-dessus de cette carte
          const hasJokerAbove = column.cards.some((c, i) => 
            i > index && c.type === 'joker'
          );

          // Ne pas permettre le sacrifice si un Joker est présent au-dessus
          if (hasJokerAbove) return false;

          // Pour le Valet, uniquement 8 ou 9
          if (selectedCard.value === 'J') {
            return ['8', '9'].includes(card.value);
          }
          
          // Pour les autres cartes, exclure A, 7, 10
          return !['A', '7', '10'].includes(card.value);
        });

        // Trier les cartes par valeur décroissante
        return cards.sort((a, b) => {
          const valueOrder = ['2', '3', '4', '5', '6', '8', '9', 'J', 'Q', 'K'];
          return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
        });
      });

    set({
      showSacrificePopup: mode,
      availableCards,
      selectedSacrificeCards: []
    });
  },

  performSacrifice: (selectedCards: Card[]) => {
    const state = get();
    const specialCard = state.selectedCards[0];

    if (!specialCard || selectedCards.length === 0) return;

    // Vérifier le nombre de cartes requis
    const requiredCards = specialCard.value === "K" ? 3 : specialCard.value === "Q" ? 2 : 1;
    if (selectedCards.length !== requiredCards) return;

    const result = get().sacrificeSpecialCard(selectedCards);

    // Si le sacrifice a réussi, piocher automatiquement si nécessaire
    if (result) {
      const totalCards = result.currentPlayer.hand.length + result.currentPlayer.reserve.length;
      if (totalCards < 7) {
        const [remainingDeck, drawnCards] = drawCards(result.deck, 1);
        set({
          deck: remainingDeck,
          currentPlayer: {
            ...result.currentPlayer,
            hand: [...result.currentPlayer.hand, ...drawnCards],
          },
          message: `${result.message} Vous avez pioché une carte pour compléter votre main.`,
        });
      }
    }
  },

  sacrificeSpecialCard: (selectedCards: Card[]) => {
    const state = get();
    const specialCard = state.selectedCards[0];

    if (!specialCard || selectedCards.length === 0) return;

    // Vérifier le nombre de cartes requis
    const requiredCards = specialCard.value === "K" ? 3 : specialCard.value === "Q" ? 2 : 1;
    if (selectedCards.length !== requiredCards) return;

    // AudioManager.getInstance().playRevolutionSound();  // Retirer le son de révolution

    set((state) => {
      // Retirer les cartes sacrifiées des colonnes
      const updatedColumns = { ...state.columns };
      selectedCards.forEach((card) => {
        const column = updatedColumns[card.suit];
        if (column) {
          // Garder l'état hasLuckyCard, reserveSuit et activatorType tout en retirant la carte
          const newCards = column.cards.filter((c) => c.id !== card.id);
          column.cards = newCards;
          // Préserver l'état d'activation de la colonne
          column.hasLuckyCard = column.hasLuckyCard;
          column.reserveSuit = column.reserveSuit;
          column.activatorType = column.activatorType;
        }
      });

      // Pour le Roi et le Valet, ajouter la carte spéciale aux faceCards
      if (specialCard.value === "K" || specialCard.value === "J") {
        const column = updatedColumns[specialCard.suit];
        column.faceCards = {
          ...column.faceCards,
          [specialCard.value]: { ...specialCard, activatedBy: "sacrifice" },
        };
      }

      // Calculer le bonus de santé
      let healthBonus = specialCard.value === "Q" ? 2 : 0;

      // Jouer les sons appropriés
      if (healthBonus > 0) {
        // Pour la Dame, jouer le son de sacrifice suivi du son de soin
        AudioManager.getInstance().playSacrificeWithHealSound();
      } else {
        // Pour les autres cartes, jouer uniquement le son de sacrifice
        AudioManager.getInstance().playSacrificeSound();
      }

      // Retirer la carte spéciale de la main ou de la réserve
      const newHand = state.currentPlayer.hand.filter((c) => c.id !== specialCard.id);
      const newReserve = state.currentPlayer.reserve.filter((c) => c.id !== specialCard.id);

      // Mettre toutes les cartes sacrifiées dans la défausse
      const cardsToDiscard = [...selectedCards];
      if (specialCard.value === "Q") {
        cardsToDiscard.push(specialCard);
      }

      // Construire le message final
      const actionMessage =
        specialCard.value === "K"
          ? "Roi placé après sacrifice de 3 unités"
          : specialCard.value === "Q"
          ? "Dame sacrifiée, +2 points de vie"
          : "Valet placé après sacrifice";
      const message = `${actionMessage}. Cliquez sur 'Fin du tour' pour continuer.`;

      return {
        columns: updatedColumns,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          health: state.currentPlayer.health + healthBonus,
          maxHealth:
            specialCard.value === "Q" ? state.currentPlayer.maxHealth + healthBonus : state.currentPlayer.maxHealth,
          discardPile: [...state.currentPlayer.discardPile, ...cardsToDiscard],
        },
        selectedCards: [],
        showSacrificePopup: false,
        hasPlayedAction: true,
        playedCardsLastTurn: 1,
        availableCards: [],
        message,
        canEndTurn: true,
      };
    });
  },
});
