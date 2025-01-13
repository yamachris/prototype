# Projet de Jeu de Cartes v2

Ce projet est une application de jeu de cartes interactive développée avec React et TypeScript.

## Structure du Projet

### `/src` - Code Source Principal
- `components/` : Composants React réutilisables
  - `GameBoard.tsx` : Plateau de jeu principal
  - `Card.tsx` : Composant de carte
  - `PlayerArea.tsx` : Zone de jeu du joueur
  - `MusicToggle.tsx` : Contrôle de la musique
  - Et autres composants d'interface utilisateur

### Dossiers Principaux
- `ai/` : Logique de l'intelligence artificielle
  - `AIGameManager.ts` : Gestion du jeu par l'IA
  - `AIPlayer.ts` : Comportement des joueurs IA

- `core/` : Logique métier fondamentale
  - `GameManager.ts` : Gestion principale du jeu
  - `RuleManager.ts` : Gestion des règles du jeu
  - `interfaces/` : Interfaces TypeScript

- `hooks/` : Hooks React personnalisés
  - `useGameState.ts` : Gestion de l'état du jeu
  - `useCardManagement.ts` : Gestion des cartes
  - `useTurnTimer.ts` : Gestion du temps de tour

- `i18n/` : Internationalisation
  - Fichiers de traduction pour différentes langues
  - Configuration i18n

- `services/` : Services et utilitaires
  - `api.ts` : Services d'API
  - `deck.ts` : Gestion du deck
  - `gameLogic.ts` : Logique du jeu

- `sound-design/` : Gestion audio
  - `audioManager.ts` : Gestionnaire des effets sonores et musiques

- `store/` : Gestion de l'état global
  - `GameStore.ts` : Store principal
  - `slices/` : Reducers et actions

- `styles/` : Fichiers de style
  - CSS et configurations Tailwind

- `tests/` : Tests unitaires et d'intégration
  - Tests des composants et de la logique

- `types/` : Types TypeScript
  - Définitions de types pour le jeu

- `utils/` : Fonctions utilitaires
  - Helpers et fonctions réutilisables

### Fichiers de Configuration
- `.env` : Variables d'environnement
- `package.json` : Dépendances et scripts
- `tsconfig.json` : Configuration TypeScript
- `vite.config.ts` : Configuration Vite
- `tailwind.config.js` : Configuration Tailwind CSS

## Technologies Utilisées
- React
- TypeScript
- Vite
- Tailwind CSS
- i18next pour l'internationalisation
- WebSocket pour le multijoueur
- SQLite pour le stockage local

## Installation

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build pour la production
npm run build
```

## Fonctionnalités Principales
- Jeu de cartes interactif
- Mode multijoueur
- Intelligence artificielle pour les adversaires
- Système de règles personnalisables
- Support multilingue
- Effets sonores et musique
- Interface adaptative (responsive)
- Mode sombre/clair

## Contribution
Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à proposer une pull request.
