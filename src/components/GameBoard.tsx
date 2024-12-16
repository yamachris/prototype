import React from 'react';
import { useGameStore } from '../store/gameStore';
import { UnitColumn } from './UnitColumn';
import { Suit } from '../types/game';
import { canActivateColumn } from '../utils/gameLogic';
import { RevolutionPopup } from './RevolutionPopup';

export function GameBoard() {
  const { 
    selectedCards,
    columns,
    handleCardPlace,
    phase,
    checkRevolution
  } = useGameStore();

  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

  const canPlaceCard = (suit: Suit) => {
    if (phase !== 'action') return false;

    // Pour l'activation avec As + JOKER/7
    if (selectedCards.length === 2) {
      const [card1, card2] = selectedCards;
      
      // Vérifier si c'est une activation de tête
      const hasFaceCard = (card1.value === 'J' || card1.value === 'K') || 
                         (card2.value === 'J' || card2.value === 'K');
      const hasActivator = (card1.type === 'joker' || card1.value === '7') || 
                          (card2.type === 'joker' || card2.value === '7');

      // Les têtes de jeu peuvent toujours être jouées avec un activateur, peu importe l'état de la colonne
      if (hasFaceCard && hasActivator) {
        const faceCard = selectedCards.find(card => card.value === 'J' || card.value === 'K');
        // On vérifie uniquement que la tête correspond à la couleur de la colonne
        return faceCard?.suit === suit;
      }

      // Vérifier si c'est une Dame + activateur
      const hasQueen = (card1.value === 'Q' || card2.value === 'Q');
      if (hasQueen && hasActivator) {
        return true;
      }

      // Pour l'activation avec As + Activateur (JOKER ou 7)
      const hasAs = (card1.value === 'A' || card2.value === 'A');
      if (hasAs && hasActivator) {
        const ace = selectedCards.find(card => card.value === 'A');
        return ace?.suit === suit;
      }
    }

    // Pour le placement normal de cartes
    if (selectedCards.length === 1) {
      const column = columns[suit];
      if (!column.hasLuckyCard) return false;
      return selectedCards[0].suit === suit || selectedCards[0].type === 'joker';
    }

    return false;
  };

  const handleColumnClick = (suit: Suit) => {
    if (!canPlaceCard(suit)) return;

    handleCardPlace(suit, columns[suit].cards.length);
    
    // Vérifie si une révolution se produit après le placement de la carte
    checkRevolution(suit);
  };

  return (
    <div className="bg-gradient-to-br from-green-50/95 to-green-100/95 dark:from-gray-800/95 dark:to-gray-700/95 rounded-2xl p-4 md:p-6 shadow-xl transition-colors duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {suits.map((suit) => (
          <UnitColumn
            key={suit}
            suit={suit}
            column={columns[suit]}
            onCardPlace={() => handleColumnClick(suit)}
            isActive={canPlaceCard(suit)}
          />
        ))}
      </div>
      <RevolutionPopup />
    </div>
  );
}