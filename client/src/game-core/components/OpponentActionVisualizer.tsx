import React, { useEffect, useState } from 'react';
import { OpponentAction } from '../../services/socket';
import { Card as CardType } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion'; // Il faudra installer cette dépendance

interface OpponentActionVisualizerProps {
  opponentAction: OpponentAction | null;
  resetAction: () => void;
}

// Affichage stylisé d'une carte pour les animations
const ActionCard: React.FC<{ card: CardType, delay: number }> = ({ card, delay }) => {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-2 flex flex-col items-center justify-center absolute"
      initial={{ scale: 0.6, opacity: 0, y: 50 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: { 
          delay: delay * 0.15,
          type: 'spring',
          stiffness: 200,
          damping: 15
        }
      }}
      exit={{ scale: 0.8, opacity: 0, y: -30 }}
      style={{
        width: '60px',
        height: '90px',
        left: `calc(50% + ${(delay - 1) * 20}px)`,
        zIndex: 10 + delay
      }}
    >
      <div className={`text-${card.suit === 'HEARTS' || card.suit === 'DIAMONDS' ? 'red-600' : 'black'} font-bold`}>
        {card.value}{card.type === 'JOKER' ? '🃏' : ''}
      </div>
      <div className="text-xs mt-1">
        {card.suit === 'HEARTS' ? '♥️' : 
          card.suit === 'DIAMONDS' ? '♦️' : 
          card.suit === 'CLUBS' ? '♣️' : 
          card.suit === 'SPADES' ? '♠️' : ''}
      </div>
    </motion.div>
  );
};

// Animation pour une attaque
const AttackAnimation: React.FC = () => {
  return (
    <motion.div 
      className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="text-red-600 text-4xl font-bold"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ 
          scale: 1.2, 
          rotate: 0,
          transition: { type: 'spring', stiffness: 300, damping: 10 }
        }}
        exit={{ scale: 0, rotate: 20 }}
      >
        ATTAQUE!
      </motion.div>
    </motion.div>
  );
};

// Animation pour un blocage
const BlockAnimation: React.FC = () => {
  return (
    <motion.div 
      className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="text-blue-600 text-4xl font-bold"
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1.2,
          transition: { type: 'spring', stiffness: 300, damping: 10 }
        }}
        exit={{ scale: 0 }}
      >
        BLOQUÉ!
      </motion.div>
    </motion.div>
  );
};

// Composant principal
export const OpponentActionVisualizer: React.FC<OpponentActionVisualizerProps> = ({ 
  opponentAction, 
  resetAction 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (opponentAction) {
      setShowAnimation(true);
      
      // Masquer l'animation après 2 secondes
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setTimeout(resetAction, 300); // Réinitialiser après la fin de l'animation
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [opponentAction, resetAction]);

  if (!opponentAction || !showAnimation) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <AnimatePresence>
        {showAnimation && (
          <motion.div 
            className="relative bg-black/10 p-4 rounded-xl backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center font-semibold mb-2 text-white text-shadow">
              {opponentAction.actionType === 'placeCard' && 'L\'adversaire a placé des cartes!'}
              {opponentAction.actionType === 'drawCard' && 'L\'adversaire a pioché une carte!'}
              {opponentAction.actionType === 'discardCard' && 'L\'adversaire a défaussé une carte!'}
              {opponentAction.actionType === 'attack' && 'L\'adversaire lance une attaque!'}
              {opponentAction.actionType === 'block' && 'L\'adversaire a bloqué une colonne!'}
            </div>
            
            <div className="relative h-28 w-full min-w-64">
              {opponentAction.actionType === 'placeCard' && opponentAction.cards?.map((card, index) => (
                <ActionCard key={`${card.id}-${index}`} card={card} delay={index} />
              ))}
              
              {opponentAction.actionType === 'attack' && <AttackAnimation />}
              
              {opponentAction.actionType === 'block' && <BlockAnimation />}
            </div>
            
            {opponentAction.targetSuit && (
              <div className="mt-2 text-center text-white">
                Colonne cible: {
                  opponentAction.targetSuit === 'HEARTS' ? '♥️ Cœurs' : 
                  opponentAction.targetSuit === 'DIAMONDS' ? '♦️ Carreaux' : 
                  opponentAction.targetSuit === 'CLUBS' ? '♣️ Trèfles' : 
                  opponentAction.targetSuit === 'SPADES' ? '♠️ Piques' : ''
                }
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
