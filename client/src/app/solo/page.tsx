'use client';

import { useEffect } from 'react';
import { config } from '../config';

export default function SoloGame() {
  useEffect(() => {
    // Redirection vers le jeu solo existant sur Vite
    window.location.href = config.game.solo.viteUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirection vers le jeu solo...</p>
      </div>
    </div>
  );
}
