'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique du composant App pour éviter les problèmes de SSR
const GameApp = dynamic(() => import('../../game-core/App'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p>Chargement du jeu...</p>
      </div>
    </div>
  )
});

export default function SoloGame() {
  return <GameApp />;
}
