import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { AudioManager } from '../sound-design/audioManager';

export function useTurnTimer() {
  const warningThreshold = 5; // Seuil d'avertissement en secondes
  
  // Référence locale pour éviter les appels multiples au timeout
  const [timeoutHandled, setTimeoutHandled] = useState(false);
  
  // Récupération des états du store
  const { 
    phase,
    timeLeft,
    turn,
    consecutiveTimeouts,
    totalTimeouts,
    showTimeoutPopup,
    showSpeedTurnPopup
  } = useGameStore();
  
  // Récupération des actions du store
  const {
    handleTimeOutFixed,
    closeTimeoutPopup,
    closeSpeedTurnPopup,
    startTurnTimer
  } = useGameStore.getState();

  // Démarrer le timer UNIQUEMENT quand le tour change, pas à chaque phase
  useEffect(() => {
    if (phase === 'setup') return;
    
    console.log(`Nouveau Tour ${turn}, démarrage du timer de 30 secondes`);
    
    // Reset le flag à chaque TOUR (pas à chaque phase)
    setTimeoutHandled(false);
    
    // Démarrer le timer (toujours 30 secondes en mode solo)
    startTurnTimer();
  }, [turn]); // Dépendance UNIQUEMENT sur turn, pas sur phase

  // Gérer le décompte du timer
  useEffect(() => {
    // Ne pas gérer le timer en phase de setup ou si pas de timer
    if (phase === 'setup' || timeLeft === undefined) return;
    
    // Ne rien faire si on a déjà géré ce timeout
    if (timeoutHandled) return;
    
    const timer = setInterval(() => {
      // Mettre à jour le timeLeft dans le store (sécurité pour récupérer l'état le plus récent)
      const currentState = useGameStore.getState();
      const currentTimeLeft = currentState.timeLeft;
      
      if (currentTimeLeft <= 0) {
        // Ne rien faire si on a déjà géré ce timeout
        if (timeoutHandled) return;
        
        // Arrêter le timer et marquer comme géré
        clearInterval(timer);
        setTimeoutHandled(true);
        
        console.log("⏰ TIMER EXPIRÉ - Défausse automatique déclenchée");
        
        // Jouer le son d'alerte
        const audioManager = AudioManager.getInstance();
        audioManager.playSacrificeSound();
        
        // Appel à la fonction de timeout (avec délai pour éviter les problèmes)
        setTimeout(() => {
          handleTimeOutFixed();
        }, 100);
        
        return;
      }
      
      // Mettre à jour le timer
      if (currentTimeLeft > 0) {
        useGameStore.setState({ timeLeft: currentTimeLeft - 1 });
      }
      
      // Alerte sonore quand on atteint le seuil d'avertissement
      if (currentTimeLeft === warningThreshold) {
        console.log("⚠️ AVERTISSEMENT - 5 secondes restantes");
        const audioManager = AudioManager.getInstance();
        audioManager.playCardSound();
      }
    }, 1000);

    // Nettoyer l'intervalle quand le composant est démonté
    return () => clearInterval(timer);
  }, [timeLeft, phase, timeoutHandled]);
  
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
    consecutiveTimeouts,
    totalTimeouts,
    showTimeoutPopup,
    showSpeedTurnPopup,
    closeTimeoutPopup,
    closeSpeedTurnPopup,
    timerClasses: getTimerClasses()
  };
}