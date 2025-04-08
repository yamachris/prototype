import { io, Socket } from "socket.io-client";
import { GameState, Card } from "../game-core/types/game";

class GameSocket {
  private socket: Socket | null = null;
  private gameStateCallback: ((state: GameState) => void) | null = null;

  connect() {
    this.socket = io("http://localhost:3007", {
      withCredentials: true,
    });

    this.socket.on("gameState", (state: GameState) => {
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
      this.socket.emit("joinGame", gameId);
    }
  }

  onGameState(callback: (state: GameState) => void) {
    this.gameStateCallback = callback;
  }

  moveToReserve(gameId: string, card: Card) {
    if (this.socket) {
      this.socket.emit("moveToReserve", { gameId, card });
    }
  }

  startGame(gameId: string) {
    if (this.socket) {
      this.socket.emit("startGame", { gameId });
    }
  }

  handleDiscard(gameId: string, card: Card) {
    if (this.socket) {
      this.socket.emit("discardCard", { gameId, card });
    }
  }

  handleDrawCard(gameId: string) {
    if (this.socket) {
      this.socket.emit("drawCard", gameId);
    }
  }

  handleSkipAction(gameId: string) {
    if (this.socket) {
      this.socket.emit("skipAction", gameId);
    }
  }

  handlePassTurn(gameId: string) {
    if (this.socket) {
      this.socket.emit("endTurn", gameId);
    }
  }

  handlePlaceCard(gameId: string, suit: string, selectedCards: Card[]) {
    if (this.socket) {
      this.socket.emit("placeCard", { gameId, suit, selectedCards });
    }
  }
}

export const gameSocket = new GameSocket();
