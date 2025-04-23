import { io, Socket } from "socket.io-client";
import { GameState, Card, Profile, Suit } from "../game-core/types/game";

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

  handleStrategicShuffle(gameId: string) {
    console.log("handleStrategicShuffle");

    if (this.socket) {
      this.socket.emit("strategicShuffle", gameId);
    }
  }

  handleExchangeCards(gameId: string, card1: Card, card2: Card) {
    if (this.socket) {
      this.socket.emit("exchangeCards", { gameId, card1, card2 });
    }
  }

  handleRecycleDiscardPile(gameId: string) {
    if (this.socket) {
      this.socket.emit("recycleDiscardPile", gameId);
    }
  }

  handleJokerExchange(gameId: string, selectedCard: Card) {
    if (this.socket) {
      this.socket.emit("jokerExchange", { gameId, selectedCard });
    }
  }

  handleJokerAction(gameId: string, jokerCard: Card, action: string) {
    if (this.socket) {
      this.socket.emit("jokerAction", { gameId, jokerCard, action });
    }
  }

  handleAttack(gameId: string, attackCard: Card) {
    if (this.socket) {
      this.socket.emit("attack", { gameId, attackCard });
    }
  }

  handleSurrender(gameId: string) {
    if (this.socket) {
      this.socket.emit("surrender", gameId);
    }
  }

  handleUpdateProfile(gameId: string, profile: Profile) {
    if (this.socket) {
      this.socket.emit("updateProfile", { gameId, profile });
    }
  }

  handleSacrificeSpecialCard(gameId: string, specialCard: Card, selectedCards: Card[]) {
    if (this.socket) {
      this.socket.emit("sacrificeSpecialCard", { gameId, specialCard, selectedCards });
    }
  }

  handleBlock(gameId: string, suit: Suit) {
    if (this.socket) {
      this.socket.emit("block", { gameId, suit });
    }
  }

  handleQueenChallenge(gameId: string, selectedCards: Card[], isCorrect: boolean) {
    if (this.socket) {
      this.socket.emit("queenChallenge", { gameId, selectedCards, isCorrect });
    }
  }

  handleActivatorExchange(gameId: string, columnCard: Card, playerCard: Card) {
    if (this.socket) {
      this.socket.emit("activatorExchange", { gameId, columnCard, playerCard });
    }
  }

  setShowRevolutionPopup(gameId: string, showRevolutionPopup: boolean) {
    if (this.socket) {
      this.socket.emit("showRevolutionPopup", { gameId, showRevolutionPopup });
    }
  }
}

export const gameSocket = new GameSocket();
