// Importation des dépendances nécessaires
import React from 'react';
import { useTranslation } from 'react-i18next'; // Pour la gestion des traductions
import { useGameStore } from '../store/gameStore'; // Pour accéder à l'état du jeu
import { ArrowRight } from 'lucide-react'; // Icône de flèche
import { cn } from '../utils/cn'; // Utilitaire pour la gestion des classes CSS

// Interface définissant les props du composant PhaseManager
interface PhaseManagerProps {
  totalCards: number; // Nombre total de cartes en main
}

// Composant qui gère le passage entre les différentes phases du jeu
export function PhaseManager({ totalCards }: PhaseManagerProps) {
  // Récupération de la fonction de traduction
  const { t } = useTranslation();
  
  // Récupération des états et fonctions nécessaires depuis le store
  const { 
    setPhase,    // Fonction pour changer la phase
    phase,       // Phase actuelle du jeu
    currentPlayer // Joueur actuel
  } = useGameStore();

  // Gestion du passage à la phase suivante
  const handleNextPhase = () => {
    if (totalCards === 7) {
      console.log("Phase suivante : Défausse");
      setPhase('discard'); // Si le joueur a 7 cartes, on passe à la phase de défausse
    } else if (totalCards < 7) {
      console.log("Phase suivante : Pioche");
      setPhase('draw'); // Si le joueur a moins de 7 cartes, on passe à la phase de pioche
    } else {
      console.error("Erreur : Nombre de cartes en main supérieur à 7");
    }
  };

  // Vérifie si le joueur peut passer à la phase suivante
  const canProceed = phase !== 'action' && currentPlayer.hand.length <= 7;

  // Rendu du bouton pour passer à la phase suivante
  return (
    <button
      onClick={handleNextPhase}
      disabled={!canProceed}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300",
        canProceed
          ? "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:hover:bg-blue-800/70 dark:text-blue-300"
          : "bg-gray-100 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600 cursor-not-allowed"
      )}
    >
      <ArrowRight className="w-4 h-4" />
      <span>{t('game.actions.nextPhase')}</span>
    </button>
  );
}

// Interface définissant les props du composant TurnStart
interface TurnStartProps {
  onTurnStart: () => void; // Fonction appelée au début du tour
}

// Composant qui gère le début d'un nouveau tour
export function TurnStart({ onTurnStart }: TurnStartProps) {
  const { t } = useTranslation();
  const { 
    currentPlayer, // Joueur actuel
    phase,        // Phase actuelle
    setPhase      // Fonction pour changer la phase
  } = useGameStore();

  // Gestion du début du tour
  const handleTurnStart = () => {
    const totalCards = currentPlayer.hand.length;
    console.log("Début du tour avec", totalCards, "cartes");
    
    // Détermine la phase initiale en fonction du nombre de cartes
    if (totalCards <= 7) {
      if (totalCards === 7) {
        setPhase('discard'); // Si 7 cartes, commence par la défausse
      } else {
        setPhase('draw'); // Si moins de 7 cartes, commence par la pioche
      }
    }
    
    onTurnStart(); // Appelle la fonction callback fournie en props
  };

  // Vérifie si le joueur peut commencer son tour
  const canStartTurn = phase === 'action';

  // Rendu du bouton pour commencer le tour
  return (
    <button
      onClick={handleTurnStart}
      disabled={!canStartTurn}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300",
        canStartTurn
          ? "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/50 dark:hover:bg-green-800/70 dark:text-green-300"
          : "bg-gray-100 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600 cursor-not-allowed"
      )}
    >
      <ArrowRight className="w-4 h-4" />
      <span>{t('game.actions.startTurn')}</span>
    </button>
  );
}
