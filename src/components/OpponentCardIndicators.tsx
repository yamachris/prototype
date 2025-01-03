import React from 'react';
import { Card, Suit } from '../types/game';
import { cn } from '../utils/cn';

interface OpponentCardIndicatorsProps {
  opponentCards: Card[];
  activeCard?: Card | null;
}

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'K'];

export const OpponentCardIndicators: React.FC<OpponentCardIndicatorsProps> = ({
  opponentCards,
  activeCard
}) => {
  const getIndicatorStyle = (suit: Suit, value: string) => {
    const card = opponentCards.find(c => c.suit === suit && c.value === value);
    const isActive = activeCard?.suit === suit && activeCard?.value === value;
    const isSpecial = value === 'J' || value === 'K';

    return cn(
      'w-2 h-2 rounded-full transition-all duration-300',
      isActive && 'animate-pulse',
      isSpecial ? (
        card 
          ? 'bg-yellow-400' 
          : 'bg-yellow-900/30'
      ) : (
        card 
          ? 'bg-green-500' 
          : 'bg-gray-600/30'
      )
    );
  };

  return (
    <div className="p-2 bg-gray-800/50 rounded-lg">
      <div className="grid grid-cols-4 gap-4">
        {suits.map((suit) => (
          <div key={suit} className="flex flex-col gap-1">
            <div className="text-center text-xs text-gray-400">
              {suit === 'hearts' && '♥️'}
              {suit === 'diamonds' && '♦️'}
              {suit === 'clubs' && '♣️'}
              {suit === 'spades' && '♠️'}
            </div>
            <div className="flex flex-col gap-1">
              {values.map((value) => (
                <div
                  key={`${suit}-${value}`}
                  className={getIndicatorStyle(suit, value)}
                  title={`${value} of ${suit}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
