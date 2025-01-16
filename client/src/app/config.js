// Configuration de l'application
export const config = {
  // URLs des serveurs
  servers: {
    nextjs: 'http://localhost:3006',  // Serveur Next.js
    api: 'http://localhost:3007',     // API NestJS
  },
  
  // Configuration du jeu
  game: {
    solo: {
      enabled: true,
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
