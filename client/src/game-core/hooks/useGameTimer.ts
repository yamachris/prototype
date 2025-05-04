import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";

export function useGameTimer() {
  const { phase, isGameOver, gameId } = useGameStore();
  const [localGameTime, setLocalGameTime] = useState<number>(0);
  
  // Récupérer le temps stocké dans localStorage à l'initialisation
  useEffect(() => {
    if (gameId) {
      const storedTime = localStorage.getItem(`gameTimer_${gameId}`);
      if (storedTime) {
        const parsedTime = parseInt(storedTime, 10);
        if (!isNaN(parsedTime)) {
          setLocalGameTime(parsedTime);
          timeRef.current = parsedTime;
        }
      }
    }
  }, [gameId]);

  const timeRef = useRef<number>(localGameTime);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (phase === "SETUP" || isGameOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      timeRef.current += 1;
      setLocalGameTime(timeRef.current);
      
      // Sauvegarder dans localStorage
      if (gameId) {
        localStorage.setItem(`gameTimer_${gameId}`, timeRef.current.toString());
      }
      
      useGameStore.setState((state) => ({
        ...state,
        totalGameTime: timeRef.current,
      }));
      
      // Synchroniser avec le serveur tous les 10 secondes
      if (timeRef.current % 10 === 0) {
        // Envoyer le temps au serveur
        const { sendGameTimerUpdate } = useGameStore.getState() as any;
        if (typeof sendGameTimerUpdate === 'function') {
          sendGameTimerUpdate(timeRef.current);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, isGameOver, gameId]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return {
    totalGameTime: localGameTime,
    formattedTotalTime: formatTime(localGameTime),
  };
}
