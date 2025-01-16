// Importation des dépendances nécessaires
import { create } from "zustand"; // Zustand est utilisé pour la gestion d'état
import { Card, Player, Phase, Suit, ColumnState, initialAttackButtons } from "../types/game";
import { Card as CardType } from "../types/game";
import { createDeck, drawCards, shuffleDeck } from "../utils/deck";
import i18next from "i18next"; 
import { AudioManager } from "../sound-design/audioManager";
import { handleCardPlacement, handleJokerAction as handleJokerEffect, distributeCards } from "../utils/gameLogic";
import i18n from "../i18n/config";
import { Columns } from "lucide-react";
import { attackCardButton } from "../types/game";

// Interface définissant la structure de l'état du jeu
interface GameState {
  currentPlayer: Player; // Joueur actuel
  deck: Card[]; // Paquet de cartes
  phase: Phase; // Phase actuelle du jeu
  turn: number; // Numéro du tour
  selectedCards: Card[]; // Cartes sélectionnées
  selectedSacrificeCards: Card[];
  columns: Record<Suit, ColumnState>; // État des colonnes par couleur
  hasDiscarded: boolean; // Indique si le joueur a défaussé
  hasDrawn: boolean; // Indique si le joueur a pioché
  hasPlayedAction: boolean; // Indique si le joueur a joué une action
  isGameOver: boolean; // Indique si la partie est terminée
  playedCardsLastTurn: number; // Nombre de cartes jouées au dernier tour
  attackMode: boolean;
  message: string;
  hasUsedFirstStrategicShuffle: boolean;
  awaitingStrategicShuffleConfirmation: boolean;
  language: string;
  winner: string | null;
  canEndTurn: boolean;
  queenChallenge: {
    isActive: boolean;
    queen: Card | null;
  };
  isMessageClickable: boolean;
  exchangeMode: boolean;
  selectedForExchange: Card | null;
  nextPhase?: Phase; // Nouveau champ pour stocker la phase suivante
  showRevolutionPopup: boolean;
  blockableColumns: number[];
  canBlock: boolean;
  blockedColumns: number[]; // Indices des colonnes qui ont été bloquées
  showSacrificePopup: boolean;
  showJokerExchangePopup: boolean;
  sacrificeInfo: null;
  availableCards: Card[];
}

// Ajout du type pour le store complet
export interface GameStore extends GameState {
  selectCard: (card: CardType) => void;
  handleDiscard: (card: CardType) => void;
  handleDrawCard: () => void;
  exchangeCards: (card1: CardType, card2: CardType) => void;
  handleJokerAction: (jokerCard: CardType, action: "heal" | "attack") => void;
  setAttackMode: (mode: boolean) => void;
  setMessage: (message: string) => void;
  handleStrategicShuffle: () => void;
  endTurn: () => void;
  setPhase: (phase: Phase) => void;
  canUseStrategicShuffle: () => boolean;
  confirmStrategicShuffle: () => void;
  getState: () => GameStore;
  handleCardPlace: (suit: Suit, position: number) => void;
  handleQueenChallenge: (isCorrect: boolean) => void;
  handleCardExchange: (columnCard: Card, playerCard: Card) => void;
  getPhaseMessage: (
    phase: Phase,
    hasDiscarded: boolean,
    hasDrawn: boolean,
    hasPlayedAction: boolean,
    playedCardsLastTurn: number
  ) => string;
  checkRevolution: (suit: Suit) => void;
  handleAttack: (card: Card | string) => void;
  activateCardAttackButton: (card: Card) => void;
  handleBlock: (columnIndex: number) => void;
  resetBlockedColumns: () => void;
  handleDestroyColumn: (columnIndex: number) => void;
  handleRevolution: () => void;
  handleSacrifice: (suit: Suit, specialCard: Card) => void;
  setSelectedSacrificeCards: (cards: Card[]) => void;
  handleActivatorExchange: (columnCard: Card, playerCard: Card) => void;
  handleJokerExchange: (selectedCard: Card) => void;
  displayJokerExchangePopup: (availableCards: Card[]) => void;
  closeJokerExchangePopup: () => void;
  setSelectedJokerExchangeCards: (cards: Card[]) => void;
}

// Création du store avec Zustand
export const useGameStore = create<GameStore>((set, get) => ({
  // État initial du jeu
  currentPlayer: {
    id: "player-1",
    name: "Joueur 1",
    health: 10,
    maxHealth: 10,
    hand: [],
    reserve: [],
    discardPile: [],
    deck: [],
    hasUsedStrategicShuffle: false,
    profile: {
      epithet: "Maître des Cartes",
    },
  },
  selectedSacrificeCards: [],
  deck: [],
  phase: "setup" as Phase,
  turn: 1,
  selectedCards: [],
  columns: {
    hearts: {
      cards: [],
      isLocked: false,
      hasLuckyCard: false,
      activatorType: null,
      sequence: [],
      reserveSuit: null,
      isReserveSuitLocked: false,
      faceCards: {},
      attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
    },
    diamonds: {
      cards: [],
      isLocked: false,
      hasLuckyCard: false,
      activatorType: null,
      sequence: [],
      reserveSuit: null,
      isReserveSuitLocked: false,
      faceCards: {},
      attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
    },
    clubs: {
      cards: [],
      isLocked: false,
      hasLuckyCard: false,
      activatorType: null,
      sequence: [],
      reserveSuit: null,
      isReserveSuitLocked: false,
      faceCards: {},
      attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
    },
    spades: {
      cards: [],
      isLocked: false,
      hasLuckyCard: false,
      activatorType: null,
      sequence: [],
      reserveSuit: null,
      isReserveSuitLocked: false,
      faceCards: {},
      attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
    },
  },
  hasDiscarded: false,
  hasDrawn: false,
  hasPlayedAction: false,
  playedCardsLastTurn: 0,
  attackMode: false,
  message: "",
  isGameOver: false,
  winner: null as string | null,
  canEndTurn: true,
  language: i18n.language || "fr",
  queenChallenge: {
    isActive: false,
    queen: null,
  },
  isMessageClickable: false,
  exchangeMode: false,
  selectedForExchange: null,
  nextPhase: undefined, // Nouveau champ pour stocker la phase suivante
  showRevolutionPopup: false,
  blockableColumns: [],
  canBlock: false,
  blockedColumns: [],
  showSacrificePopup: false,
  showJokerExchangePopup: false,
  sacrificeInfo: null,
  ...createColumnActions(set),
  ...createRevolutionActions(set, get),
  ...createSacrificeActions(set, get),
  ...createKingDefenseActions(set, get), // Intégrer les actions du Roi

  initializeGame: () => {
    // Création et mélange du deck complet
    const fullDeck = shuffleDeck(createDeck());

    // Distribution aléatoire de 7 cartes
    const [remainingDeck, initialHand] = drawCards(fullDeck, 7);

    set({
      currentPlayer: {
        id: "player-1",
        name: "Joueur 1",
        health: 10,
        maxHealth: 10,
        hand: initialHand,
        reserve: [],
        discardPile: [],
        deck: remainingDeck,
        hasUsedStrategicShuffle: false,
        profile: {
          epithet: "Maître des Cartes",
        },
      },
      deck: remainingDeck,
      phase: "setup",
      turn: 1,
      selectedCards: [],
      columns: {
        hearts: {
          cards: [],
          isLocked: false,
          hasLuckyCard: false,
          activatorType: null,
          sequence: [],
          reserveSuit: null,
          isReserveSuitLocked: false,
          faceCards: {},
          attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
        },
        diamonds: {
          cards: [],
          isLocked: false,
          hasLuckyCard: false,
          activatorType: null,
          sequence: [],
          reserveSuit: null,
          isReserveSuitLocked: false,
          faceCards: {},
          attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
        },
        clubs: {
          cards: [],
          isLocked: false,
          hasLuckyCard: false,
          activatorType: null,
          sequence: [],
          reserveSuit: null,
          isReserveSuitLocked: false,
          faceCards: {},
          attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
        },
        spades: {
          cards: [],
          isLocked: false,
          hasLuckyCard: false,
          activatorType: null,
          sequence: [],
          reserveSuit: null,
          isReserveSuitLocked: false,
          faceCards: {},
          attackStatus: { attackButtons: initialAttackButtons, lastAttackCard: {} },
        },
      },
      hasDiscarded: false,
      hasDrawn: false,
      hasPlayedAction: false,
      playedCardsLastTurn: 0,
      attackMode: false,
      message: "",
      isGameOver: false,
      winner: null,
      canEndTurn: true,
      hasUsedFirstStrategicShuffle: false,
      awaitingStrategicShuffleConfirmation: false,
      queenChallenge: {
        isActive: false,
        queen: null,
      },
      isMessageClickable: false,
      exchangeMode: false,
      selectedForExchange: null,
      showRevolutionPopup: false,
      blockableColumns: [],
      canBlock: false,
      blockedColumns: [],
    });
  },

  selectCard: (card: Card) => {
    set((state) => {
      // Si une action a déjà été jouée, on ne peut plus sélectionner de cartes
      if (state.hasPlayedAction) return state;

      const isCardSelected = state.selectedCards.some((c) => c.id === card.id);

      // Si la carte est déjà sélectionnée, on la désélectionne
      if (isCardSelected) {
        return {
          ...state,
          selectedCards: state.selectedCards.filter((c) => c.id !== card.id),
          message: "",
        };
      }

      // Si on a déjà 2 cartes sélectionnées, on ne peut pas en sélectionner plus
      if (state.selectedCards.length >= 2) {
        return state;
      }

      // Sélection de la carte
      const newSelectedCards = [...state.selectedCards, card];
      let message = "";

      // Messages selon la combinaison
      if (newSelectedCards.length === 1) {
        if (card.value === "A") {
          message = "Sélectionnez un Joker ou un 7 pour activer la colonne";
        } else if (card.type === "joker" || card.value === "7") {
          message = "Sélectionnez un As pour activer une colonne";
        }
      } else if (newSelectedCards.length === 2) {
        const [card1, card2] = newSelectedCards;
        const hasAs = card1.value === "A" || card2.value === "A";
        const hasActivator =
          card1.type === "joker" || card1.value === "7" || card2.type === "joker" || card2.value === "7";

        if (hasAs && hasActivator) {
          message = "Cliquez sur une colonne pour l'activer";
        }
      }

      return {
        ...state,
        selectedCards: newSelectedCards,
        message,
      };
    });
  },

  handleJokerAction: (jokerCard: Card, action: "heal" | "attack") => {
    set((state) => {
      if (jokerCard.type !== "joker" || state.hasPlayedAction || state.phase !== "action") {
        return state;
      }

      let updatedPlayer = { ...state.currentPlayer };

      if (action === "heal") {
        // Jouer le son de soin
        AudioManager.getInstance().playHealSound();

        // Augmente les PV max et actuels de 3
        const newHealth = updatedPlayer.health + 3;
        updatedPlayer.maxHealth = newHealth;
        updatedPlayer.health = newHealth;

        // Déplace le Joker vers la défausse
        updatedPlayer.hand = updatedPlayer.hand.filter((c) => c.id !== jokerCard.id);
        updatedPlayer.reserve = updatedPlayer.reserve.filter((c) => c.id !== jokerCard.id);
        updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];

        return {
          ...state,
          currentPlayer: updatedPlayer,
          hasPlayedAction: true,
          selectedCards: [],
          playedCardsLastTurn: 1,
          message: `🎭 Joker : PV augmentés à ${newHealth}/${newHealth}`,
          canEndTurn: true,
          phase: "action",
        };
      } else if (action === "attack") {
        // Simule une attaque en mode solo
        updatedPlayer.hand = updatedPlayer.hand.filter((c) => c.id !== jokerCard.id);
        updatedPlayer.reserve = updatedPlayer.reserve.filter((c) => c.id !== jokerCard.id);
        updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];

        return {
          ...state,
          currentPlayer: updatedPlayer,
          hasPlayedAction: true,
          selectedCards: [],
          playedCardsLastTurn: 1,
          message: "🗡️ Le Joker a détruit une carte adverse !",
          canEndTurn: true,
          phase: "action",
        };
      }

      return state;
    });
  },

  handleDrawCard: () => {
    set((state) => {
      if (state.phase !== "draw" || state.hasDrawn) return state;

      // Calculer combien de cartes manquent pour compléter la main et la réserve
      const currentHandCount = state.currentPlayer.hand.length;
      const currentReserveCount = state.currentPlayer.reserve.length;
      const maxHandCards = 5;
      const maxReserveCards = 2;

      // Calculer combien de cartes on peut ajouter
      const handSpace = Math.max(0, maxHandCards - currentHandCount);
      const reserveSpace = Math.max(0, maxReserveCards - currentReserveCount);
      const cardsNeeded = handSpace + reserveSpace;

      // Si on a déjà le maximum de cartes
      if (cardsNeeded <= 0) {
        return {
          ...state,
          phase: "action",
          hasDrawn: true,
          message: i18next.t("game.messages.actionPhase"),
        };
      }

      // Jouer le son de pioche
      AudioManager.getInstance().playDrawSound();

      // Piocher les cartes nécessaires
      const [newDeck, drawnCards] = drawCards(state.deck, cardsNeeded);

      // Distribuer les cartes en priorité à la main
      const newHand = [...state.currentPlayer.hand];
      const newReserve = [...state.currentPlayer.reserve];

      drawnCards.forEach((card) => {
        if (newHand.length < maxHandCards) {
          newHand.push(card);
        } else if (newReserve.length < maxReserveCards) {
          newReserve.push(card);
        }
      });

      return {
        ...state,
        deck: newDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
        },
        phase: "action",
        hasDrawn: true,
        message: i18next.t("game.messages.actionPhase"),
      };
    });
  },

  handlePassTurn: () => {
    set((state) => {
      // On ne peut passer le tour que si on est en phase d'action et qu'on a soit joué une action soit passé
      if (state.phase !== "action" || !state.hasPlayedAction) {
        return state;
      }

      const nextPhase = state.currentPlayer.reserve.length + state.currentPlayer.hand.length !== 7 ? "draw" : "discard";
      console.log("nextPhase ", nextPhase);

      // Si on a joué des cartes au tour précédent, on passe directement à la phase de pioche
      // if (state.playedCardsLastTurn > 0) {
      //   return {
      //     ...state,
      //     phase: "draw", // On passe directement à la pioche
      //     hasDiscarded: true, // On marque la défausse comme déjà faite
      //     hasDrawn: false,
      //     hasPlayedAction: false,
      //     currentPlayer: {
      //       ...state.currentPlayer,
      //       hasUsedStrategicShuffle: false,
      //     },
      //     selectedCards: [],
      //     turn: state.turn + 1,
      //     message: i18next.t("game.messages.drawPhase"),
      //     canBlock: false,
      //     blockableColumns: [],
      //   };
      // }

      // Si on n'a pas joué de cartes

      return {
        ...state,
        phase: nextPhase,
        // hasDiscarded: false,
        hasDiscarded: nextPhase === "discard" ? false : true,

        hasDrawn: false,
        hasPlayedAction: false,
        currentPlayer: {
          ...state.currentPlayer,
          hasUsedStrategicShuffle: false,
        },
        selectedCards: [],
        turn: state.turn + 1,
        // message: i18next.t("game.messages.discardPhase"),
        message: nextPhase === "discard" ? i18next.t("game.messages.discardPhase") : i18next.t("game.messages.drawPhase"),

        canBlock: false,
        blockableColumns: [],
      };
    });
  },
  // Méthodes de gestion des cartes :

  handleSkipAction: () => {
    set((state) => {
      if (state.phase !== "action" || state.hasPlayedAction) {
        return state;
      }

      return {
        ...state,
        hasPlayedAction: true,
        canEndTurn: true,
        playedCardsLastTurn: 0,
        message: "Action passée",
      };
    });
  },

  handleSurrender: () => {
    set((state) => ({
      ...state,
      isGameOver: true,
      winner: "opponent",
      message: "Vous avez abandonné la partie",
    }));
  },

  moveToReserve: (card: Card) => {
    // Gère le déplacement d'une carte vers la réserve
    set((state) => {
      const updatedReserve = [...state.currentPlayer.reserve, card];
      return {
        currentPlayer: {
          ...state.currentPlayer,
          reserve: updatedReserve,
          hand: state.currentPlayer.hand.filter((c) => c.id !== card.id),
        },
      };
    });
  },

  moveToHand: (card) => {
    // Gère le déplacement d'une carte vers la main
    set((state) => {
      if (state.currentPlayer.hand.length >= 5) return state;

      return {
        currentPlayer: {
          ...state.currentPlayer,
          reserve: state.currentPlayer.reserve.filter((c) => c.id !== card.id),
          hand: [...state.currentPlayer.hand, card],
        },
      };
    });
  },

  startGame: () => {
    set((state) => {
      if (state.currentPlayer.reserve.length !== 2) return state;
      return {
        ...state,
        phase: "discard",
        hasDiscarded: false,
        hasDrawn: false,
        hasPlayedAction: false,
        hasUsedFirstStrategicShuffle: false,
        message: i18next.t("game.messages.strategicShuffleFirst"),
      };
    });
  },

  handleDiscard: (card: Card) => {
    set((state) => {
      // On vérifie d'abord si on a plus de 6 cartes
      const totalCards = state.currentPlayer.hand.length + state.currentPlayer.reserve.length;
      if (totalCards <= 6) {
        // Si on a 6 cartes ou moins, on passe directement à la phase de pioche
        return {
          ...state,
          phase: "draw",
          hasDiscarded: false,
          message: i18next.t("game.messages.drawPhase"),
        };
      }

      // Sinon, on procède à la défausse normalement
      if (state.phase !== "discard" || state.hasDiscarded) {
        return state;
      }

      const isFromHand = state.currentPlayer.hand.some((c) => c.id === card.id);
      const isFromReserve = state.currentPlayer.reserve.some((c) => c.id === card.id);

      const newHand = isFromHand
        ? state.currentPlayer.hand.filter((c) => c.id !== card.id)
        : [...state.currentPlayer.hand];

      const newReserve = isFromReserve
        ? state.currentPlayer.reserve.filter((c) => c.id !== card.id)
        : [...state.currentPlayer.reserve];

      const newDiscardPile = [...state.currentPlayer.discardPile, card];

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          discardPile: newDiscardPile,
        },
        hasDiscarded: true,
        selectedCards: [],
        phase: "draw",
        message: i18next.t("game.messages.drawPhase"),
      };
    });
  },

  recycleDiscardPile: () => {
    // Récupère les cartes de la défausse pour remplir le deck
    set((state) => {
      if (state.deck.length > 0 || state.currentPlayer.discardPile.length === 0) return state;

      // Jouer le son de mélange
      AudioManager.getInstance().playShuffleSound();

      const newDeck = shuffleDeck([...state.currentPlayer.discardPile]);

      return {
        deck: newDeck,
        currentPlayer: {
          ...state.currentPlayer,
          discardPile: [],
        },
      };
    });
  },

  exchangeCards: (card1: Card, card2: Card) => {
    set((state) => {
      const hand = [...state.currentPlayer.hand];
      const reserve = [...state.currentPlayer.reserve];

      // Trouver les indices des cartes
      const handIndex = hand.findIndex((c) => c.id === card1.id);
      const reserveIndex = reserve.findIndex((c) => c.id === card2.id);

      // Si l'une des cartes n'est pas trouvée, annuler l'échange
      if (handIndex === -1 || reserveIndex === -1) {
        return state;
      }

      // Échanger les cartes
      const tempCard = hand[handIndex];
      hand[handIndex] = reserve[reserveIndex];
      reserve[reserveIndex] = tempCard;

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand,
          reserve,
        },
        message: i18next.t("game.messages.exchangeComplete"),
      };
    });
  },
  // Méthodes utilitaires :

  updateProfile: (profile) => {
    // Met à jour le profil du joueur
    set((state) => ({
      currentPlayer: {
        ...state.currentPlayer,
        name: profile.name,
        profile: {
          ...state.currentPlayer.profile,
          epithet: profile.epithet,
          avatar: profile.avatar,
        },
      },
    }));
  },

  updatePhaseAndMessage: (phase: Phase) => {
    set((state) => {
      const messages = {
        setup: " Phase de préparation : Choisissez vos 2 cartes de réserve",
        discard:
          state.turn === 1
            ? " Pour commencer la partie, veuillez défausser votre première carte"
            : "♻️ Phase de défausse : Vous devez défausser une carte",
        draw: "🎴 Phase de pioche : Piochez pour complter votre main",
        action: "⚔️ Phase d'action : Jouez vos cartes ou passez votre tour",
      };

      return {
        phase,
        message: messages[phase] || state.message,
      };
    });
  },

  debugGiveJokers: () => {
    // Fonction de debug pour ajouter des jokers à la main
    set((state) => {
      // Utilise les cartes de test prédéfinies
      const testHand = [
        // Jokers
        {
          id: "joker-red",
          type: "joker",
          value: "JOKER",
          suit: "special",
          color: "red",
          isRedJoker: true,
        },
        {
          id: "joker-black",
          type: "joker",
          value: "JOKER",
          suit: "special",
          color: "black",
          isRedJoker: false,
        },
        // As
        {
          id: "ace-hearts",
          type: "number",
          value: "A",
          suit: "hearts",
          color: "red",
        },
        {
          id: "ace-spades",
          type: "number",
          value: "A",
          suit: "spades",
          color: "black",
        },
        // Sept
        {
          id: "seven-hearts",
          type: "number",
          value: "7",
          suit: "hearts",
          color: "red",
        },
      ];

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: testHand,
        },
      };
    });
  },

  // Fonction utilitaire pour vérifier si une carte peut être sélectionnée
  canSelectCard: (card: Card) => {
    // Une carte peut être sélectionnée si elle est dans la main OU dans la rserve
    const state = get();
    return (
      state.currentPlayer.hand.some((c) => c.id === card.id) ||
      state.currentPlayer.reserve.some((c) => c.id === card.id)
    );
  },

  // Fonction utilitaire pour vérifier si un Joker peut être joué
  canPlayJoker: (jokerCard: Card) => {
    const state = get();
    return (
      jokerCard.type === "joker" &&
      state.phase === "action" &&
      !state.hasPlayedAction && // Vérifie qu'aucune action n'a été jouée ce tour-ci
      (state.currentPlayer.hand.some((c) => c.id === jokerCard.id) ||
        state.currentPlayer.reserve.some((c) => c.id === jokerCard.id))
    );
  },

  // Ajout d'une nouvelle fonction pour vérifier si des actions sont encore possibles
  canPerformActions: () => {
    const state = get();
    // Si un Joker a été joué, aucune autre action n'est possible
    if (state.phase === "endTurn") {
      return false;
    }
    return true;
  },

  // Fonction utilitaire pour vérifier si des cartes peuvent être jouées
  canPlayCards: () => {
    const state = get();
    return (
      state.phase === "action" && !state.hasPlayedAction // Vérifie qu'aucune action n'a été jouée ce tour
    );
  },

  setAttackMode: (value: boolean) => set({ attackMode: value }),
  setMessage: (message: string) => set({ message: message }),

  endTurn: () => {
    set((state) => {
      const updatedColumns = { ...state.columns };

      // Réinitialiser l'état des Valets au début du tour
      Object.keys(updatedColumns).forEach((suit) => {
        const valet = updatedColumns[suit].faceCards?.J;
        if (valet) {
          if (valet.activatedBy === "seven" && !valet.hasAttacked) {
            // Si le Valet a été activé avec un 7 et n'a pas encore attaqué
            updatedColumns[suit].faceCards.J = {
              ...valet,
              canAttackNextTurn: true,
              state: "active",
            };
          } else if (valet.hasAttacked) {
            // Si le Valet a attaqué, il doit attendre un tour
            updatedColumns[suit].faceCards.J = {
              ...valet,
              canAttackNextTurn: !valet.canAttackNextTurn, // Alterne entre true et false
            };
          }
        }
      });

      const nextPhase = state.nextPhase || (state.playedCardsLastTurn > 0 ? "draw" : "discard");

      return {
        ...state,
        columns: updatedColumns,
        phase: nextPhase,
        turn: state.turn + 1,
        hasDiscarded: nextPhase === "discard" ? false : true,
        hasDrawn: false,
        hasPlayedAction: false,
        message: nextPhase === "discard" ? i18next.t("game.messages.discardPhase") : i18next.t("game.messages.drawPhase"),
        canEndTurn: false,
        playedCardsLastTurn: 0,
      };
    });
  },

  canUseStrategicShuffle: () => {
    const state = get();
    return (
      state.phase === "discard" && // Uniquement en phase de défausse (début du tour)
      !state.hasDiscarded && // Pas encore défaussé
      !state.hasDrawn && // Pas encore pioché
      !state.hasPlayedAction && // Pas encore joué d'action
      !state.currentPlayer.hasUsedStrategicShuffle // N'a pas encore utilisé le mélange ce tour-ci
    );
  },

  handleStrategicShuffle: () => {
    set((state) => {
      if (!state.canUseStrategicShuffle()) {
        return state;
      }

      // Jouer le son de mélange
      AudioManager.getInstance().playShuffleSound();

      const allDiscardedCards = [...state.currentPlayer.hand, ...state.currentPlayer.discardPile];
      const allCards = [...state.deck, ...allDiscardedCards];
      const newDeck = shuffleDeck(allCards);
      const [remainingDeck, newHand] = drawCards(newDeck, 5);

      if (!state.hasUsedFirstStrategicShuffle) {
        return {
          ...state,
          deck: remainingDeck,
          currentPlayer: {
            ...state.currentPlayer,
            hand: newHand,
            discardPile: [],
            hasUsedStrategicShuffle: true,
          },
          hasUsedFirstStrategicShuffle: true,
          phase: "action",
          hasDiscarded: true,
          hasDrawn: true,
          hasPlayedAction: false,
          message: i18next.t("game.messages.strategicShuffleFirst"),
          isMessageClickable: true,
        };
      }

      // Si ce n'est pas le premier mélange stratégique
      return {
        ...state,
        deck: remainingDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          discardPile: [],
          hasUsedStrategicShuffle: true,
        },
        phase: "action",
        hasDiscarded: true,
        hasDrawn: true,
        hasPlayedAction: true,
        canEndTurn: true,
        message: i18next.t("game.messages.strategicShuffleNext"),
        isMessageClickable: true,
      };
    });
  },

  confirmStrategicShuffle: () => {
    set((state) => ({
      ...state,
      deck: shuffleDeck([...state.deck, ...state.currentPlayer.discardPile, ...state.currentPlayer.hand]),
      currentPlayer: {
        ...state.currentPlayer,
        hand: [],
        reserve: state.currentPlayer.reserve,
        discardPile: [],
      },
      phase: "discard",
      hasDiscarded: true,
      hasPlayedAction: true,
      awaitingStrategicShuffleConfirmation: false,
      message: i18next.t("game.messages.strategicShuffleNext"),
    }));
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
  },

  handleStrategicShuffleAction: () => {
    set((state) => {
      if (state.currentPlayer.hasUsedStrategicShuffle) {
        return state;
      }

      // Jouer le son de mélange
      AudioManager.getInstance().playShuffleSound();

      const allCards = [...state.deck, ...state.currentPlayer.discardPile];
      const newDeck = shuffleDeck(allCards);
      const [remainingDeck, newHand] = drawCards(newDeck, 5);

      return {
        ...state,
        deck: remainingDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          discardPile: [],
          hasUsedStrategicShuffle: true,
        },
        hasPlayedAction: true,
        message: i18next.t("game.messages.strategicShuffleFirst"),
      };
    });
  },

  canEndTurn: () => {
    const state = get();
    return (
      state.phase === "action" && // Doit être en phase d'action
      state.hasPlayedAction // Doit avoir joué ou passé une action
    );
  },

  handleCardPlace: (suit: Suit, position: number) => {
    set((state) => {
      const column = state.columns[suit];
      const reserveSuitCard = column.reserveSuit;

      // Handle placing a 7 from reserve suit to column
      if (reserveSuitCard?.value === "7" && reserveSuitCard.suit === suit && position === 6) {
        // Jouer le son de carte
        AudioManager.getInstance().playCardSound();
        return {
          ...state,
          hasPlayedAction: true,
          columns: {
            ...state.columns,
            [suit]: {
              ...column,
              cards: [...column.cards.slice(0, position), reserveSuitCard, ...column.cards.slice(position + 1)],
              reserveSuit: null,
              isReserveSuitLocked: true, // Lock the reserve suit
            },
          },
          playedCardsLastTurn: 0,
          nextPhase:
            state.currentPlayer.hand.length + state.currentPlayer.reserve.length === 7 ? "discard" : state.phase,
        };
      }

      // Handle placing a 7 from hand/reserve to reserve suit
      const selectedCard = state.selectedCards.find((card) => card.value === "7" || card.type === "joker");
      if (selectedCard && position === 6) {
        // Jouer le son de carte
        AudioManager.getInstance().playCardSound();
        const updatedColumns = {
          ...state.columns,
          [suit]: {
            ...column,
            cards: [...column.cards.slice(0, position), selectedCard, ...column.cards.slice(position + 1)],
            reserveSuit: null,
            isReserveSuitLocked: selectedCard.value === "7", // Lock only if it's a 7, not for Jokers
          },
        };

        // Remove selected card from hand or reserve
        const newHand = state.currentPlayer.hand.filter((c) => c.id !== selectedCard.id);
        const newReserve = state.currentPlayer.reserve.filter((c) => c.id !== selectedCard.id);

        // Move reserve suit card to hand or reserve based on where the 7/Joker came from
        const isFromHand = state.currentPlayer.hand.some((c) => c.id === selectedCard.id);
        if (reserveSuitCard) {
          if (isFromHand) {
            newHand.push(reserveSuitCard);
          } else {
            newReserve.push(reserveSuitCard);
          }
        }

        return {
          ...state,
          columns: updatedColumns,
          currentPlayer: {
            ...state.currentPlayer,
            hand: newHand,
            reserve: newReserve,
          },
          hasPlayedAction: true,
          playedCardsLastTurn: 0,
          selectedCards: [],
          nextPhase: newHand.length + newReserve.length === 7 ? "discard" : state.phase,
        };
      }

      // Si c'est un Joker et que la colonne est pleine (10 cartes), on bloque simplement le placement
      if (state.selectedCards[0]?.type === "joker" && column.cards.length >= 10) {
        return {
          ...state,
          message: "Cette colonne est pleine",
          selectedCards: [],
        };
      }

      // Cas d'activation avec Tête + Activateur
      if (state.selectedCards.length === 2) {
        const hasFaceCard = state.selectedCards.some((card) => card.value === "J" || card.value === "K");
        const hasActivator = state.selectedCards.some((card) => card.type === "joker" || card.value === "7");

        if (hasFaceCard && hasActivator) {
          var faceCard = state.selectedCards.find((card) => card.value === "J" || card.value === "K");
          // const activator = state.selectedCards.find((card) => card.type === "joker" || card.value === "7");
          const activator = state.selectedCards.some((c) => c.type === "joker") ? "joker" : "seven";

          // Pour les têtes, on vérifie uniquement la couleur, pas l'activation
          if (faceCard?.suit === suit) {
            // Jouer le son de carte
            AudioManager.getInstance().playCardSound();
            const newHand = state.currentPlayer.hand.filter(
              (card) => !state.selectedCards.some((selected) => selected.id === card.id)
            );
            const newReserve = state.currentPlayer.reserve.filter(
              (card) => !state.selectedCards.some((selected) => selected.id === card.id)
            );

            return {
              ...state,
              columns: {
                ...state.columns,
                [suit]: {
                  ...column,
                  faceCards: {
                    ...column.faceCards,
                    [faceCard.value]: { ...faceCard, activatedBy: activator },
                  },
                },
              },
              currentPlayer: {
                ...state.currentPlayer,
                hand: newHand,
                reserve: newReserve,
                discardPile: [...state.currentPlayer.discardPile, activator],
              },
              selectedCards: [],
              hasPlayedAction: true,
              playedCardsLastTurn: 2,
              message: i18next.t("game.messages.faceCardPlaced", {
                value: faceCard.value === "J" ? "Valet" : "Roi",
              }),
            };
          }
        }

        // Sinon on vérifie si c'est un As + activateur
        if (state.selectedCards.some((card) => card.value === "A") && hasActivator && position === 0) {
          const ace = state.selectedCards.find((card) => card.value === "A");
          const activator = state.selectedCards.find((card) => card.type === "joker" || card.value === "7");

          if (ace?.suit === suit && (column.cards.length === 0 || !column.hasLuckyCard)) {
            // Jouer le son de carte
            AudioManager.getInstance().playCardSound();
            // Réinitialiser le blocage pour cette colonne car c'est un nouveau cycle
            const newBlockedColumns = state.blockedColumns.filter((i) => {
              const columnSuit = Object.keys(state.columns)[i];
              return columnSuit !== suit;
            });

            // Remove cards from hand/reserve
            const newHand = state.currentPlayer.hand.filter(
              (card) => !state.selectedCards.some((selected) => selected.id === card.id)
            );
            const newReserve = state.currentPlayer.reserve.filter(
              (card) => !state.selectedCards.some((selected) => selected.id === card.id)
            );

            // Déterminer le type d'activateur
            const activatorDisplay = activator?.type === "joker" ? "JOKER" : `7${activator.suit}`; // Combine le 7 avec sa famille

            return {
              ...state,
              blockedColumns: newBlockedColumns,
              columns: {
                ...state.columns,
                [suit]: {
                  ...column,
                  hasLuckyCard: true,
                  cards: [ace],
                  reserveSuit: activator,
                  activatorType: activatorDisplay,
                  // isReserveSuitLocked: activator.value === "7",
                  isReserveSuitLocked: false,
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
              message: i18next.t("game.messages.columnActivated"),
            };
          }
        }
      }

      // Placement normal d'une carte
      if (state.selectedCards.length === 1) {
        const card = state.selectedCards[0];

        // Vérifier si c'est un 7 ou un Joker pour la reserveSuit
        // const isActivator = card.type === "joker" || card.value === "7";
        const isActivator = card.value === "7";

        if (isActivator) {
          // Vérifier si la reserveSuit est déjà occupée
          if (column.reserveSuit !== null) {
            return {
              ...state,
              message: i18next.t("game.messages.reserveSuitOccupied"),
            };
          }

          // Jouer le son de carte
          AudioManager.getInstance().playCardSound();
          // Placement dans reserveSuit uniquement pour 7 et Joker
          const newHand = state.currentPlayer.hand.filter((c) => c.id !== card.id);
          const newReserve = state.currentPlayer.reserve.filter((c) => c.id !== card.id);

          return {
            ...state,
            columns: {
              ...state.columns,
              [suit]: {
                ...column,
                reserveSuit: card,
              },
            },
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
            },
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 1,
            message: i18next.t("game.messages.cardPlaced"),
          };
        }

        // Pour les cartes numériques (As à 10)
        if (card.type != "joker") {
          if (card.suit !== suit || !column.hasLuckyCard) {
            return state;
          }

          // Vérifier si c'est une carte numérique (As à 10)
          const numericValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
          if (!numericValues.includes(card.value)) {
            return state;
          }

          // Vérifier l'ordre chronologique
          const currentValue = card.value;
          const expectedValue = numericValues[column.cards.length];
          if (currentValue !== expectedValue) {
            return state;
          }

          var newButtonsState = state.columns[suit].attackStatus.attackButtons;

          // Si on remplace un Joker, réactiver les attaques pour cette catégorie
          const cardToReplace = column.cards[column.cards.length];
          if (cardToReplace && cardToReplace.type === "joker") {
            const currentCategory = initialAttackButtons[column.cards.length].category;
            newButtonsState = state.columns[suit].attackStatus.attackButtons.map((button) => {
              if (button.category === currentCategory && !button.hasAttacked) {
                return { ...button, active: true }; // Réactiver les boutons si pas encore attaqué
              }
              return button;
            });
          }

          // Jouer le son de carte
          AudioManager.getInstance().playCardSound();
          // Placement normal dans la séquence
          const newHand = state.currentPlayer.hand.filter((c) => c.id !== card.id);
          const newReserve = state.currentPlayer.reserve.filter((c) => c.id !== card.id);

          return {
            ...state,
            columns: {
              ...state.columns,
              [suit]: {
                ...column,
                cards: [...column.cards, card],
                attackStatus: { attackButtons: newButtonsState },
              },
            },
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
            },
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 1,
            message: i18next.t("game.messages.cardPlaced"),
          };
        }

        // si joker
        if (card.type == "joker") {
          //le joker ne peut remplacer A, 7 et 10
          if (position == 0 || position == 6 || position == 9) {
            return {
              ...state,
              message: "Le Joker ne peut pas remplacer A, 7 ou 10",
              selectedCards: [],
            };
          }

          //desactiver l'attaque pour la categorie correspondante
          const currentCategory = initialAttackButtons[column.cards.length].category;
          newButtonsState = state.columns[suit].attackStatus.attackButtons.map((button) => {
            if (button.category === currentCategory) {
              return { ...button, active: false }; // Désactiver les boutons de la catégorie
            }
            return button;
          });
        } else {
          // Si on remplace un Joker, réactiver les attaques pour cette catégorie
          const cardToReplace = column.cards[column.cards.length];
          if (cardToReplace && cardToReplace.type === "joker") {
            const currentCategory = initialAttackButtons[column.cards.length].category;
            newButtonsState = state.columns[suit].attackStatus.attackButtons.map((button) => {
              if (button.category === currentCategory && !button.hasAttacked) {
                return { ...button, active: true }; // Réactiver les boutons si pas encore attaqué
              }
              return button;
            });
          }
        }

        // Jouer le son de carte
        AudioManager.getInstance().playCardSound();
        // Placement normal dans la séquence
        const newHand = state.currentPlayer.hand.filter((c) => c.id !== card.id);
        const newReserve = state.currentPlayer.reserve.filter((c) => c.id !== card.id);

        return {
          ...state,
          columns: {
            ...state.columns,
            [suit]: {
              ...column,
              cards: [...column.cards, card],
              attackStatus: { attackButtons: newButtonsState },
            },
          },
          currentPlayer: {
            ...state.currentPlayer,
            hand: newHand,
            reserve: newReserve,
          },
          selectedCards: [],
          hasPlayedAction: true,
          playedCardsLastTurn: 1,
          message: i18next.t("game.messages.cardPlaced"),
        };
      }

      // Cas d'activation avec Dame + Activateur
      if (state.selectedCards.length === 2) {
        const hasQueen = state.selectedCards.some((card) => card.value === "Q");
        const hasActivator = state.selectedCards.some((card) => card.type === "joker" || card.value === "7");

        if (hasQueen && hasActivator) {
          const queen = state.selectedCards.find((card) => card.value === "Q");
          const activator = state.selectedCards.find((card) => card.type === "joker" || card.value === "7");

          // Remove cards from hand/reserve
          const newHand = state.currentPlayer.hand.filter(
            (card) => !state.selectedCards.some((selected) => selected.id === card.id)
          );
          const newReserve = state.currentPlayer.reserve.filter(
            (card) => !state.selectedCards.some((selected) => selected.id === card.id)
          );

          // Calculate health gain
          const healAmount = activator?.type === "joker" ? 4 : 2;
          const newMaxHealth = state.currentPlayer.maxHealth + healAmount;

          // Jouer le son de soin
          AudioManager.getInstance().playHealSound();

          return {
            ...state,
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
              health: newMaxHealth,
              maxHealth: newMaxHealth,
              discardPile: [...state.currentPlayer.discardPile, queen, activator],
            },
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 2,
            canEndTurn: true,
            message: i18next.t("game.messages.queenHealing", {
              amount: healAmount,
            }),
          };
        }
      }

      return state;
    });
  },

  handleQueenChallenge: (isCorrect: boolean) => {
    set((state) => {
      const healAmount = isCorrect ? 5 : 1;
      const newMaxHealth = state.currentPlayer.maxHealth + healAmount;

      const queen = state.selectedCards.find((card) => card.value === "Q");
      const joker = state.selectedCards.find((card) => card.type === "joker");

      if (!queen || !joker) return state;

      const newHand = state.currentPlayer.hand.filter(
        (card) => !state.selectedCards.some((selected) => selected.id === card.id)
      );
      const newReserve = state.currentPlayer.reserve.filter(
        (card) => !state.selectedCards.some((selected) => selected.id === card.id)
      );

      // Jouer le son de soin
      AudioManager.getInstance().playHealSound();

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          health: newMaxHealth,
          maxHealth: newMaxHealth,
          discardPile: [...state.currentPlayer.discardPile, queen, joker],
        },
        selectedCards: [],
        queenChallenge: {
          isActive: false,
          queen: null,
        },
        hasPlayedAction: true,
        playedCardsLastTurn: 2, // Pour passer directement à la pioche au tour suivant
        message: i18next.t("game.messages.queenChallengeResult", {
          amount: healAmount,
          result: isCorrect ? "correct" : "incorrect",
        }),
        canEndTurn: true,
      };
    });
  },

  clearMessage: () => set((state) => ({ ...state, message: "", isMessageClickable: false })),

  handleActivatorExchange: (columnCard: Card, playerCard: Card) => {
    set((state) => {
      if (state.phase !== "action" || state.hasPlayedAction) return state;

      const isActivator = (card: Card) => card.type === "joker" || card.value === "7";
      if (!isActivator(columnCard) || !isActivator(playerCard)) {
        return state;
      }

      const updatedPlayer = { ...state.currentPlayer };
      const isInHand = updatedPlayer.hand.some((c) => c.id === playerCard.id);

      if (isInHand) {
        updatedPlayer.hand = updatedPlayer.hand.map((c) => (c.id === playerCard.id ? columnCard : c));
      } else {
        updatedPlayer.reserve = updatedPlayer.reserve.map((c) => (c.id === playerCard.id ? columnCard : c));
      }

      const updatedColumns = { ...state.columns };
      const targetColumn = Object.values(updatedColumns).find((col) => col.reserveSuit?.id === columnCard.id);

      if (targetColumn) {
        targetColumn.reserveSuit = playerCard;
      }

      console.log(updatedPlayer);

      return {
        ...state,
        currentPlayer: updatedPlayer,
        columns: updatedColumns,
        hasPlayedAction: true,
        exchangeMode: false,
        selectedForExchange: null,
        playedCardsLastTurn: 0,
        message: "Échange d'activateurs effectué",
        canEndTurn: true,
        phase: "action",
      };
    });
  },
  handleJokerExchange: (selectedCard: Card) => {
    set((state) => {
      if (state.phase !== "action" || state.hasPlayedAction) return state;

      console.log(selectedCard);

      const updatedPlayer = { ...state.currentPlayer };
      const isInHand = updatedPlayer.hand.some((c) => c.id === selectedCard.id);

      const jokerCard = state.columns[selectedCard.suit].cards[parseInt(selectedCard.value) - 1];

      if (isInHand) {
        updatedPlayer.hand = updatedPlayer.hand.map((c) => (c.id === selectedCard.id ? jokerCard : c));
      } else {
        updatedPlayer.reserve = updatedPlayer.reserve.map((c) => (c.id === selectedCard.id ? jokerCard : c));
      }

      const updatedColumns = { ...state.columns };

      updatedColumns[selectedCard.suit].cards = updatedColumns[selectedCard.suit].cards.map(
        (card: Card, index: number) => ((index + 1).toString() == selectedCard.value ? selectedCard : card)
      );

      const attackBtns = updatedColumns[selectedCard.suit].attackStatus.attackButtons;

      const newAttackButtons = attackBtns.map((btn) => {
        return !btn.active && !btn.wasUsed ? { ...btn, active: true } : { ...btn };
      });

      updatedColumns[selectedCard.suit].attackStatus.attackButtons = newAttackButtons;

      console.log(updatedPlayer);

      return {
        ...state,
        currentPlayer: updatedPlayer,
        columns: updatedColumns,
        hasPlayedAction: true,
        exchangeMode: false,
        selectedForExchange: null,
        playedCardsLastTurn: 0,
        message: "Échange d'activateurs effectué",
        canEndTurn: true,
        phase: "action",
      };
    });
  },
  displayJokerExchangePopup: (availableCards: Card[]) => {
    set((state) => {
      return { ...state, showJokerExchangePopup: true, availableCards };
    });
  },
  closeJokerExchangePopup: () => {
    set((state) => {
      return { ...state, showJokerExchangePopup: false };
    });
  },

  handleAttack: (clickedAttackCard: Card) => {
    set((state) => {
      const column = state.columns[clickedAttackCard.suit];
      const valet = column?.faceCards?.J;

      //Le valet doit être en position d’attaque des qu’il rentre sur le terrain avec un sacrifice ou un Joker, donc possibilité d’attaquer des le tour où il est joué
      if (clickedAttackCard.value === "J" && (valet?.activatedBy == "sacrifice" || valet?.activatedBy == "joker")) {
      } else {
        if (state.phase !== "action" || state.hasPlayedAction) return state;
      }

      // Logique spécifique pour l'attaque du Valet
      if (clickedAttackCard.value === "J") {
        const column = state.columns[clickedAttackCard.suit];

        const valet = column.faceCards?.J;

        const buttonsState = column.attackStatus.attackButtons;
        const clickedButtonState = buttonsState.find((button) => button.id === clickedAttackCard.value);

        if (!clickedButtonState || !clickedButtonState.active) {
          return state;
        }

        // Désactiver tous les boutons de la même catégorie
        const newButtonsState = buttonsState.map((button) => {
          if (button.category === clickedButtonState.category) {
            return { ...button, active: false, wasUsed: true }; // Désactiver les boutons de la catégorie
          }
          return button;
        });

        // Calculer le nombre de cartes détruites
        // const cardsDestroyedCount =
        //   stateAfterAttack.currentPlayer.discardPile.length - state.currentPlayer.discardPile.length;

        const updatedColumns = { ...state.columns };

        updatedColumns[clickedAttackCard.suit].attackStatus = {
          lastAttackCard: { cardValue: clickedAttackCard.value, turn: state.turn },
          attackButtons: newButtonsState,
        };

        return {
          // ...stateAfterAttack,
          columns: updatedColumns,
          hasPlayedAction: true,
          // playedCardsLastTurn: 0,
          // message: i18next.t("game.messages.valetAttack", {
          //   count: cardsDestroyedCount,
          //   suit: clickedAttackCard.suit,
          // }),
        };
      }

      // Vérifier d'abord si un Roi bloque l'attaque
      const isKingInvolved = get().handleAttackWithKing(clickedAttackCard, clickedAttackCard.suit);
      if (isKingInvolved) {
        return state; // L'attaque a été gérée par la logique du Roi
      }

      // Si aucun Roi n'est impliqué, continuer avec la logique d'attaque normale
      const currentSuit = clickedAttackCard.suit;

      // Trouver le bouton cliqué
      const buttonsState = state.columns[currentSuit].attackStatus.attackButtons;

      const clickedButtonState = buttonsState.find((button) => button.id === clickedAttackCard.value);

      if (!clickedButtonState || !clickedButtonState.active) {
        return state;
      }

      // Désactiver tous les boutons de la même catégorie
      const newButtonsState = buttonsState.map((button) => {
        if (button.category === clickedButtonState.category) {
          return { ...button, active: false, wasUsed: true }; // Désactiver les boutons de la catégorie
        }
        return button;
      });

      const updatedColumns = { ...state.columns };

      updatedColumns[currentSuit].attackStatus = {
        lastAttackCard: clickedAttackCard.value,
        attackButtons: newButtonsState,
      };

      return {
        ...state,
        columns: updatedColumns,
        playedCardsLastTurn: 0,
        hasPlayedAction: true,
        message: "Attack effectuée",
      };
    });
  },
  activateCardAttackButton: (card: Card) => {
    set((state) => {
      const updatedColumns = { ...state.columns };

      updatedColumns[card.suit].attackStatus.attackButtons = updatedColumns[card.suit].attackStatus.attackButtons.map(
        (element) => {
          if (element.id == card.value) return { ...element, active: true };
          else return element;
        }
      );

      return {
        ...state,
        columns: updatedColumns,
      };
    });
  },

  handleBlock: (columnIndex: number) => {
    const state = get();
    const { phase, hasPlayedAction, blockedColumns } = state;

    // Vérifier si l'action est valide
    if (phase !== "action" || hasPlayedAction || blockedColumns.includes(columnIndex)) {
      console.log("Block action invalid:", {
        phase,
        hasPlayedAction,
        isBlocked: blockedColumns.includes(columnIndex),
      });
      return;
    }

    // Vérifier si la colonne a une séquence complète
    const column = Object.values(state.columns)[columnIndex];
    if (!column) {
      console.log("Column not found:", columnIndex);
      return;
    }

    // Vérifier la séquence de cartes
    const sequence = ["A", "2", "3", "4", "5", "6", "7"];
    const columnCards = column.cards.slice(0, 7);
    const columnValues = columnCards.map((card) => {
      // Normaliser la valeur de l'As
      if (card.value === "As") return "A";
      return card.value;
    });

    console.log("Checking sequence:", {
      columnValues,
      sequence,
      columnCards: columnCards.map((c) => ({ value: c.value, suit: c.suit })),
    });

    // Vérifier si la séquence est complète et dans l'ordre
    const isSequenceComplete = sequence.every((value, index) => {
      const cardValue = columnValues[index];
      return cardValue === value || cardValue === "JOKER";
    });

    if (!isSequenceComplete) {
      console.log("Sequence incomplete:", { columnValues, sequence });
      return;
    }

    console.log("Blocking attack for column:", columnIndex);
    set((state) => ({
      ...state,
      hasPlayedAction: true,
      canEndTurn: true,
      blockedColumns: [...state.blockedColumns, columnIndex],
      playedCardsLastTurn: 0,
      message: i18next.t("game.messages.blockSuccess"),
    }));
  },

  resetBlockedColumns: () => {
    set((state) => ({
      ...state,
      blockedColumns: [],
    }));
  },

  handleDestroyColumn: (columnIndex: number) => {
    set((state) => {
      // ... existing destroy column logic ...
      return {
        ...state,
        blockedColumns: state.blockedColumns.filter((i) => i !== columnIndex),
        // ... rest of the state updates
      };
    });
  },

  handleRevolution: () => {
    const audioManager = AudioManager.getInstance();
    audioManager.playRevolutionSound();
    set((state) => {
      // ... existing revolution logic ...
      return {
        ...state,
        blockedColumns: [],

        // ... rest of the state updates
      };
    });
  },

  getPhaseMessage: (
    phase: Phase,
    hasDiscarded: boolean,
    hasDrawn: boolean,
    hasPlayedAction: boolean,
    playedCardsLastTurn: number
  ): string => {
    switch (phase) {
      case "discard":
        if (playedCardsLastTurn > 0) {
          return "";
        }
        return hasDiscarded ? "" : i18next.t("game.messages.discardPhase");

      case "draw":
        return hasDrawn ? "" : i18next.t("game.messages.drawPhase");

      case "action":
        if (hasPlayedAction) {
          return "";
        }
        return i18next.t("game.messages.actionPhase");

      default:
        return "";
    }
  },
  setSelectedSacrificeCards: (cards: Card[]) => set({ selectedSacrificeCards: cards }),
  setSelectedJokerExchangeCards: (cards: Card[]) => set({ selectedCards: cards }),
}));
