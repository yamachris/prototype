export type Suit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
export type SuitCard = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES" | "SPECIAL";
export type Phase = "SETUP" | "DRAW" | "PLAY" | "DISCARD" | "END";
export type CardType = "STANDARD" | "JOKER";
export type Value = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "JOKER";

export interface Card {
  id: string;
  suit: SuitCard;
  value: string;
  isJoker?: boolean;
  isActivator?: boolean;
  isSpecial?: boolean;
  type: CardType;
  isRedJoker?: boolean;
}

export interface Profile {
  name: string;
  epithet: string;
  avatar: string;
}

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  hand: Card[];
  reserve: Card[];
  discardPile: Card[];
  profile: {
    epithet: string;
    avatar?: string;
  };
  hasUsedStrategicShuffle: boolean;
}

interface AttackStatus {
  attackButtons: attackCardButton[];
  lastAttackCard: {};
}

export interface ColumnState {
  cards: Card[];
  isDestroyed: boolean;
  attackStatus: AttackStatus;
  hasLuckyCard: boolean;
  reserveSuit: Card;

  faceCards: {
    J?: Card; // Valet
    K?: Card; // Roi
  };
}

export interface GameState {
  // gameId: string;
  currentPlayer: Player;
  deck: Card[];
  phase: Phase;
  turn: number;
  selectedCards: Card[];
  selectedSacrificeCards: Card[];
  columns: Record<Suit, ColumnState>;
  hasDiscarded: boolean;
  hasDrawn: boolean;
  hasPlayedAction: boolean;
  isGameOver: boolean;
  // playedCardsLastTurn: number;
  attackMode: boolean;
  message: string;
  winner: string | null;
  canEndTurn: boolean;
  blockableColumns: number[];
  // canBlock: boolean;
  blockedColumns: string[];
  showRevolutionPopup: boolean;
}

export type attackCardButton = {
  id: string;
  category: string; // Catégorie du bouton
  active: boolean; // État du bouton (actif ou inactif)
  wasUsed: boolean; //Est ce que le bouton a déjà été utilisé pour attaquer
};
