import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { Card, Profile, Suit } from "src/types/game";

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3006",
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage("joinGame")
  async handleJoinGame(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    client.join(gameId);
    const gameState = await this.gameService.getGameState(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("moveToReserve")
  async moveToReserve(@MessageBody() data: { gameId: string; card: Card }, @ConnectedSocket() client: Socket) {
    console.log("moveToReserve ", data.gameId);

    const gameState = await this.gameService.moveToReserve(data.gameId, data.card);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("startGame")
  async startGame(@MessageBody() data: { gameId: string }, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleStartGame(data.gameId);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("placeCard")
  async handlePlaceCard(
    @MessageBody()
    data: { gameId: string; suit: string; selectedCards: Card[] },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleCardPlace(data.gameId, data.suit as any, data.selectedCards);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("jokerExchange")
  async handleJokerExchange(
    @MessageBody()
    data: { gameId: string; suit: string; selectedCard: Card },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleJokerExchange(data.gameId, data.selectedCard);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("jokerAction")
  async handleJokerAction(
    @MessageBody()
    data: { gameId: string; jokerCard: Card; action: string },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleJokerAction(data.gameId, data.jokerCard, data.action);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("queenChallenge")
  async handleQueenChallenge(
    @MessageBody()
    data: { gameId: string; selectedCards: Card[]; isCorrect: boolean },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleQueenChallenge(data.gameId, data.selectedCards, data.isCorrect);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("activatorExchange")
  async handleActivatorExchange(
    @MessageBody()
    data: { gameId: string; columnCard: Card; playerCard: Card },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleActivatorExchange(data.gameId, data.columnCard, data.playerCard);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("attack")
  async handleAttack(
    @MessageBody()
    data: { gameId: string; attackCard: Card },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleAttack(data.gameId, data.attackCard);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("strategicShuffle")
  async handleStrategicShuffle(
    @MessageBody()
    gameId: string,
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleStrategicShuffle(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("discardCard")
  async handleDiscard(@MessageBody() data: { gameId: string; card: Card }, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleDiscardCard(data.gameId, data.card);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("drawCard")
  async handleDrawCard(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleDrawCard(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("exchangeCards")
  async handleExchangeCard(
    @MessageBody() data: { gameId: string; card1: Card; card2: Card },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleExchangeCards(data.gameId, data.card1, data.card2);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("sacrificeSpecialCard")
  async handleSacrificeSpecialCard(
    @MessageBody() data: { gameId: string; specialCard: Card; selectedCards: Card[] },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleSacrificeSpecialCard(
      data.gameId,
      data.specialCard,
      data.selectedCards
    );
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("block")
  async handleBlock(@MessageBody() data: { gameId: string; suit: Suit }, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleBlock(data.gameId, data.suit);
    this.server.to(data.gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("skipAction")
  async handleSkipAction(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleSkipAction(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("recycleDiscardPile")
  async handleRecycleDiscardPile(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleRecycleDiscardPile(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("endTurn")
  async handleEndTurn(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.endTurn(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("surrender")
  async HandleSurrender(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    const gameState = await this.gameService.handleSurrender(gameId);
    this.server.to(gameId).emit("gameState", gameState);
  }

  @SubscribeMessage("updateProfile")
  async handleUpdateProfile(
    @MessageBody() data: { gameId: string; profile: Profile },
    @ConnectedSocket() client: Socket
  ) {
    const gameState = await this.gameService.handleUpdateProfile(data.gameId, data.profile);
    this.server.to(data.gameId).emit("gameState", gameState);
  }
}
