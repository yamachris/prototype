Structure optimale pour un mode deux joueurs avec réactions aux attaques
Je vais vous expliquer étape par étape comment implémenter une structure optimale pour le mode deux joueurs avec possibilité de réagir aux attaques adverses.

Étape 1 : Enrichir le modèle de données
Commençons par ajouter les propriétés nécessaires à notre modèle de données pour supporter le mode multijoueur et les réactions.

Modification de GameState
La première étape consiste à enrichir le type GameState pour gérer plusieurs joueurs et le système de réaction :


// Dans server/src/types/game.ts
export interface GameState {
  // Propriétés existantes...
  
  // Nouvelles propriétés pour le multijoueur
  players: Player[];            // Liste de tous les joueurs
  activePlayerIndex: number;    // Index du joueur dont c'est le tour
  
  // Système de réaction
  waitingForReaction: boolean;  // Indique si on attend une réaction
  pendingAttack: {              // Informations sur l'attaque en cours
    attackerId: string;         // ID du joueur attaquant
    targetId: string;           // ID du joueur ciblé
    attackCard: Card;           // Carte utilisée pour l'attaque
    attackType: string;         // Type d'attaque (normal, spécial, etc.)
    timeoutAt: number;          // Timestamp de fin du temps de réaction
  } | null;
  reactionTimeMs: number;       // Temps accordé pour réagir (en ms)
}

Cette modification permet de suivre l'état du jeu dans un contexte multijoueur, notamment en gardant trace de qui est le joueur actif et si une réaction à une attaque est en attente.

Modification du type Player
Ensuite, ajoutons des propriétés au type Player pour gérer les réactions :

// Dans server/src/types/game.ts
export interface Player {
  // Propriétés existantes...
  
  // Propriétés pour les réactions
  canReact: boolean;            // Ce joueur peut-il réagir actuellement
  availableReactions: string[]; // Types de réactions disponibles
}

Étape 2 : Implémenter le service de gestion des tours
Le système de tours est fondamental dans un jeu à deux joueurs. Ajoutons une méthode pour gérer les changements de tour.

// Dans server/src/game/game.service.ts
async switchTurn(gameId: string): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Passer au joueur suivant
  gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
  
  // Mettre à jour le joueur courant (pour compatibilité avec le code existant)
  gameState.currentPlayer = gameState.players[gameState.activePlayerIndex];
  
  // Réinitialiser les états du tour
  gameState.hasDrawn = false;
  gameState.hasDiscarded = false;
  gameState.hasPlayedAction = false;
  
  // Incrémenter le compteur de tours si on est revenu au premier joueur
  if (gameState.activePlayerIndex === 0) {
    gameState.turn++;
  }
  
  // Sauvegarder l'état
  game.state = gameState;
  await this.gameRepository.save(game);
  
  return gameState;
}

Cette méthode permet de passer le tour au joueur suivant et de réinitialiser les états liés au tour.

Étape 3 : Système d'attaque avec réaction
Le cœur de notre fonctionnalité est le système qui permet à un joueur d'attaquer et à l'autre de réagir.

Initier une attaque

// Dans server/src/game/game.service.ts
async initiateAttack(gameId: string, targetPlayerId: string, card: Card): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Vérifier que c'est bien le tour du joueur
  const attackerId = gameState.currentPlayer.id;
  if (gameState.players[gameState.activePlayerIndex].id !== attackerId) {
    return gameState; // Ce n'est pas le tour de ce joueur
  }
  
  // Identifier le type d'attaque selon la carte
  const attackType = this.determineAttackType(card);
  
  // Configurer l'attaque en attente
  gameState.waitingForReaction = true;
  gameState.pendingAttack = {
    attackerId,
    targetId: targetPlayerId,
    attackCard: card,
    attackType,
    timeoutAt: Date.now() + gameState.reactionTimeMs
  };
  
  // Donner au joueur ciblé la possibilité de réagir
  const targetPlayerIndex = gameState.players.findIndex(p => p.id === targetPlayerId);
  if (targetPlayerIndex !== -1) {
    gameState.players[targetPlayerIndex].canReact = true;
    
    // Déterminer les réactions disponibles pour ce joueur en fonction de ses cartes
    gameState.players[targetPlayerIndex].availableReactions = 
      this.getAvailableReactions(gameState.players[targetPlayerIndex], attackType);
  }
  
  // Sauvegarder l'état
  game.state = gameState;
  await this.gameRepository.save(game);
  
  return gameState;
}

// Fonction auxiliaire pour déterminer les réactions disponibles
private getAvailableReactions(player: Player, attackType: string): string[] {
  const reactions = ['ACCEPT']; // On peut toujours accepter l'attaque
  
  // Vérifier les cartes en main pour déterminer les réactions possibles
  const hasBlockCard = player.hand.some(card => 
    (card.value === 'K' && ['HEARTS', 'DIAMONDS'].includes(card.suit)) || // Roi rouge
    (card.value === '8')  // 8 = esquive
  );
  
  const hasCounterCard = player.hand.some(card => 
    (card.value === 'J') || // Valet = contre-attaque
    (card.isJoker)   // Joker peut être utilisé pour contrer
  );
  
  if (hasBlockCard) reactions.push('BLOCK');
  if (hasCounterCard) reactions.push('COUNTER');
  
  return reactions;
}

Traiter une réaction

// Dans server/src/game/game.service.ts
async handleReaction(gameId: string, reactionType: string, reactionCard?: Card): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Vérifier qu'une réaction est bien attendue
  if (!gameState.waitingForReaction || !gameState.pendingAttack) {
    return gameState;
  }
  
  // Récupérer les indices des joueurs concernés
  const targetPlayerIndex = gameState.players.findIndex(p => p.id === gameState.pendingAttack.targetId);
  const attackerPlayerIndex = gameState.players.findIndex(p => p.id === gameState.pendingAttack.attackerId);
  
  if (targetPlayerIndex === -1 || attackerPlayerIndex === -1) {
    return gameState;
  }
  
  // Traiter la réaction selon son type
  switch (reactionType) {
    case 'BLOCK':
      if (reactionCard) {
        // Enlever la carte de blocage de la main du joueur
        gameState.players[targetPlayerIndex].hand = 
          gameState.players[targetPlayerIndex].hand.filter(c => c.id !== reactionCard.id);
        
        gameState.players[targetPlayerIndex].discardPile.push(reactionCard);
        
        // Message de blocage réussi
        gameState.message = `${gameState.players[targetPlayerIndex].name} a bloqué l'attaque avec ${reactionCard.value} de ${reactionCard.suit}!`;
      }
      break;
      
    case 'COUNTER':
      if (reactionCard) {
        // Enlever la carte de contre-attaque de la main du joueur
        gameState.players[targetPlayerIndex].hand = 
          gameState.players[targetPlayerIndex].hand.filter(c => c.id !== reactionCard.id);
        
        gameState.players[targetPlayerIndex].discardPile.push(reactionCard);
        
        // Appliquer des dégâts à l'attaquant (contre-attaque)
        const damage = this.calculateCounterDamage(reactionCard);
        gameState.players[attackerPlayerIndex].health -= damage;
        
        // Message de contre-attaque
        gameState.message = `${gameState.players[targetPlayerIndex].name} a contre-attaqué avec ${reactionCard.value} de ${reactionCard.suit} et infligé ${damage} dégâts!`;
      }
      break;
      
    case 'ACCEPT':
    default:
      // Appliquer les effets de l'attaque au joueur ciblé
      const damage = this.calculateAttackDamage(gameState.pendingAttack.attackCard);
      gameState.players[targetPlayerIndex].health -= damage;
      
      // Message d'acceptation de l'attaque
      gameState.message = `${gameState.players[targetPlayerIndex].name} subit ${damage} dégâts de l'attaque!`;
      break;
  }
  
  // Vérifier si la partie est terminée (un joueur n'a plus de vie)
  if (gameState.players[targetPlayerIndex].health <= 0) {
    gameState.isGameOver = true;
    gameState.winner = gameState.players[attackerPlayerIndex].name;
  } else if (reactionType === 'COUNTER' && gameState.players[attackerPlayerIndex].health <= 0) {
    gameState.isGameOver = true;
    gameState.winner = gameState.players[targetPlayerIndex].name;
  }
  
  // Réinitialiser l'état de réaction
  gameState.waitingForReaction = false;
  gameState.pendingAttack = null;
  
  gameState.players.forEach(player => {
    player.canReact = false;
    player.availableReactions = [];
  });
  
  // Sauvegarder l'état
  game.state = gameState;
  await this.gameRepository.save(game);
  
  return gameState;
}

Cette méthode permet de passer le tour au joueur suivant et de réinitialiser les états liés au tour.

Étape 3 : Système d'attaque avec réaction
Le cœur de notre fonctionnalité est le système qui permet à un joueur d'attaquer et à l'autre de réagir.

Initier une attaque

// Dans server/src/game/game.service.ts
async initiateAttack(gameId: string, targetPlayerId: string, card: Card): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Vérifier que c'est bien le tour du joueur
  const attackerId = gameState.currentPlayer.id;
  if (gameState.players[gameState.activePlayerIndex].id !== attackerId) {
    return gameState; // Ce n'est pas le tour de ce joueur
  }
  
  // Identifier le type d'attaque selon la carte
  const attackType = this.determineAttackType(card);
  
  // Configurer l'attaque en attente
  gameState.waitingForReaction = true;
  gameState.pendingAttack = {
    attackerId,
    targetId: targetPlayerId,
    attackCard: card,
    attackType,
    timeoutAt: Date.now() + gameState.reactionTimeMs
  };
  
  // Donner au joueur ciblé la possibilité de réagir
  const targetPlayerIndex = gameState.players.findIndex(p => p.id === targetPlayerId);
  if (targetPlayerIndex !== -1) {
    gameState.players[targetPlayerIndex].canReact = true;
    
    // Déterminer les réactions disponibles pour ce joueur en fonction de ses cartes
    gameState.players[targetPlayerIndex].availableReactions = 
      this.getAvailableReactions(gameState.players[targetPlayerIndex], attackType);
  }
  
  // Sauvegarder l'état
  game.state = gameState;
  await this.gameRepository.save(game);
  
  return gameState;
}

// Fonction auxiliaire pour déterminer les réactions disponibles
private getAvailableReactions(player: Player, attackType: string): string[] {
  const reactions = ['ACCEPT']; // On peut toujours accepter l'attaque
  
  // Vérifier les cartes en main pour déterminer les réactions possibles
  const hasBlockCard = player.hand.some(card => 
    (card.value === 'K' && ['HEARTS', 'DIAMONDS'].includes(card.suit)) || // Roi rouge
    (card.value === '8')  // 8 = esquive
  );
  
  const hasCounterCard = player.hand.some(card => 
    (card.value === 'J') || // Valet = contre-attaque
    (card.isJoker)   // Joker peut être utilisé pour contrer
  );
  
  if (hasBlockCard) reactions.push('BLOCK');
  if (hasCounterCard) reactions.push('COUNTER');
  
  return reactions;
}

Traiter une réaction

// Dans server/src/game/game.service.ts
async handleReaction(gameId: string, reactionType: string, reactionCard?: Card): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Vérifier qu'une réaction est bien attendue
  if (!gameState.waitingForReaction || !gameState.pendingAttack) {
    return gameState;
  }
  
  // Récupérer les indices des joueurs concernés
  const targetPlayerIndex = gameState.players.findIndex(p => p.id === gameState.pendingAttack.targetId);
  const attackerPlayerIndex = gameState.players.findIndex(p => p.id === gameState.pendingAttack.attackerId);
  
  if (targetPlayerIndex === -1 || attackerPlayerIndex === -1) {
    return gameState;
  }
  
  // Traiter la réaction selon son type
  switch (reactionType) {
    case 'BLOCK':
      if (reactionCard) {
        // Enlever la carte de blocage de la main du joueur
        gameState.players[targetPlayerIndex].hand = 
          gameState.players[targetPlayerIndex].hand.filter(c => c.id !== reactionCard.id);
        
        gameState.players[targetPlayerIndex].discardPile.push(reactionCard);
        
        // Message de blocage réussi
        gameState.message = `${gameState.players[targetPlayerIndex].name} a bloqué l'attaque avec ${reactionCard.value} de ${reactionCard.suit}!`;
      }
      break;
      
    case 'COUNTER':
      if (reactionCard) {
        // Enlever la carte de contre-attaque de la main du joueur
        gameState.players[targetPlayerIndex].hand = 
          gameState.players[targetPlayerIndex].hand.filter(c => c.id !== reactionCard.id);
        
        gameState.players[targetPlayerIndex].discardPile.push(reactionCard);
        
        // Appliquer des dégâts à l'attaquant (contre-attaque)
        const damage = this.calculateCounterDamage(reactionCard);
        gameState.players[attackerPlayerIndex].health -= damage;
        
        // Message de contre-attaque
        gameState.message = `${gameState.players[targetPlayerIndex].name} a contre-attaqué avec ${reactionCard.value} de ${reactionCard.suit} et infligé ${damage} dégâts!`;
      }
      break;
      
    case 'ACCEPT':
    default:
      // Appliquer les effets de l'attaque au joueur ciblé
      const damage = this.calculateAttackDamage(gameState.pendingAttack.attackCard);
      gameState.players[targetPlayerIndex].health -= damage;
      
      // Message d'acceptation de l'attaque
      gameState.message = `${gameState.players[targetPlayerIndex].name} subit ${damage} dégâts de l'attaque!`;
      break;
  }
  
  // Vérifier si la partie est terminée (un joueur n'a plus de vie)
  if (gameState.players[targetPlayerIndex].health <= 0) {
    gameState.isGameOver = true;
    gameState.winner = gameState.players[attackerPlayerIndex].name;
  } else if (reactionType === 'COUNTER' && gameState.players[attackerPlayerIndex].health <= 0) {
    gameState.isGameOver = true;
    gameState.winner = gameState.players[targetPlayerIndex].name;
  }
  
  // Réinitialiser l'état de réaction
  gameState.waitingForReaction = false;
  gameState.pendingAttack = null;
  
  gameState.players.forEach(player => {
    player.canReact = false;
    player.availableReactions = [];
  });
  
  // Sauvegarder l'état
  game.state = gameState;
  await this.gameRepository.save(game);
  
  return gameState;
}

Étape 4 : Gestion du timeout des réactions
Il est important de gérer le cas où un joueur ne réagit pas dans le temps imparti.

// Dans server/src/game/game.service.ts
async checkReactionTimeout(gameId: string): Promise<GameState | null> {
  const game = await this.gameRepository.findOne({ where: { id: gameId } });
  if (!game) return null;
  
  const gameState = game.state;
  
  // Vérifier si une réaction est en attente et si le temps est écoulé
  if (gameState.waitingForReaction && gameState.pendingAttack) {
    if (Date.now() > gameState.pendingAttack.timeoutAt) {
      // Le temps est écoulé, appliquer l'attaque par défaut (ACCEPT)
      return this.handleReaction(gameId, 'ACCEPT');
    }
  }
  
  return gameState;
}


Étape 5 : Ajout des endpoints WebSocket
Maintenant, ajoutons les endpoints WebSocket pour ces nouvelles fonctionnalités.

// Dans server/src/game/game.gateway.ts
@SubscribeMessage('initiateAttack')
async handleInitiateAttack(
  @MessageBody() data: { gameId: string; targetId: string; card: Card },
  @ConnectedSocket() client: Socket
) {
  const gameState = await this.gameService.initiateAttack(
    data.gameId,
    data.targetId,
    data.card
  );
  
  this.server.to(data.gameId).emit('gameState', gameState);
  
  // Programmer une vérification du timeout
  setTimeout(async () => {
    const updatedState = await this.gameService.checkReactionTimeout(data.gameId);
    if (updatedState) {
      this.server.to(data.gameId).emit('gameState', updatedState);
    }
  }, gameState.reactionTimeMs + 100); // Ajouter une petite marge
}

@SubscribeMessage('reaction')
async handleReaction(
  @MessageBody() data: { gameId: string; reactionType: string; reactionCard?: Card },
  @ConnectedSocket() client: Socket
) {
  const gameState = await this.gameService.handleReaction(
    data.gameId,
    data.reactionType,
    data.reactionCard
  );
  
  this.server.to(data.gameId).emit('gameState', gameState);
}

@SubscribeMessage('switchTurn')
async handleSwitchTurn(
  @MessageBody() gameId: string,
  @ConnectedSocket() client: Socket
) {
  const gameState = await this.gameService.switchTurn(gameId);
  this.server.to(gameId).emit('gameState', gameState);
}

Étape 6 : Service socket côté client
Mettons à jour le service socket côté client pour qu'il puisse interagir avec ces nouveaux endpoints.

// Dans client/src/services/socket.ts
// Ajouter ces méthodes à la classe GameSocket existante

initiateAttack(gameId: string, targetId: string, card: Card) {
  if (this.socket) {
    this.socket.emit('initiateAttack', { gameId, targetId, card });
  }
}

sendReaction(gameId: string, reactionType: string, reactionCard?: Card) {
  if (this.socket) {
    this.socket.emit('reaction', { gameId, reactionType, reactionCard });
  }
}

switchTurn(gameId: string) {
  if (this.socket) {
    this.socket.emit('switchTurn', gameId);
  }
}

Étape 7 : Mise à jour du GameStore
Ajoutons ces nouvelles fonctionnalités au GameStore pour les rendre accessibles aux composants React.

// Dans client/src/game-core/store/GameStore.ts
// Ajouter ces méthodes à l'interface GameStore

export interface GameStore extends GameState {
  // Fonctions existantes...
  
  // Nouvelles fonctions
  initiateAttack: (targetId: string, card: Card) => void;
  sendReaction: (reactionType: string, reactionCard?: Card) => void;
  switchTurn: () => void;
  isActivePlayer: () => boolean;
  canReactToAttack: () => boolean;
  getReactionTimeRemaining: () => number;
}

// Ensuite dans l'implémentation du store
export const useGameStore = create<GameStore>((set, get) => ({
  // État et fonctions existants...
  
  // Nouvelles fonctions
  initiateAttack: (targetId: string, card: Card) => {
    const state = get();
    gameSocket.initiateAttack(state.gameId, targetId, card);
    
    // Jouer un son d'attaque
    AudioManager.getInstance().playAttackSound();
  },
  
  sendReaction: (reactionType: string, reactionCard?: Card) => {
    const state = get();
    gameSocket.sendReaction(state.gameId, reactionType, reactionCard);
    
    // Jouer un son approprié selon la réaction
    switch (reactionType) {
      case 'BLOCK':
        AudioManager.getInstance().playDefenseSound();
        break;
      case 'COUNTER':
        AudioManager.getInstance().playCounterSound();
        break;
      default:
        AudioManager.getInstance().playHitSound();
        break;
    }
  },
  
  switchTurn: () => {
    const state = get();
    gameSocket.switchTurn(state.gameId);
  },
  
  isActivePlayer: () => {
    const state = get();
    return state.players[state.activePlayerIndex].id === state.currentPlayer.id;
  },
  
  canReactToAttack: () => {
    const state = get();
    return state.currentPlayer.canReact;
  },
  
  getReactionTimeRemaining: () => {
    const state = get();
    if (!state.waitingForReaction || !state.pendingAttack) return 0;
    
    const remaining = state.pendingAttack.timeoutAt - Date.now();
    return Math.max(0, remaining);
  }
}));

Étape 8 : Création des composants d'interface
Maintenant, créons les composants d'interface pour le mode deux joueurs.

Composant OpponentInfo
Ce composant affiche les informations sur l'adversaire.

// Dans client/src/game-core/components/OpponentInfo.tsx
import React from 'react';
import { useGameStore } from '../store/GameStore';
import { useTranslation } from 'react-i18next';

export const OpponentInfo = () => {
  const { t } = useTranslation();
  const { players, currentPlayer, activePlayerIndex } = useGameStore();
  
  // Trouver l'adversaire (l'autre joueur)
  const opponent = players.find(p => p.id !== currentPlayer.id);
  
  if (!opponent) return null;
  
  const isOpponentTurn = players.indexOf(opponent) === activePlayerIndex;
  
  return (
    <div className={`p-4 rounded-lg ${isOpponentTurn ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${isOpponentTurn ? 'bg-blue-500' : 'bg-gray-400'}`}>
            {opponent.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium">{opponent.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{opponent.profile.epithet}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xs text-gray-500">{t('game.health')}</div>
            <div className="font-bold">{opponent.health}/{opponent.maxHealth}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500">{t('game.hand')}</div>
            <div className="font-bold">{opponent.hand.length}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <h4 className="text-sm font-medium mb-2">{t('game.reserve')}</h4>
        <div className="flex space-x-2">
          {opponent.reserve.map(card => (
            <div 
              key={card.id} 
              className="w-10 h-14 bg-white dark:bg-gray-700 rounded shadow-sm flex items-center justify-center text-xs"
            >
              {card.value} {card.suit.charAt(0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Composant ReactionDialog
Ce composant s'affiche quand un joueur doit réagir à une attaque.

// Dans client/src/game-core/components/ReactionDialog.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/GameStore';
import { Card } from '../types/game';
import { useTranslation } from 'react-i18next';

export const ReactionDialog = () => {
  const { t } = useTranslation();
  const { 
    waitingForReaction, 
    pendingAttack, 
    players, 
    currentPlayer,
    getReactionTimeRemaining,
    sendReaction
  } = useGameStore();
  
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Si le joueur actuel n'est pas la cible de l'attaque, ne rien afficher
  if (!waitingForReaction || !pendingAttack || pendingAttack.targetId !== currentPlayer.id) {
    return null;
  }
  
  // Mise à jour du temps restant
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getReactionTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [getReactionTimeRemaining]);
  
  // Trouver l'attaquant
  const attacker = players.find(p => p.id === pendingAttack.attackerId);
  
  // Obtenir les cartes utilisables pour bloquer
  const blockCards = currentPlayer.hand.filter(card => 
    (card.value === 'K' && ['HEARTS', 'DIAMONDS'].includes(card.suit)) || 
    (card.value === '8')
  );
  
  // Obtenir les cartes utilisables pour contre-attaquer
  const counterCards = currentPlayer.hand.filter(card => 
    (card.value === 'J') || (card.isJoker)
  );
  
  // Rendre disponible uniquement les réactions pour lesquelles le joueur a des cartes
  const canBlock = blockCards.length > 0;
  const canCounter = counterCards.length > 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">
          {t('game.attack.youreUnderAttack')}
        </h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-2">
              {attacker?.name.charAt(0)}
            </div>
            <span>{attacker?.name}</span>
          </div>
          
          <div className="mx-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-2">
              {currentPlayer.name.charAt(0)}
            </div>
            <span>{currentPlayer.name}</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">{t('game.attack.cardUsed')}</h3>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
            <div className="w-12 h-16 bg-white dark:bg-gray-600 rounded shadow-md mr-4 flex items-center justify-center">
              {pendingAttack.attackCard.value} {pendingAttack.attackCard.suit.charAt(0)}
            </div>
            <div>
              <p>{t(`game.attackTypes.${pendingAttack.attackType}`)}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{t('game.attack.yourOptions')}</h3>
          
          <div className="space-y-4">
            {canBlock && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">{t('game.reactions.block')}</h4>
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {blockCards.map(card => (
                    <div 
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-10 h-14 bg-white dark:bg-gray-700 rounded cursor-pointer transition-transform ${
                        selectedCard?.id === card.id ? 'border-2 border-blue-500 scale-110' : ''
                      }`}
                    >
                      <div className="text-center mt-1">{card.value}</div>
                      <div className="text-center">{card.suit.charAt(0)}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => selectedCard && sendReaction('BLOCK', selectedCard)}
                  disabled={!selectedCard || !blockCards.includes(selectedCard)}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  {t('game.reactions.useBlock')}
                </button>
              </div>
            )}
            
            {canCounter && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-medium mb-2">{t('game.reactions.counter')}</h4>
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {counterCards.map(card => (
                    <div 
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-10 h-14 bg-white dark:bg-gray-700 rounded cursor-pointer transition-transform ${
                        selectedCard?.id === card.id ? 'border-2 border-red-500 scale-110' : ''
                      }`}
                    >
                      <div className="text-center mt-1">{card.value}</div>
                      <div className="text-center">{card.suit.charAt(0)}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => selectedCard && sendReaction('COUNTER', selectedCard)}
                  disabled={!selectedCard || !counterCards.includes(selectedCard)}
                  className="mt-2 px-4 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                >
                  {t('game.reactions.useCounter')}
                </button>
              </div>
            )}
            
            <button
              onClick={() => sendReaction('ACCEPT')}
              className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
            >
              {t('game.reactions.accept')}
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all" 
              style={{ width: `${(timeRemaining / pendingAttack.reactionTimeMs) * 100}%` }}
            />
          </div>
          <p className="text-sm text-center mt-1">
            {t('game.attack.timeRemaining', { seconds: Math.ceil(timeRemaining / 1000) })}
          </p>
        </div>
      </div>
    </div>
  );
};

Étape 9 : Mise à jour de la page principale de jeu
Modifions le composant principal du jeu pour intégrer nos nouvelles fonctionnalités.

// Dans client/src/game-core/pages/GamePage.tsx
import React from 'react';
import { useGameStore } from '../store/GameStore';
import { PlayerArea } from '../components/PlayerArea';
import { OpponentInfo } from '../components/OpponentInfo';
import { GameBoard } from '../components/GameBoard';
import { ReactionDialog } from '../components/ReactionDialog';
import { useTranslation } from 'react-i18next';

export const GamePage = () => {
  const { t } = useTranslation();
  const { phase, isActivePlayer, switchTurn } = useGameStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Section de l'adversaire */}
        <div className="mb-6">
          <OpponentInfo />
        </div>
        
        {/* Section du plateau */}
        <div className="mb-6">
          <GameBoard />
        </div>
        
        {/* Section du joueur */}
        <div>
          <PlayerArea />
        </div>
        
        {/* Bouton fin de tour */}
        {phase === 'PLAY' && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => switchTurn()}
              disabled={!isActivePlayer()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg disabled:opacity-50"
            >
              {t('game.endTurn')}
            </button>
          </div>
        )}
        
        {/* Dialog de réaction */}
        <ReactionDialog />
      </div>
    </div>
  );
};

Étape 10 : Initialisation du jeu multijoueur
Pour finaliser notre implémentation, nous devons adapter l'initialisation du jeu pour le mode multijoueur.

// Dans server/src/game/game.service.ts
async createMultiplayerGame(player1Name: string, player2Name: string): Promise<string> {
  const game = new Game();
  
  // Initialiser l'état du jeu multijoueur
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  
  // Distribuer les cartes aux joueurs
  const [deckAfterPlayer1, player1Hand] = drawCards(shuffledDeck, 7);
  const [remainingDeck, player2Hand] = drawCards(deckAfterPlayer1, 7);
  
  // Créer les objets joueurs
  const player1 = {
    id: uuidv4(),
    name: player1Name,
    health: 20,
    maxHealth: 20,
    hand: player1Hand,
    reserve: [],
    discardPile: [],
    profile: {
      epithet: "Joueur 1",
      avatar: "",
    },
    hasUsedStrategicShuffle: false,
    canReact: false,
    availableReactions: [],
  };
  
  const player2 = {
    id: uuidv4(),
    name: player2Name,
    health: 20,
    maxHealth: 20,
    hand: player2Hand,
    reserve: [],
    discardPile: [],
    profile: {
      epithet: "Joueur 2",
      avatar: "",
    },
    hasUsedStrategicShuffle: false,
    canReact: false,
    availableReactions: [],
  };
  
  // Configurer l'état initial
  game.state = {
    // Propriétés de base
    gameId: uuidv4(),
    currentPlayer: player1, // Par compatibilité
    players: [player1, player2],
    activePlayerIndex: 0, // Premier joueur actif
    deck: remainingDeck,
    phase: "SETUP",
    turn: 1,
    selectedCards: [],
    selectedSacrificeCards: [],
    columns: this.initializeColumns(),
    hasDiscarded: false,
    hasDrawn: false,
    hasPlayedAction: false,
    isGameOver: false,
    attackMode: false,
    message: `Partie démarrée entre ${player1Name} et ${player2Name}`,
    winner: null,
    canEndTurn: false,
    
    // Propriétés multijoueur
    waitingForReaction: false,
    pendingAttack: null,
    reactionTimeMs: 15000, // 15 secondes pour réagir
    
    // Autres propriétés nécessaires...
    hasUsedFirstStrategicShuffle: false,
    awaitingStrategicShuffleConfirmation: false,
    language: "fr",
    isMessageClickable: false,
    exchangeMode: false,
    selectedForExchange: null,
    showRevolutionPopup: false,
    blockableColumns: [],
    canBlock: false,
    blockedColumns: [],
    showSacrificePopup: false,
    showJokerExchangePopup: false,
    sacrificeInfo: null,
    availableCards: [],
    playedCardsLastTurn: 0,
  };
  
  game.game_mode = "MULTIPLAYER";
  const savedGame = await this.gameRepository.save(game);
  
  return savedGame.id;
}

Étape 11 : Mécanisme de sélection des joueurs et cibles
Pour permettre au joueur actif de cibler son adversaire, nous avons besoin d'un système de sélection de cible pour les attaques.

// Dans client/src/game-core/components/PlayerArea.tsx
// Ajouter un nouveau fragment de code dans la section des actions du joueur

const { initiateAttack, players, currentPlayer, isActivePlayer } = useGameStore();

// Trouver l'adversaire (pour le ciblage)
const opponent = players.find(p => p.id !== currentPlayer.id);

// Fonction pour initier une attaque avec la carte sélectionnée
const handleAttack = (card) => {
  if (opponent && isActivePlayer()) {
    initiateAttack(opponent.id, card);
  }
};

// Ajouter un bouton d'attaque dans l'interface
{isActivePlayer() && selectedCard && (
  <button
    onClick={() => handleAttack(selectedCard)}
    className="px-4 py-2 bg-red-600 text-white rounded-lg shadow"
  >
    {t('game.attack.attackOpponent')}
  </button>
)}

Étape 12 : Synchronisation des états en temps réel
L'un des défis du mode multijoueur est de maintenir la synchronisation des états entre les joueurs. Nous utilisons déjà Socket.io, mais nous devons nous assurer que les changements d'état sont correctement communiqués.

// Dans server/src/game/game.gateway.ts
// Améliorer la diffusion des mises à jour d'état

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3006",
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Garder une trace des connexions des joueurs
  private playerConnections = new Map<string, string>(); // playerId -> socketId
  
  constructor(private readonly gameService: GameService) {}
  
  async handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);
  }
  
  async handleDisconnect(client: Socket) {
    console.log(`Client déconnecté: ${client.id}`);
    
    // Trouver le joueur associé à cette connexion
    let disconnectedPlayerId = null;
    for (const [playerId, socketId] of this.playerConnections.entries()) {
      if (socketId === client.id) {
        disconnectedPlayerId = playerId;
        break;
      }
    }
    
    if (disconnectedPlayerId) {
      this.playerConnections.delete(disconnectedPlayerId);
      // Informer les autres joueurs de la déconnexion
      // ...
    }
  }
  
  @SubscribeMessage('registerPlayer')
  handleRegisterPlayer(
    @MessageBody() data: { gameId: string; playerId: string },
    @ConnectedSocket() client: Socket
  ) {
    // Associer l'ID du joueur à son socket
    this.playerConnections.set(data.playerId, client.id);
    client.join(data.gameId);
  }
  
  // Méthode utilitaire pour diffuser l'état à tous les joueurs
  async broadcastGameState(gameId: string, message: string = '') {
    const gameState = await this.gameService.getGameState(gameId);
    if (gameState) {
      if (message) {
        gameState.message = message;
      }
      this.server.to(gameId).emit('gameState', gameState);
    }
  }
  
  // Utiliser cette méthode dans tous les gestionnaires d'événements
  // Exemple:
  @SubscribeMessage('initiateAttack')
  async handleInitiateAttack(
    @MessageBody() data: { gameId: string; targetId: string; card: Card },
    @ConnectedSocket() client: Socket
  ) {
    await this.gameService.initiateAttack(
      data.gameId,
      data.targetId,
      data.card
    );
    
    // Diffuser avec un message explicite
    this.broadcastGameState(
      data.gameId, 
      `${client.id} lance une attaque!`
    );
    
    // Programmer une vérification du timeout
    setTimeout(async () => {
      const state = await this.gameService.checkReactionTimeout(data.gameId);
      if (state && state.waitingForReaction === false) {
        this.broadcastGameState(
          data.gameId,
          "Le temps pour réagir est écoulé!"
        );
      }
    }, 15100); // Un peu plus que le temps de réaction
  }
}

Étape 13 : Interface d'invitation et de connexion
Pour permettre aux joueurs de se retrouver, ajoutons une interface simple d'invitation.

// Dans client/src/game-core/components/MultiplayerLobby.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gameSocket } from '../../services/socket';
import { useTranslation } from 'react-i18next';

export const MultiplayerLobby = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [error, setError] = useState('');
  
  // Génération d'une URL d'invitation
  const generateInviteUrl = (id: string) => {
    return `${window.location.origin}/join/${id}`;
  };
  
  // Créer une nouvelle partie
  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    setError('');
    
    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          mode: 'MULTIPLAYER',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec de la création de la partie');
      }
      
      const data = await response.json();
      setGameId(data.gameId);
      
      // Rediriger vers la salle d'attente
      router.push(`/waiting/${data.gameId}`);
    } catch (err) {
      setError('Impossible de créer la partie. Veuillez réessayer.');
      console.error(err);
    } finally {
      setIsCreatingGame(false);
    }
  };
  
  // Rejoindre une partie existante
  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      setError('Veuillez entrer un ID de partie valide');
      return;
    }
    
    setIsJoiningGame(true);
    setError('');
    
    try {
      const response = await fetch('/api/games/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerName,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec pour rejoindre la partie');
      }
      
      // Rediriger vers la partie
      router.push(`/game/${gameId}`);
    } catch (err) {
      setError("Impossible de rejoindre la partie. Vérifiez l'ID et réessayez.");
      console.error(err);
    } finally {
      setIsJoiningGame(false);
    }
  };
  
  // Extraire un ID de partie de l'URL si présent
  useEffect(() => {
    const { id } = router.query;
    if (id && typeof id === 'string') {
      setGameId(id);
    }
  }, [router.query]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t('multiplayer.title')}
        </h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t('multiplayer.yourName')}
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={t('multiplayer.enterYourName')}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button
            onClick={handleCreateGame}
            disabled={!playerName || isCreatingGame}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreatingGame ? t('multiplayer.creating') : t('multiplayer.createGame')}
          </button>
          
          <div className="text-center text-gray-500 dark:text-gray-400">ou</div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('multiplayer.gameId')}
            </label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
              placeholder={t('multiplayer.enterGameId')}
            />
            <button
              onClick={handleJoinGame}
              disabled={!playerName || !gameId || isJoiningGame}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isJoiningGame ? t('multiplayer.joining') : t('multiplayer.joinGame')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Étape 14 : Interfaces API côté serveur
Pour compléter notre implémentation, nous devons créer les endpoints API qui serviront à créer et rejoindre des parties.

// Dans server/src/game/game.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('api/games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  async createGame(@Body() body: { playerName: string; mode: string }) {
    try {
      const gameId = await this.gameService.createGame(body.mode);
      
      // Si c'est un mode multijoueur, initialiser le premier joueur
      if (body.mode === 'MULTIPLAYER') {
        await this.gameService.initializeMultiplayerPlayer(gameId, body.playerName, true);
      }
      
      return { gameId };
    } catch (error) {
      throw new HttpException('Échec de la création de la partie', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('join')
  async joinGame(@Body() body: { gameId: string; playerName: string }) {
    try {
      // Vérifier si la partie existe et peut être rejointe
      const gameState = await this.gameService.getGameState(body.gameId);
      
      if (!gameState) {
        throw new HttpException('Partie introuvable', HttpStatus.NOT_FOUND);
      }
      
      if (gameState.players.length >= 2) {
        throw new HttpException('La partie est complète', HttpStatus.BAD_REQUEST);
      }
      
      // Ajouter le second joueur
      await this.gameService.initializeMultiplayerPlayer(body.gameId, body.playerName, false);
      
      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Échec pour rejoindre la partie', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

Étape 15 : Mise en place d'un système de notification
Pour améliorer l'expérience utilisateur, ajoutons un système de notification pour informer les joueurs des événements importants.

// Dans client/src/game-core/components/Notification.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/GameStore';

export const Notification = () => {
  const { message } = useGameStore();
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (message) {
      setShow(true);
      
      // Masquer après 3 secondes
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  if (!message || !show) return null;
  
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/80 text-white px-6 py-3 rounded-full shadow-lg max-w-md text-center">
        {message}
      </div>
    </div>
  );
};

Résumé de l'implémentation
Cette structure complète pour le mode deux joueurs avec réactions aux attaques s'intègre parfaitement à l'architecture existante et permet :

Gestion des tours : Le système alterne automatiquement entre les joueurs.
Système d'attaque-réaction : Un joueur peut attaquer et l'autre peut réagir en temps limité.
Multiples options de réaction : Bloquer, contre-attaquer ou accepter les dégâts.
Synchronisation en temps réel : Les états sont partagés entre les joueurs via WebSockets.
Invitation à des parties : Interface permettant de créer et rejoindre des parties.
Cette architecture est modulaire et extensible, ce qui permettra d'ajouter facilement d'autres fonctionnalités à l'avenir, comme des effets de cartes spécifiques au mode multijoueur ou des mécaniques de jeu plus avancées.

Pour tester, il suffit de :

Démarrer le serveur backend
Démarrer le client frontend
Ouvrir deux navigateurs (ou onglets) différents
Créer une partie multijoueur dans l'un et la rejoindre dans l'autre
Le système est conçu pour garantir l'intégrité du jeu en maintenant toute la logique métier côté serveur, tout en offrant une interface utilisateur réactive et intuitive côté client.

