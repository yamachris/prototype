import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { GameService } from './game.service';
import { Suit } from '../types/game';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  async createGame() {
    const gameId = await this.gameService.createGame();
    return { gameId };
  }

  @Get(':gameId')
  async getGameState(@Param('gameId') gameId: string) {
    return await this.gameService.getGameState(gameId);
  }

  @Put(':gameId/place-card')
  async placeCard(
    @Param('gameId') gameId: string,
    @Body() body: { suit: Suit; position: number },
  ) {
    return await this.gameService.handleCardPlace(gameId, body.suit, body.position);
  }

  @Post(':gameId/draw-card')
  async drawCard(@Param('gameId') gameId: string) {
    return await this.gameService.handleDrawCard(gameId);
  }

  @Post(':gameId/discard')
  async discard(
    @Param('gameId') gameId: string,
    @Body() body: { cardId: string },
  ) {
    return await this.gameService.handleDiscard(gameId, body.cardId);
  }

  @Post(':gameId/end-turn')
  async endTurn(@Param('gameId') gameId: string) {
    return await this.gameService.endTurn(gameId);
  }

  @Put(':gameId/select-card')
  async selectCard(
    @Param('gameId') gameId: string,
    @Body() body: { cardId: string },
  ) {
    return await this.gameService.selectCard(gameId, body.cardId);
  }
}
