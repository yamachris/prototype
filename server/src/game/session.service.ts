import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { GameSession } from '../entities/game-session.entity';
import { Game } from '../entities/game.entity';
import { Player } from '../entities/player.entity';
import { GameState } from '../types/game';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(GameSession)
    private sessionRepository: Repository<GameSession>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  /**
   * Crée une nouvelle session de jeu
   */
  async createSession(gameId: string, playerIds: string[]): Promise<GameSession> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    const players = await this.playerRepository.findBy({ id: In(playerIds) });

    const session = new GameSession();
    session.sessionToken = uuidv4();
    session.gameId = gameId;
    session.game = game;
    session.players = players;
    session.lastActivity = new Date();
    session.isActive = true;

    // Si c'est un jeu multijoueur et que l'état contient l'index du joueur actif
    if (players.length > 1 && game.state && game.state.players) {
      // Utiliser les données des joueurs disponibles dans l'état du jeu
      const activePlayerIndex = game.state.currentPlayer ? 
        game.state.players.findIndex(p => p.id === game.state.currentPlayer.id) : 0;
      
      if (activePlayerIndex >= 0 && players[activePlayerIndex]) {
        session.currentTurnPlayerId = players[activePlayerIndex].id;
      }
    }

    // Sauvegarder la session
    await this.sessionRepository.save(session);

    // Mettre à jour le sessionId dans l'entité Game
    game.sessionId = session.id;
    game.lastInteraction = new Date();
    await this.gameRepository.save(game);

    // Mettre à jour le lastSessionId pour chaque joueur
    for (const player of players) {
      player.lastSessionId = session.id;
      player.lastLogin = new Date();
      await this.playerRepository.save(player);
    }

    return session;
  }

  /**
   * Récupère une session de jeu par son token
   */
  async getSessionByToken(token: string): Promise<GameSession | null> {
    return this.sessionRepository.findOne({ 
      where: { sessionToken: token },
      relations: ['game', 'players']
    });
  }

  /**
   * Récupère une session de jeu par ID de jeu
   */
  async getSessionByGameId(gameId: string): Promise<GameSession | null> {
    return this.sessionRepository.findOne({ 
      where: { gameId },
      relations: ['game', 'players']
    });
  }

  /**
   * Met à jour l'état du jeu dans la session
   */
  async updateGameState(gameId: string, gameState: GameState): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error('Game not found');
    }

    // Mise à jour de l'état du jeu
    game.state = gameState;
    game.lastInteraction = new Date();

    // Si le jeu est terminé, mettre à jour le gagnant
    if (gameState.isGameOver && gameState.winner) {
      // Trouver l'ID du joueur gagnant
      const session = await this.getSessionByGameId(gameId);
      if (session) {
        const winnerPlayer = session.players.find(p => p.name === gameState.winner);
        if (winnerPlayer) {
          game.winnerId = winnerPlayer.id;
          game.isActive = false;

          // Mettre à jour les statistiques du joueur
          winnerPlayer.gamesWon += 1;
          await this.playerRepository.save(winnerPlayer);
        }
      }
    }

    await this.gameRepository.save(game);

    // Mettre à jour la session
    const session = await this.getSessionByGameId(gameId);
    if (session) {
      session.lastActivity = new Date();
      
      // Mettre à jour le joueur dont c'est le tour en fonction de la structure actuelle de l'état
      if (gameState.players && gameState.currentPlayer) {
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer.id);
        if (currentPlayerIndex >= 0 && session.players.length > currentPlayerIndex) {
          session.currentTurnPlayerId = session.players[currentPlayerIndex].id;
        }
      }

      await this.sessionRepository.save(session);
    }
  }

  /**
   * Sauvegarde l'état temporaire (par exemple lors d'une attaque en attente de réaction)
   */
  async saveTemporaryState(gameId: string, tempState: any): Promise<void> {
    const session = await this.getSessionByGameId(gameId);
    if (session) {
      session.temporaryState = tempState;
      session.lastActivity = new Date();
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Récupère l'état complet du jeu pour une session donnée
   */
  async getCompleteGameState(sessionToken: string): Promise<{ gameState: GameState, session: GameSession } | null> {
    const session = await this.getSessionByToken(sessionToken);
    if (!session || !session.game) {
      return null;
    }

    return {
      gameState: session.game.state,
      session
    };
  }

  /**
   * Termine une session de jeu
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (session) {
      session.isActive = false;
      await this.sessionRepository.save(session);

      // Mettre à jour le jeu
      const game = await this.gameRepository.findOne({ where: { id: session.gameId } });
      if (game) {
        game.isActive = false;
        await this.gameRepository.save(game);
      }

      // Mettre à jour les statistiques des joueurs
      for (const playerId of session.players.map(p => p.id)) {
        const player = await this.playerRepository.findOne({ where: { id: playerId } });
        if (player) {
          player.gamesPlayed += 1;
          await this.playerRepository.save(player);
        }
      }
    }
  }

  /**
   * Nettoie les sessions inactives
   */
  async cleanupInactiveSessions(olderThanHours: number = 24): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const inactiveSessions = await this.sessionRepository.find({
      where: {
        lastActivity: LessThan(cutoffDate),
        isActive: true
      }
    });

    for (const session of inactiveSessions) {
      await this.endSession(session.id);
    }
  }
}
