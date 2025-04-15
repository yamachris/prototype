"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Loading from "../../components/Loading";
import PageNotFound from "@/components/PageNotFound";
import { useSearchParams } from "next/navigation";
import { gameApi } from "@/services/api";

// Import dynamique du composant App pour éviter les problèmes de SSR
const GameApp = dynamic(() => import("../../game-core/App"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function SoloGame() {
  const searchParams = useSearchParams();
  const [gameState, setGameState] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const gameId = searchParams.get("gameId");

  useEffect(() => {
    if (!gameId) {
      setError("Game ID not found in URL");
      setIsLoading(false);
      return;
    }

    const fetchGameState = async () => {
      try {
        setIsLoading(true);

        const gState = await gameApi.getGameState(gameId);
        gState.gameId = gameId;
        setGameState(gState);
      } catch (err) {
        console.error("Failed to fetch game state:", err);
        setError("Failed to load game. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameState();
  }, [gameId]);

  if (isLoading) return <Loading />;

  if (error) return <PageNotFound />;
  return <GameApp gameState={gameState} />;
}
