import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import "./SacrificePopup.css";
import { Card } from "../types/game";

export const JokerExchangePopup: React.FC = () => {
  const {
    showJokerExchangePopup,
    availableCards,
    selectedCards,
    setSelectedJokerExchangeCards,
    closeJokerExchangePopup,
    handleJokerExchange,
    checkRevolution,
  } = useGameStore();

  if (!showJokerExchangePopup) return null;

  const requiredCards = 1;
  const handleCardSelect = (selectedCard: Card) => {
    if (selectedCards.includes(selectedCard)) {
      setSelectedJokerExchangeCards(selectedCards.slice(0, -1));
    } else {
      setSelectedJokerExchangeCards([selectedCard]);
    }
  };

  const handleClose = () => {
    closeJokerExchangePopup();
  };

  const handleConfirm = () => {
    if (selectedCards.length === requiredCards) {
      handleJokerExchange(selectedCards[0]);
      setSelectedJokerExchangeCards([]);
      handleClose();

      checkRevolution(selectedCards[0].suit);
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit.toLowerCase()) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  };

  const groupCardsBySuit = () => {
    const grouped = {
      hearts: [] as Card[],
      diamonds: [] as Card[],
      clubs: [] as Card[],
      spades: [] as Card[],
    };

    availableCards.forEach((card) => {
      grouped[card.suit.toLowerCase() as keyof typeof grouped].push(card);
    });

    return grouped;
  };

  const groupedCards = groupCardsBySuit();

  return (
    <div className="sacrifice-popup-overlay">
      <div className="sacrifice-popup">
        <div className="popup-header">
          {/* <h2>Exchange pour le {getCardName(specialCard)}</h2> */}
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <p className="selection-info">
          Sélectionnez {requiredCards} cartes à échanger avec le joker ({selectedCards.length} sélectionnée )
        </p>

        <div className="suits-container">
          {Object.entries(groupedCards).map(([suit, cards]) => (
            <div key={suit} className="suit-column">
              <div className={`suit-header ${suit}`}>{getSuitSymbol(suit)}</div>
              <div className="suit-cards">
                {cards.map((card) => {
                  return (
                    <div
                      key={card.id}
                      className={`card-slot  ${selectedCards.includes(card) ? "selected" : ""}`}
                      onClick={() => handleCardSelect(card)}>
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
            disabled={/*selectedCards.length !== requiredCards*/ false}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};
