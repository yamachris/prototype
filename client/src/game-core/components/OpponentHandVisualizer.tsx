import React from 'react';
import { Card } from '../types/game';
import { useDarkMode } from '../hooks/useDarkMode';
import { useTranslation } from 'react-i18next';

interface OpponentHandVisualizerProps {
  opponentCards?: Card[];
  showAll?: boolean; // Pour le mode debug ou la fin de la partie
}

// Les valeurs possibles de cartes par couleur, ordonnées de manière logique
// La Dame (Q) est exclue car elle ne se pose pas en jeu selon les règles
const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'K'];

// Les 4 catégories (couleurs)
const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];

// Associer chaque couleur à un symbole et un nom
const suitInfo: Record<string, {symbol: string, name: string, colorClass: string}> = {
  'HEARTS': { symbol: '♥️', name: 'Cœurs', colorClass: 'text-red-500' },
  'DIAMONDS': { symbol: '♦️', name: 'Carreaux', colorClass: 'text-red-500' },
  'CLUBS': { symbol: '♣️', name: 'Trèfles', colorClass: 'text-gray-800 dark:text-gray-300' },
  'SPADES': { symbol: '♠️', name: 'Piques', colorClass: 'text-gray-800 dark:text-gray-300' }
};

export const OpponentHandVisualizer: React.FC<OpponentHandVisualizerProps> = ({ 
  opponentCards = [], 
  showAll = false 
}) => {
  // Utilisation du mode jour/nuit
  const { isDark } = useDarkMode();
  
  // Création d'un tableau pour suivre quelles cartes sont dans la main de l'adversaire
  const opponentCardMap: Record<string, boolean> = {};
  
  // Remplir le tableau avec les cartes de l'adversaire
  opponentCards.forEach(card => {
    if (card.suit && card.value) {
      const cardKey = `${card.suit}-${card.value}`;
      opponentCardMap[cardKey] = true;
    }
  });

  // Les cartes importantes à afficher
  const importantCards = ['J', 'K', 'A', '10'];
  
  // Hook de traduction
  const { t } = useTranslation();

  return (
    <div className="relative p-1 bg-gray-100/70 dark:bg-gray-800/70 rounded-md shadow-sm mb-2">
      {/* Texte ajouté entre les enseignes */}
      <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 z-10">
        <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('game.ui.opponentCards')}</span>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1">
        
        {suits.map(suit => (
          <div key={suit} className="rounded px-1">
            <div className="flex items-center justify-center mb-1">
              <span className={`text-sm ${suitInfo[suit].colorClass}`}>
                {suitInfo[suit].symbol}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-1">
              {/* Figures (J, K) avec une taille et bordure distinctive */}
              <div 
                key={`${suit}-J`}
                className={`
                  w-4 h-4 rounded-full flex items-center justify-center
                  ${showAll && opponentCardMap[`${suit}-J`] ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}
                  border border-yellow-400
                `}
                title={`J de ${suitInfo[suit].name}`}
              >
                <span className="text-[8px] text-black dark:text-white font-bold">J</span>
              </div>
              
              <div 
                key={`${suit}-K`}
                className={`
                  w-4 h-4 rounded-full flex items-center justify-center
                  ${showAll && opponentCardMap[`${suit}-K`] ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}
                  border border-yellow-400
                `}
                title={`K de ${suitInfo[suit].name}`}
              >
                <span className="text-[8px] text-black dark:text-white font-bold">K</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-[2px] mt-1">
              {/* Points minimalistes pour les cartes A-10 avec valeurs */}
              {['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(value => {
                const cardKey = `${suit}-${value}`;
                const hasCard = showAll ? opponentCardMap[cardKey] : false;
                const isImportant = importantCards.includes(value);
                // Utiliser As pour A et R pour 10/0 (comme dans UnitColumn)
                let displayValue = value;
                if (value === 'A') displayValue = 'As';
                if (value === '10') displayValue = 'R';
                
                return (
                  <div 
                    key={cardKey}
                    className={`
                      w-4 h-4 rounded-full flex items-center justify-center
                      ${hasCard ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}
                      ${isImportant ? 'ring-1 ring-blue-700' : ''}
                    `}
                    title={value === '10' 
                      ? `10 ${t('game.cards.of')} ${t('game.cards.revolution')} ${t(`game.cards.suits.${suit.toLowerCase()}`)}`
                      : `${value === 'A' ? t('game.cards.as') : displayValue} ${t('game.cards.of')} ${t(`game.cards.suits.${suit.toLowerCase()}`)}`
                    }
                  >
                    <span className="text-[7px] text-black dark:text-white font-bold">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
