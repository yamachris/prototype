import { io, Socket } from 'socket.io-client';
import { GameState } from '../game-core/types/game';

class GameSocket {
  private socket: Socket | null = null;
  private gameStateCallback: ((state: GameState) => void) | null = null;

  connect() {
    this.socket = io('http://localhost:3007', {
      withCredentials: true,
    });

    this.socket.on('gameState', (state: GameState) => {
      if (this.gameStateCallback) {
        this.gameStateCallback(state);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('joinGame', gameId);
    }
  }

  onGameState(callback: (state: GameState) => void) {
    this.gameStateCallback = callback;
  }

  placeCard(gameId: string, suit: string, position: number) {
    if (this.socket) {
      this.socket.emit('placeCard', { gameId, suit, position });
    }
  }

  drawCard(gameId: string) {
    if (this.socket) {
      this.socket.emit('drawCard', gameId);
    }
  }
}

export const gameSocket = new GameSocket();
