import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private players: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.players.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.players.delete(client.id);
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, payload: { gameId: string }) {
    client.join(payload.gameId);
    this.server.to(payload.gameId).emit('playerJoined', {
      playerId: client.id,
      gameId: payload.gameId,
    });
  }

  @SubscribeMessage('playCard')
  handlePlayCard(client: Socket, payload: { gameId: string; cardId: string; position: number }) {
    this.server.to(payload.gameId).emit('cardPlayed', {
      playerId: client.id,
      cardId: payload.cardId,
      position: payload.position,
    });
  }

  @SubscribeMessage('drawCard')
  handleDrawCard(client: Socket, payload: { gameId: string }) {
    this.server.to(payload.gameId).emit('cardDrawn', {
      playerId: client.id,
    });
  }

  @SubscribeMessage('endTurn')
  handleEndTurn(client: Socket, payload: { gameId: string }) {
    this.server.to(payload.gameId).emit('turnEnded', {
      playerId: client.id,
    });
  }
}
