import React from 'react';
import { useGameStore } from '../store/gameStore';
import './SacrificePopup.css';
import { Card } from '../types/game';

export const SacrificePopup: React.FC = () => {
  const { 
    showSacrificePopup, 
    availableCards, 
    sacrificeSpecialCard, 
    setSacrificeMode, 
    selectedCards: selectedSpecialCards,
    setSelectedSacrificeCards,
    selectedSacrificeCards 
  } = useGameStore();

  if (!showSacrificePopup || selectedSpecialCards.length === 0) return null;

  const specialCard = selectedSpecialCards[0];
  const requiredCards = specialCard.value === 'K' ? 3 : specialCard.value === 'Q' ? 2 : 1;

  const getHighestValueInSuit = (cards: Card[]): number => {
    return Math.max(...cards.map(card => parseInt(card.value) || 0));
  };

  const isCardSelectable = (card: Card, suitCards: Card[]): boolean => {
    // Pour le Valet, uniquement 8 ou 9, en commençant par la plus haute
    if (specialCard.value === 'J') {
      const cardValue = parseInt(card.value) || 0;
      if (!['8', '9'].includes(card.value)) {
        return false;
      }
      
      // Vérifier s'il y a une carte plus haute disponible
      const higherCard = suitCards.find(c => {
        const value = parseInt(c.value) || 0;
        return c.suit === card.suit && value > cardValue && !selectedSacrificeCards.includes(c);
      });
      
      return !higherCard; // Sélectionnable seulement s'il n'y a pas de carte plus haute
    }

    const { columns } = useGameStore.getState();
    const columnCards = columns[card.suit].cards;
    
    // Vérifier la présence d'un 7 dans la colonne
    const hasSeven = columnCards.some(c => c.value === '7');
    
    if (hasSeven) {
      const cardValue = parseInt(card.value) || 0;
      // Si un 7 est présent dans la colonne, seules les cartes 8 et 9 sont sélectionnables
      return cardValue > 7;
    }

    // Pour une même suite, on doit sacrifier dans l'ordre décroissant
    const cardValue = parseInt(card.value) || 0;
    const higherCards = suitCards.filter(c => {
      const value = parseInt(c.value) || 0;
      return c.suit === card.suit && value > cardValue && !selectedSacrificeCards.includes(c);
    });

    return higherCards.length === 0;
  };

  const isValidSelection = (cards: Card[]): boolean => {
    if (cards.length === 0) return true;
    if (specialCard.value === 'J') {
      return cards.every(card => ['8', '9'].includes(card.value));
    }
    return true;
  };

  const handleCardSelect = (card: Card, suitCards: Card[]) => {
    if (!isCardSelectable(card, suitCards)) return;

    // Si la carte est déjà sélectionnée
    if (selectedSacrificeCards.includes(card)) {
      // On ne peut désélectionner que la dernière carte sélectionnée
      if (selectedSacrificeCards[selectedSacrificeCards.length - 1].id === card.id) {
        setSelectedSacrificeCards(selectedSacrificeCards.slice(0, -1));
      }
      // Si ce n'est pas la dernière carte, on ne fait rien
      return;
    }

    // Pour une nouvelle sélection, on procède normalement
    if (selectedSacrificeCards.length < requiredCards) {
      setSelectedSacrificeCards([...selectedSacrificeCards, card]);
    }
  };

  const handleClose = () => {
    setSelectedSacrificeCards([]);
    setSacrificeMode(false);
  };

  const handleConfirm = () => {
    if (selectedSacrificeCards.length === requiredCards) {
      sacrificeSpecialCard(selectedSacrificeCards);
      setSelectedSacrificeCards([]);
      setSacrificeMode(false);
    }
  };

  const getCardName = (card: Card): string => {
    const suitNames: Record<string, string> = {
      hearts: '♥️ Cœur',
      diamonds: '♦️ Carreau',
      clubs: '♣️ Trèfle',
      spades: '♠️ Pique'
    };

    const valueNames: Record<string, string> = {
      'J': 'Valet',
      'Q': 'Dame',
      'K': 'Roi'
    };

    const cardName = valueNames[card.value] || card.value;
    return `${cardName} de ${suitNames[card.suit]}`;
  };

  const getTitle = () => {
    switch (specialCard.value) {
      case 'K': return '👑 Sacrifice pour Roi';
      case 'Q': return '👸 Sacrifice pour Dame';
      case 'J': return '🤴 Sacrifice pour Valet';
      default: return '';
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit.toLowerCase()) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const groupCardsBySuit = () => {
    const grouped = {
      hearts: [] as Card[],
      diamonds: [] as Card[],
      clubs: [] as Card[],
      spades: [] as Card[]
    };

    availableCards.forEach(card => {
      grouped[card.suit.toLowerCase() as keyof typeof grouped].push(card);
    });

    return grouped;
  };

  const groupedCards = groupCardsBySuit();

  return (
    <div className="sacrifice-popup-overlay">
      <div className="sacrifice-popup">
        <div className="popup-header">
          <h2>Sacrifice pour le {getCardName(specialCard)}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <p className="selection-info">
          Sélectionnez {requiredCards} cartes à sacrifier ({selectedSacrificeCards.length} sélectionnée{selectedSacrificeCards.length > 1 ? 's' : ''})
        </p>
        <p className="selection-help">
          {specialCard.value === 'J' 
            ? "Sélectionnez uniquement des 8 ou 9"
            : "Sélectionnez les cartes que vous avez jouées sur le terrain (dans l'ordre décroissant pour une même suite)"}
        </p>

        <div className="suits-container">
          {Object.entries(groupedCards).map(([suit, cards]) => (
            <div key={suit} className="suit-column">
              <div className={`suit-header ${suit}`}>
                {getSuitSymbol(suit)}
              </div>
              <div className="suit-cards">
                {cards.map(card => {
                  const isSelectable = isCardSelectable(card, cards);

                  return (
                    <div
                      key={card.id}
                      className={`card-slot ${selectedSacrificeCards.includes(card) ? 'selected' : ''} ${
                        !isSelectable ? 'invalid' : ''
                      }`}
                      onClick={() => handleCardSelect(card, cards)}
                    >
                      {card.value}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="popup-actions">
          <button className="cancel-button" onClick={handleClose}>
            Annuler
          </button>
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={selectedSacrificeCards.length !== requiredCards}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};
