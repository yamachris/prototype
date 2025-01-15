// Configuration de l'application
export const config = {
  // URLs des serveurs
  servers: {
    nextjs: 'http://localhost:3000',  // Serveur Next.js
    api: 'http://localhost:3001',     // API NestJS
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
