import { Card, Suit, Value } from "../types/game";
import { v4 as uuidv4 } from "uuid";

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const VALUES: Value[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  
  // Ajouter plusieurs jokers (5 au total)
  for (let i = 0; i < 5; i++) {
    deck.push({
      id: uuidv4(),
      suit: "SPECIAL",
      type: "JOKER",
      value: "JOKER",
      isJoker: true,
      isRedJoker: i % 2 === 0, // Alterner entre jokers rouges et noirs
    });
  }

  // Créer plusieurs jeux de cartes de cœur (4 jeux complets)
  for (let set = 0; set < 4; set++) {
    VALUES.forEach((value) => {
      deck.push({
        id: uuidv4(),
        suit: "HEARTS",
        value,
        type: "STANDARD",
      });
    });
  }

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  // Décommenter pour activer le mélange si nécessaire
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const drawCards = (deck: Card[], count: number): [Card[], Card[]] => {
  const drawnCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return [remainingDeck, drawnCards];
};
