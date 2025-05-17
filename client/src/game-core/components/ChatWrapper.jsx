'use client';

import { useEffect } from 'react';
import { setupBasicChat } from './BasicChat';
import { useGameStore } from '../store/gameStore';

// Composant simple qui va initialiser notre chat en JS pur
export default function ChatWrapper() {
  // Obtenir une référence au store Zustand
  // On doit utiliser l'API Zustand pour s'abonner directement au store
  const storeRef = useGameStore;
  
  useEffect(() => {
    // Initialiser le chat
    const cleanup = setupBasicChat(store);
    
    // Nettoyer quand le composant est démonté
    return cleanup;
  }, [store]);
  
  // Ce composant ne rend rien visuellement
  return null;
}
