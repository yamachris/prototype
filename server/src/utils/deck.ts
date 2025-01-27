import { Card, Suit } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  const deck: Card[] = [];

  // Créer les cartes normales
  suits.forEach((suit) => {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        id: uuidv4(),
        suit,
        value,
        isSpecial: value > 10,
        isActivator: value === 1,
      });
    }
  });

  // Ajouter les jokers
  deck.push({ id: uuidv4(), suit: 'HEARTS', value: 0, isJoker: true });
  deck.push({ id: uuidv4(), suit: 'SPADES', value: 0, isJoker: true });

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const drawCards = (deck: Card[], count: number): Card[] => {
  return deck.slice(0, count);
};
