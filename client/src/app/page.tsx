"use client";

import { useState } from "react";
import Loading from "../components/Loading";

import { gameApi } from "@/services/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSoloGame = async () => {
    try {
      setIsLoading(true);
      const gameId = await gameApi.createGame("solo");
      router.push(`/solo?gameId=${gameId}`);
    } catch (error) {
      console.error("Error starting solo game:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">UNIT Card Game</h1>

        <div className="space-y-4">
          <button
            onClick={handleSoloGame}
            disabled={isLoading}
            className={`block w-64 px-6 py-3 text-white rounded-lg transition-colors ${
              isLoading ? "bg-blue-800 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
            }`}>
            {isLoading ? "Loading..." : "Mode Solo"}
          </button>

          <button
            className="block w-64 px-6 py-3 bg-gray-600 text-white rounded-lg opacity-50 cursor-not-allowed"
            disabled>
            Mode Online (Bientôt disponible)
          </button>
        </div>
      </div>
    </div>
  );
}
