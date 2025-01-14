// Configuration de l'application
export const config = {
  // URLs des serveurs
  servers: {
    nextjs: 'http://localhost:3004',  // Serveur Next.js pour le mode online
    vite: 'http://localhost:3001',    // Serveur Vite pour le mode solo existant
    api: 'http://localhost:3004/api', // API pour le mode online
  },
  
  // Configuration du jeu
  game: {
    solo: {
      enabled: true,
      viteUrl: 'http://localhost:3001', // URL du jeu solo existant sur Vite
    },
    online: {
      enabled: false,
      comingSoon: true,
    },
  },
  
  // Configuration de l'interface
  ui: {
    theme: 'dark',
    animation: true,
    sound: true,
  },
};
