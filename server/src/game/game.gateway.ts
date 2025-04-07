import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Card } from 'src/types/game';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3006',
    credentials: true,
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(gameId);
    const gameState = await this.gameService.getGameState(gameId);
    this.server.to(gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('moveToReserve')
  async moveToReserve(
    @MessageBody() data: { gameId: string; card: Card },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('moveToReserve ', data.gameId);

    const gameState = await this.gameService.moveToReserve(
      data.gameId,
      data.card,
    );
    this.server.to(data.gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('startGame')
  async startGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleStartGame(data.gameId);
    this.server.to(data.gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('placeCard')
  async handlePlaceCard(
    @MessageBody()
    data: { gameId: string; suit: string; selectedCards: Card[] },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleCardPlace(
      data.gameId,
      data.suit as any,
      data.selectedCards,
    );
    this.server.to(data.gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('discardCard')
  async handleDiscard(
    @MessageBody() data: { gameId: string; card: Card },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleDiscardCard(
      data.gameId,
      data.card,
    );
    this.server.to(data.gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('drawCard')
  async handleDrawCard(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleDrawCard(gameId);
    this.server.to(gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('skipAction')
  async handleSkipAction(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleSkipAction(gameId);
    this.server.to(gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('endTurn')
  async handleEndTurn(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.endTurn(gameId);
    this.server.to(gameId).emit('gameState', gameState);
  }

  @SubscribeMessage('selectCard')
  async handleSelectCard(
    @MessageBody() data: { gameId: string; cardId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.selectCard(
      data.gameId,
      data.cardId,
    );
    this.server.to(data.gameId).emit('gameState', gameState);
  }
}
