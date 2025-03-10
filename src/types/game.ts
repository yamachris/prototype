export type Phase = "setup" | "discard" | "draw" | "action";
export type Suit = "hearts" | "diamonds" | "clubs" | "spades" | "special";
export type StandardValue = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Value = StandardValue | "JOKER";
export type ActivatorType = "7" | "JOKER" | null;
export type CardColor = "red" | "black";
export type ValetCardState = "active" | "passive";

export type attackCardButton = {
  id: string;
  category: string; // Catégorie du bouton
  active: boolean; // État du bouton (actif ou inactif)
  wasUsed: boolean; //Est ce que le bouton a déjà été utilisé pour attaquer
};

export const initialAttackButtons: attackCardButton[] = [
  { id: "A", category: "1", active: true, wasUsed: false },
  { id: "2", category: "1", active: true, wasUsed: false },
  { id: "3", category: "1", active: true, wasUsed: false },
  { id: "4", category: "2", active: true, wasUsed: false },
  { id: "5", category: "2", active: true, wasUsed: false },
  { id: "6", category: "2", active: true, wasUsed: false },
  { id: "7", category: "3", active: false, wasUsed: false }, //la carte 7 toujours à false
  { id: "8", category: "4", active: true, wasUsed: false },
  { id: "9", category: "5", active: true, wasUsed: false },
  { id: "J", category: "6", active: true, wasUsed: false },
  { id: "K", category: "7", active: true, wasUsed: false },
];

export type Card = {
  id: string;
  suit: Suit;
  value: Value;
  type: "standard" | "joker";
  color: CardColor;
  isRedJoker?: boolean;
  state?: ValetCardState; // État du Valet (uniquement pour les cartes J)
};

export interface SacrificeInfo {
  sacrificedCards: Card[];
  specialCard: Card;
  healthBonus: number;
}

export interface SacrificeState {
  showSacrificePopup: boolean;
  availableCards: Card[];
}

export interface SacrificeActions {
  setSacrificeMode: (mode: boolean) => void;
  sacrificeSpecialCard: (selectedCards: Card[]) => void;
}

export interface GameState extends SacrificeState {
  currentPlayer: Player;
  phase: Phase;
  isPlayerTurn: boolean;
  selectedCards: Card[];
  hasDiscarded: boolean;
  hasPlayedAction: boolean;
  message: string;
  columns: Record<Suit, ColumnState>;
  hasUsedFirstStrategicShuffle: boolean;
  awaitingStrategicShuffleConfirmation: boolean;
  deck: Card[];
  turn: number;
  playedCardsLastTurn: number;
  attackMode: boolean;
  isGameOver: boolean;
  winner: string | null;
  canEndTurn: boolean;
  language: string;
  sacrificeInfo: SacrificeInfo | null;
}

export interface GameStore extends GameState {
  selectCard: (card: Card) => void;
  handleDiscard: (card: Card) => void;
  handleDrawCard: () => void;
  exchangeCards: (card1: Card, card2: Card) => void;
  handleJokerAction: (joker: Card, action: "heal" | "attack") => void;
  setAttackMode: (mode: boolean) => void;
  setMessage: (message: string) => void;
  handleStrategicShuffle: () => void;
  endTurn: () => void;
  setPhase: (phase: Phase) => void;
  canUseStrategicShuffle: () => boolean;
  handlePassTurn: () => void;
  handleSurrender: () => void;
  handleSkipAction: () => void;
  confirmStrategicShuffle: () => void;
}

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  hand: Card[];
  reserve: Card[];
  discardPile: Card[];
  deck: Card[];
  hasUsedStrategicShuffle: boolean;
  profile: {
    epithet: string;
    avatar?: string;
  };
}

export interface ColumnState {
  cards: Card[];
  isLocked: boolean;
  hasLuckyCard: boolean;
  activatorType: "JOKER" | "7" | null;
  sequence: Card[];
  reserveSuit: Card | null;
  faceCards: {
    J?: Card; // Valet
    K?: Card; // Roi
  };
  attackStatus: {
    attackButtons: attackCardButton[];
    lastAttackCard: { cardValue: string; turn: number };
  };
}
