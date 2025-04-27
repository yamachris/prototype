import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { AudioManager } from '../sound-design/audioManager';

export function useTurnTimer() {
  const warningThreshold = 5; // Seuil d'avertissement en secondes (constant)
  
  const { 
    phase,
    timeLeft,
    consecutiveTimeouts,
    isSpeedTurn,
    showTimeoutPopup,
    showSpeedTurnPopup
  } = useGameStore();
  
  const {
    handleTimeOut,
    closeTimeoutPopup,
    closeSpeedTurnPopup,
    startTurnTimer
  } = useGameStore.getState();

  // Lancer le timer au chargement du composant et à chaque changement de phase
  useEffect(() => {
    if (phase === 'setup') return;
    
    // Démarrer le timer de tour
    startTurnTimer();
  }, [phase]);

  // Gérer le décompte
  useEffect(() => {
    if (phase === 'setup' || timeLeft === undefined) return;
    
    const timer = setInterval(() => {
      // Mettre à jour le timeLeft dans le store
      useGameStore.setState(state => ({
        timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0
      }));
      
      // Si le temps est écoulé, déclencher les conséquences
      if (timeLeft <= 1) {
        clearInterval(timer);
        
        // Jouer un son d'alerte - utiliser le son de sacrifice pour l'alerte
        const audioManager = AudioManager.getInstance();
        audioManager.playSacrificeSound();
        
        // Gérer le timeout - version simple pour éviter le double appel
        console.log("TIMER EXPIRÉ - APPEL DE HANDLETIMEOUT");
        handleTimeOut(); // Appel unique à handleTimeOut()
      }
      
      // Si on atteint le seuil d'avertissement, jouer un son
      if (timeLeft === warningThreshold) {
        // Utiliser un son existant pour l'avertissement
        const audioManager = AudioManager.getInstance();
        audioManager.playCardSound();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, phase]);
  
  // Calculer les classes CSS en fonction de l'état du timer
  const getTimerClasses = () => {
    if (timeLeft <= warningThreshold) {
      return 'text-red-600 animate-pulse';
    }
    return 'text-gray-700';
  };
  
  return {
    timeLeft,
    isWarning: timeLeft <= warningThreshold,
    isSpeedTurn,
    consecutiveTimeouts,
    showTimeoutPopup,
    showSpeedTurnPopup,
    closeTimeoutPopup,
    closeSpeedTurnPopup,
    timerClasses: getTimerClasses()
  };
}