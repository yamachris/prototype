'use client';

import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

export default function OnlineGame() {
  const router = useRouter();
  const socket = useSocket();
  const [gameState, setGameState] = useState('connecting');

  useEffect(() => {
    if (socket.socket) {
      socket.socket.on('connect', () => {
        setGameState('connected');
      });

      socket.socket.on('disconnect', () => {
        setGameState('disconnected');
      });
    }
  }, [socket.socket]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <nav className="bg-gray-800 p-4 shadow-lg">
        <button
          onClick={() => router.push('/')}
          className="text-gray-300 hover:text-white"
        >
          ← Retour à l'accueil
        </button>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Mode Online</h1>

        <div className="bg-gray-800 rounded-lg p-6">
          {/* État de la connexion */}
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  gameState === 'connected'
                    ? 'bg-green-500'
                    : gameState === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-gray-300">
                {gameState === 'connected'
                  ? 'Connecté au serveur'
                  : gameState === 'connecting'
                  ? 'Connexion en cours...'
                  : 'Déconnecté'}
              </span>
            </div>
          </div>

          {/* Interface du jeu en ligne */}
          <div className="space-y-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Parties disponibles</h2>
              <p className="text-gray-400">
                La liste des parties sera affichée ici...
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={gameState !== 'connected'}
              >
                Créer une partie
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={gameState !== 'connected'}
              >
                Rejoindre une partie
              </button>
            </div>
          </div>

          {/* Message de développement */}
          <div className="mt-8 p-4 bg-yellow-500/20 rounded-lg">
            <h3 className="text-yellow-500 font-semibold mb-2">Mode en développement</h3>
            <p className="text-gray-300">
              Le mode multijoueur est actuellement en cours de développement.
              De nouvelles fonctionnalités seront ajoutées prochainement.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
