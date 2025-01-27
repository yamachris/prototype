export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
export type Phase = 'DRAW' | 'PLAY' | 'DISCARD' | 'END';

export interface Card {
  id: string;
  suit: Suit;
  value: number;
  isJoker?: boolean;
  isActivator?: boolean;
  isSpecial?: boolean;
}

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  hand: Card[];
}

export interface ColumnState {
  cards: Card[];
  isDestroyed: boolean;
}

export interface GameState {
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
  playedCardsLastTurn: number;
  attackMode: boolean;
  message: string;
  winner: string | null;
  canEndTurn: boolean;
  blockableColumns: number[];
  canBlock: boolean;
  blockedColumns: number[];
}
