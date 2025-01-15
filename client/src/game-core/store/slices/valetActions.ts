import { Card, GameState, Suit } from '../../types/game';
import { cn } from '../../utils/cn';

// Types pour le Valet
interface ValetAttackButton {
  id: string;
  category: string;
  active: boolean;
  isGolden: boolean;
}

// Configuration initiale des boutons d'attaque du Valet
export const valetAttackButtons: ValetAttackButton[] = [
  { id: "2", category: "1", active: true, isGolden: true },
  { id: "3", category: "1", active: true, isGolden: true },
  { id: "4", category: "2", active: true, isGolden: true },
  { id: "5", category: "2", active: true, isGolden: true },
  { id: "6", category: "2", active: true, isGolden: true },
];

// Vérifie si le Valet peut être battu
export function canValetBeDefeated(attackingCard: Card, defendingValet: Card): boolean {
  // Le Valet peut être battu par un 8 ou 9 de la même enseigne, ou un Joker
  if (attackingCard.type === 'joker') return true;
  
  return attackingCard.suit === defendingValet.suit && 
         ['8', '9'].includes(attackingCard.value);
}

// Gère l'attaque du Valet
export function handleValetAttack(
  gameState: GameState, 
  valet: Card, 
  targetCards: Card[] = [], 
  columnSuit: Suit
): GameState {
  if (!targetCards || targetCards.length === 0) {
    return {
      ...gameState,
      message: "Aucune carte à attaquer dans cette colonne"
    };
  }

  // Vérifie si la cible est valide (carte ≤ 6)
  const cardsToDestroy = targetCards.filter(card => 
    ['A', '2', '3', '4', '5', '6'].includes(card.value)
  );

  if (cardsToDestroy.length === 0) {
    return {
      ...gameState,
      message: "Le Valet ne peut attaquer que les cartes de valeur 6 ou moins!"
    };
  }

  // Copie l'état du jeu pour les modifications
  const updatedColumns = { ...gameState.columns };
  const updatedPlayer = { ...gameState.currentPlayer };
  
  // Vérifie si la colonne existe
  if (!updatedColumns[columnSuit]) {
    updatedColumns[columnSuit] = {
      cards: [],
      faceCards: {},
      attackStatus: {
        lastAttackCard: null,
        attackButtons: []
      }
    };
  }

  // Retire les cartes ciblées de la colonne
  updatedColumns[columnSuit].cards = targetCards.filter(
    card => !cardsToDestroy.includes(card)
  );

  // Ajoute les cartes détruites à la défausse du joueur
  updatedPlayer.discardPile = [...updatedPlayer.discardPile, ...cardsToDestroy];

  // Met à jour l'état du jeu
  return {
    ...gameState,
    columns: updatedColumns,
    currentPlayer: updatedPlayer,
    message: `Le Valet a détruit ${cardsToDestroy.length} cartes de la colonne ${columnSuit}!`
  };
}

// Style pour les boutons d'attaque dorés du Valet
export function getValetAttackButtonStyle(isActive: boolean): string {
  return cn(
    "w-5 h-5 pl-50",
    isActive 
      ? "text-yellow-500 animate-pulse" 
      : "text-gray-400"
  );
}
