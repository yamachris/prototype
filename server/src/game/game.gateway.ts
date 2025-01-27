import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

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

  @SubscribeMessage('placeCard')
  async handlePlaceCard(
    @MessageBody() data: { gameId: string; suit: string; position: number },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleCardPlace(
      data.gameId,
      data.suit as any,
      data.position,
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

  @SubscribeMessage('discard')
  async handleDiscard(
    @MessageBody() data: { gameId: string; cardId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const gameState = await this.gameService.handleDiscard(data.gameId, data.cardId);
    this.server.to(data.gameId).emit('gameState', gameState);
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
    const gameState = await this.gameService.selectCard(data.gameId, data.cardId);
    this.server.to(data.gameId).emit('gameState', gameState);
  }
}
