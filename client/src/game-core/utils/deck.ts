/* import { Card, Suit, Value } from "../types/game";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES: Value[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  // Création du deck standard (52 cartes)
  SUITS.forEach((suit) => {
    VALUES.forEach((value) => {
      deck.push({
        id: `${suit}-${value}`,
        type: "number",
        value,
        suit,
        color: ["hearts", "diamonds"].includes(suit) ? "red" : "black",
      });
    });
  });

  // Ajout des deux Jokers (54 cartes au total)
  deck.push(
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
    }
  );

  return deck;
}

// Cette partie a commenté si je veux faire des tests

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }

  let newDeck000 = [];
  for (let index = 1; index < newDeck.length; index++) {
    let element = newDeck[index];

    element.suit = "diamonds";
    element.color = "red";

    if (index == 1 || index % 11 == 0) element.value = "A";
    else element.value = (index % 11).toString();

    if (element.value == "7") element.type = "standard";

    // if (index == 8) element.type = "joker";

    newDeck000.push(element);
  }
  return newDeck000;
  // return newDeck;
}

export function shuffleDeckOld(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// il faut suppimer quand j'ai fini de faire les tests

export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawnCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return [remainingDeck, drawnCards];
}

// Fonction simple pour gérer l'effet du Joker
export function handleJokerEffect(
  player: Player,
  action: "heal" | "attack"
): Player {
  const updatedPlayer = { ...player };

  if (action === "heal") {
    updatedPlayer.health = Math.min(player.health + 3, player.maxHealth);
  } else {
    updatedPlayer.health = Math.max(player.health - 3, 0);
  }

  return updatedPlayer;
} */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* import { Card, Suit, Value } from '../types/game';

  const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const VALUES: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  export function createDeck(): Card[] {
    const deck: Card[] = [];
  
    // Création du deck standard (52 cartes)
    SUITS.forEach(suit => {
      VALUES.forEach(value => {
        deck.push({
          id: `${suit}-${value}`,
          type: 'number',
          value,
          suit,
          color: ['hearts', 'diamonds'].includes(suit) ? 'red' : 'black'
        });
      });
    });
  
    // Ajout des deux Jokers (54 cartes au total)
    deck.push(
      {
        id: 'joker-red',
        type: 'joker',
        value: 'JOKER',
        suit: 'special',
        color: 'red',
        isRedJoker: true
      },
      {
        id: 'joker-black',
        type: 'joker',
        value: 'JOKER',
        suit: 'special',
        color: 'black',
        isRedJoker: false
      }
    );
  
    return deck;
  }
  
  // Cette partie a commenté si je veux faire des tests
  
  export function shuffleDeck(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }
  
    // il faut suppimer quand j'ai fini de faire les tests
  
  export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
    const drawnCards = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return [remainingDeck, drawnCards];
  }
  
  // Fonction simple pour gérer l'effet du Joker
  export function handleJokerEffect(player: Player, action: 'heal' | 'attack'): Player {
    const updatedPlayer = { ...player };
    
    if (action === 'heal') {
      updatedPlayer.health = Math.min(player.health + 3, player.maxHealth);
    } else {
      updatedPlayer.health = Math.max(player.health - 3, 0);
    }
    
    return updatedPlayer;
  } */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { Card, Suit, Value } from "../types/game";

const SUITS: Suit[] = ["diamonds", "spades"]; // Enseignes : Carreau et Pique
const VALUES: Value[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  deck.push(
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
    }
  );

  // Création des cartes pour Carreau et Pique (As jusqu'à Roi)
  SUITS.forEach((suit) => {
    const color = suit === "diamonds" ? "red" : "black"; // Couleur selon l'enseigne

    VALUES.forEach((value) => {
      deck.push({
        id: `${suit}-${value}`, // ID unique
        type: "number",
        value,
        suit,
        color,
      });
    });
  });

  // Ajout des deux Jokers pour arriver à 28 cartes
  // deck.push(
  //   {
  //     id: "joker-red",
  //     type: "joker",
  //     value: "JOKER",
  //     suit: "special",
  //     color: "red",
  //     isRedJoker: true,
  //   },
  //   {
  //     id: "joker-black",
  //     type: "joker",
  //     value: "JOKER",
  //     suit: "special",
  //     color: "black",
  //     isRedJoker: false,
  //   }
  // );

  return deck;
}

// Fonction de mélange
export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// Fonction pour tirer des cartes
export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawnCards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return [remainingDeck, drawnCards];
}

// Gestion de l'effet du Joker
export function handleJokerEffect(player: Player, action: "heal" | "attack"): Player {
  const updatedPlayer = { ...player };

  if (action === "heal") {
    updatedPlayer.health = Math.min(player.health + 3, player.maxHealth);
  } else {
    updatedPlayer.health = Math.max(player.health - 3, 0);
  }

  return updatedPlayer;
}
