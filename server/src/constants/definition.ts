import { attackCardButton } from "src/types/game";

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

export const JOKER_CARD = "JOKER";
export const KING_CARD = "K";
export const QUEEN_CARD = "Q";
export const JACK_CARD = "J";
export const AS_CARD = "A";
export const SEVEN_CARD = "7";

export const SETUP_PHASE = "SETUP";
export const DRAW_PHASE = "DRAW";
export const PLAY_PHASE = "PLAY";
export const DISCARD_PHASE = "DISCARD";

export const HEAL_ACTION = "heal";
export const ATTACK_ACTION = "attack";

export const SACRIFICE = "SACRIFICE";
