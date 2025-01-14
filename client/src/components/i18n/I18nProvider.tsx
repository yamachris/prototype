'use client';

import { useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Phases du jeu
      preparationPhase: 'Phase de préparation',
      playPhase: 'Phase de jeu',
      endPhase: 'Phase de fin',
      
      // Messages
      selectCardsForReserve: 'Veuillez sélectionner 2 cartes pour votre réserve',
      yourHand: 'Votre main',
      reserve: 'Réserve',
      
      // Boutons
      block: 'Bloquer',
      endTurn: 'Fin du tour',
      playCard: 'Jouer une carte',
      drawCard: 'Piocher une carte',
      
      // Statuts
      cardsLeft: 'cartes restantes',
      selectedCards: 'cartes sélectionnées',
    }
  }
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    i18next
      .use(initReactI18next)
      .init({
        resources,
        lng: 'fr',
        interpolation: {
          escapeValue: false
        }
      });
  }, []);

  return <>{children}</>;
}
