// Importation des dépendances nécessaires
import { create } from "zustand"; // Zustand est utilisé pour la gestion d'état
import { Card, Player, Phase, Suit, ColumnState, Profile } from "../types/game";
import { Card as CardType } from "../types/game";
import { AudioManager } from "../sound-design/audioManager";
import i18next from "i18next"; // Importez i18next directement
import i18n from "../i18n/config";
import { gameSocket } from "../../services/socket";

// Au début du fichier, après les autres imports
const t = (key: string) => i18next.t(key);

// Interface définissant la structure de l'état du jeu
export interface GameState {
  gameId: string;
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
  isMessageClickable: boolean;
  exchangeMode: boolean;
  selectedForExchange: Card | null;
  nextPhase?: Phase; // Nouveau champ pour stocker la phase suivante
  showRevolutionPopup: boolean;
  blockableColumns: number[];
  canBlock: boolean;
  blockedColumns: string[]; // nom des colonnes qui ont été bloquées
  showSacrificePopup: boolean;
  showJokerExchangePopup: boolean;
  sacrificeInfo: null;
  availableCards: Card[];
  totalGameTime: number; // Temps total de jeu en secondes
}

export interface GameStore extends GameState {
  sacrificeSpecialCard: (specialCard: Card, selectCards: Card[]) => void;
  activateCardAttackButton: (card: Card) => void;
  canUseStrategicShuffle: () => boolean;
  closeJokerExchangePopup: () => void;
  displayJokerExchangePopup: (availableCards: Card[]) => void;
  exchangeCards: (card1: CardType, card2: CardType) => void;
  handleActivatorExchange: (columnCard: Card, playerCard: Card) => void;
  handleAttack: (attackCard: Card | string) => void;
  handleBlock: (suit: Suit) => void;
  handleCardPlace: (suit: Suit, position: number) => void;
  handleDiscard: (card: CardType) => void;
  handleDrawCard: () => void;
  handleJokerAction: (jokerCard: CardType, action: "heal" | "attack") => void;
  handleJokerExchange: (selectedCard: Card) => void;
  handlePassTurn: () => void;
  handleQueenChallenge: (selectedcards: Card[], isCorrect: boolean) => void;
  handleRevolution: () => void;
  handleSkipAction: () => void;
  handleStrategicShuffle: () => void;
  handleSurrender: () => void;
  initializeGame: (gameState: GameState) => void;
  moveToReserve: (card: Card) => void;
  recycleDiscardPile: () => void;
  selectCard: (card: CardType) => void;
  setSelectedJokerExchangeCards: (cards: Card[]) => void;
  setSelectedSacrificeCards: (cards: Card[]) => void;
  startGame: () => void;
  setSacrificeMode: (show: boolean) => void;
  setShowRevolutionPopup: (showRevolutionPopup: boolean) => void;
  sendGameTimerUpdate: (time: number) => void; // Nouvelle fonction pour synchroniser le timer
}

// Création du store avec Zustand
export const useGameStore = create<GameStore>((set, get) => ({
  // État initial du jeu
  language: i18n.language || "fr",
  totalGameTime: 0, // Initialiser le temps de jeu

  startGame: () => {
    const state = get();
    gameSocket.startGame(state.gameId);
  },

  initializeGame: async (gameState: GameState) => {
    try {
      //init
      set({ ...gameState });

      gameSocket.connect();
      gameSocket.joinGame(gameState.gameId);

      // Listen for updates
      gameSocket.onGameState((state) => {
        console.log("🟢 Received game state:", state);
        if (state != null) set({ ...state });
      });

      return () => {
        gameSocket.disconnect();
      };
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  },

  handleJokerAction: (jokerCard: Card, action: "heal" | "attack") => {
    const state = get();
    gameSocket.handleJokerAction(state.gameId, jokerCard, action);

    if (action === "heal") {
      // Jouer le son de soin
      AudioManager.getInstance().playHealSound();
    }
  },

  handleDrawCard: () => {
    // Jouer le son de pioche
    AudioManager.getInstance().playDrawSound();

    const state = get();
    gameSocket.handleDrawCard(state.gameId);
  },

  handlePassTurn: () => {
    const state = get();
    gameSocket.handlePassTurn(state.gameId);
  },

  handleSkipAction: () => {
    const state = get();
    gameSocket.handleSkipAction(state.gameId);
  },

  handleSurrender: () => {
    const state = get();
    gameSocket.handleSurrender(state.gameId);
  },

  // Gère le déplacement d'une carte vers la réserve
  moveToReserve: async (card: Card) => {
    const state = get();
    gameSocket.moveToReserve(state.gameId, card);
  },

  handleDiscard: (card: Card) => {
    const state = get();
    gameSocket.handleDiscard(state.gameId, card);
  },

  // Récupère les cartes de la défausse pour remplir le deck
  recycleDiscardPile: () => {
    const state = get();
    gameSocket.handleRecycleDiscardPile(state.gameId);

    // Jouer le son de mélange
    AudioManager.getInstance().playShuffleSound();
  },

  exchangeCards: (card1: Card, card2: Card) => {
    const state = get();
    gameSocket.handleExchangeCards(state.gameId, card1, card2);
  },

  updateProfile: (profile: Profile) => {
    // Met à jour le profil du joueur
    const state = get();
    gameSocket.handleUpdateProfile(state.gameId, profile);
  },

  canUseStrategicShuffle: () => {
    const state = get();
    return (
      state.phase === "DISCARD" && // Uniquement en phase de défausse (début du tour)
      !state.hasDiscarded && // Pas encore défaussé
      !state.hasDrawn && // Pas encore pioché
      !state.hasPlayedAction && // Pas encore joué d'action
      !state.currentPlayer.hasUsedStrategicShuffle // N'a pas encore utilisé le mélange ce tour-ci
    );
  },

  handleStrategicShuffle: () => {
    // Jouer le son de mélange
    AudioManager.getInstance().playShuffleSound();

    const state = get();
    gameSocket.handleStrategicShuffle(state.gameId);
  },

  handleCardPlace: (suit: Suit, position: number) => {
    const state = get();
    gameSocket.handlePlaceCard(state.gameId, suit, state.selectedCards);
    
    // Jouer le son de pose de carte
    AudioManager.getInstance().playCardSound();
  },

  handleQueenChallenge: (selectedCards: Card[], isCorrect: boolean) => {
    console.log("handleQueenChallenge ", selectedCards);

    const state = get();
    gameSocket.handleQueenChallenge(state.gameId, selectedCards, isCorrect);

    // Jouer le son de soin
    AudioManager.getInstance().playHealSound();
  },

  handleActivatorExchange: (columnCard: Card, playerCard: Card) => {
    const state = get();
    gameSocket.handleActivatorExchange(state.gameId, columnCard, playerCard);
    
    // Jouer le son de carte pour l'échange d'activateurs
    AudioManager.getInstance().playCardSound();
  },

  handleJokerExchange: (selectedCard: Card) => {
    const state = get();
    gameSocket.handleJokerExchange(state.gameId, selectedCard);
  },

  sacrificeSpecialCard: (specialCard: Card, selectedCards: Card[]) => {
    console.log("specialCard ", specialCard);
    console.log("selectedCards ", selectedCards);
    const state = get();

    // Si c'est une Dame (Q), jouer le son de soin approprié
    if (specialCard.value === "Q") {
      // Vérifier les cartes combinées avec la Dame
      const hasJoker = selectedCards.some(card => card.type === "JOKER");
      const hasSeven = selectedCards.some(card => card.value === "7");
      
      // Déterminer le type et l'intensité de la guérison
      if (hasJoker) {
        // Joker + Dame = +4 PV (jouer le son deux fois pour un effet plus puissant)
        AudioManager.getInstance().playHealSound();
        setTimeout(() => {
          AudioManager.getInstance().playHealSound();
        }, 200);
      } else if (hasSeven) {
        // 7 + Dame = +2 PV (jouer le son clairement)
        AudioManager.getInstance().playHealSound();
      } else {
        // Dame standard = +2 PV
        AudioManager.getInstance().playHealSound();
      }
    }

    gameSocket.handleSacrificeSpecialCard(state.gameId, specialCard, selectedCards);
  },

  handleAttack: (attackCard: Card) => {
    const state = get();
    gameSocket.handleAttack(state.gameId, attackCard);
  },

  activateCardAttackButton: (card: Card) => {
    console.log("activateCardAttackButton");

    set((state) => {
      const updatedColumns = { ...state.columns };

      updatedColumns[card.suit].attackStatus.attackButtons = updatedColumns[card.suit].attackStatus.attackButtons.map(
        (element) => {
          // if(card.value =="J")
          if (element.id == card.value) {
            if (card.value == "J") return { ...element, active: true, wasUsed: false };
            else return { ...element, active: true };
          } else return element;
        }
      );

      console.log(updatedColumns);

      return {
        ...state,
        columns: updatedColumns,
      };
    });
  },

  handleBlock: (suit: Suit) => {
    const state = get();
    gameSocket.handleBlock(state.gameId, suit);
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

  setShowRevolutionPopup: (showRevolutionPopup: boolean) => {
    const state = get();
    gameSocket.setShowRevolutionPopup(state.gameId, showRevolutionPopup);
  },
  /*
   * FrontEnd functions
   */
  closeJokerExchangePopup: () => {
    set((state) => {
      return { ...state, showJokerExchangePopup: false };
    });
  },

  displayJokerExchangePopup: (availableCards: Card[]) => {
    set((state) => {
      return { ...state, showJokerExchangePopup: true, availableCards };
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
        } else if (card.type === "JOKER" || card.value === "7") {
          message = "Sélectionnez un As pour activer une colonne";
        }
      } else if (newSelectedCards.length === 2) {
        const [card1, card2] = newSelectedCards;
        const hasAs = card1.value === "A" || card2.value === "A";
        const hasActivator =
          card1.type === "JOKER" || card1.value === "7" || card2.type === "JOKER" || card2.value === "7";

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

  setSelectedSacrificeCards: (cards: Card[]) => set({ selectedSacrificeCards: cards }),

  setSelectedJokerExchangeCards: (cards: Card[]) => set({ selectedCards: cards }),

  setSacrificeMode: (mode: boolean) => {
    const state = get();
    const selectedCard = state.selectedCards[0];

    if (!mode || !selectedCard) {
      set({
        showSacrificePopup: false,
        availableCards: [],
        selectedSacrificeCards: [],
      });
      return;
    }

    // Récupérer toutes les cartes jouées sur le terrain
    const availableCards = Object.values(state.columns)
      .filter((column) => {
        // Vérifier si la colonne existe et a des cartes
        if (!column || !column.cards || column.cards.length === 0) return false;

        return true;
      })
      .flatMap((column) => {
        const cards = column.cards.filter((card, index) => {
          // Ne jamais permettre le sacrifice du 10
          if (card.value === "10") return false;

          // Ne pas permettre le sacrifice si la colonne a 10 cartes (il faut d'abord sacrifier la plus haute)
          if (column.cards.length >= 10) {
            // On ne permet que le sacrifice de la carte la plus haute
            return index === column.cards.length - 1;
          }

          // Vérifier si un Joker est présent au-dessus de cette carte
          const hasJokerAbove = column.cards.some((c, i) => i > index && c.type === "JOKER");

          // Ne pas permettre le sacrifice si un Joker est présent au-dessus
          if (hasJokerAbove) return false;

          // Pour le Valet, uniquement 8 ou 9
          if (selectedCard.value === "J") {
            return ["8", "9"].includes(card.value);
          }

          // Pour les autres cartes, exclure A, 7, 10
          return !["A", "7", "10"].includes(card.value);
        });

        // Trier les cartes par valeur décroissante
        return cards.sort((a, b) => {
          const valueOrder = ["2", "3", "4", "5", "6", "8", "9", "J", "Q", "K"];
          return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
        });
      });

    set({
      showSacrificePopup: mode,
      availableCards,
      selectedSacrificeCards: [],
    });
  },
  sendGameTimerUpdate: (time: number) => {
    const state = get();
    if (state.gameId) {
      gameSocket.updateGameTimer(state.gameId, time);
    }
  },
}));
