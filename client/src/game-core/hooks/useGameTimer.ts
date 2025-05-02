import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import axios from "axios";

export function useGameTimer() {
  const { phase, isGameOver, gameId, totalGameTime } = useGameStore();

  // Utiliser le temps sauvegardé dans le store s'il existe, sinon démarrer à 0
  const timeRef = useRef<number>(totalGameTime || 0);
  const timerRef = useRef<NodeJS.Timeout>();
  const saveIntervalRef = useRef<NodeJS.Timeout>();

  // Récupère le temps initial au chargement de la page si un gameId est présent
  useEffect(() => {
    if (gameId && phase !== "SETUP") {
      // Initialiser le timer avec la valeur du serveur
      timeRef.current = totalGameTime || 0;
    }
  }, [gameId, phase, totalGameTime]);

  // Gère le timer principal
  useEffect(() => {
    if (phase === "SETUP" || isGameOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      return;
    }

    // Timer local qui incrémente chaque seconde
    timerRef.current = setInterval(() => {
      timeRef.current += 1;
      useGameStore.setState((state) => ({
        ...state,
        totalGameTime: timeRef.current,
      }));
    }, 1000);

    // Timer qui sauvegarde le temps sur le serveur toutes les 10 secondes
    if (gameId) {
      saveIntervalRef.current = setInterval(() => {
        axios.post(`http://localhost:3007/game/${gameId}/update-time`, {
          totalGameTime: timeRef.current,
        }).catch(error => {
          console.error("Erreur lors de la sauvegarde du temps de jeu:", error);
        });
      }, 10000); // Sauvegarde toutes les 10 secondes
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [phase, isGameOver, gameId]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return {
    totalGameTime: timeRef.current,
    formattedTotalTime: formatTime(timeRef.current),
  };
}
