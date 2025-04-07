import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { GameService } from './game.service';
import { Suit, Card } from '../types/game';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  async createGame(@Body() body: { mode: string }) {
    const gameId = await this.gameService.createGame(body.mode);
    return { gameId };
  }

  @Post('move-to-reserve')
  async setupGame(
    @Param('gameId') gameId: string,
    @Body() body: { card: Card },
  ) {
    return await this.gameService.moveToReserve(gameId, body.card);
  }

  @Get(':gameId')
  async getGameState(@Param('gameId') gameId: string) {
    return await this.gameService.getGameState(gameId);
  }

  @Put(':gameId/place-card')
  async placeCard(
    @Param('gameId') gameId: string,
    @Body() body: { suit: Suit; selectedCards: Card[] },
  ) {
    return await this.gameService.handleCardPlace(
      gameId,
      body.suit,
      body.selectedCards,
    );
  }

  @Post(':gameId/draw-card')
  async drawCard(@Param('gameId') gameId: string) {
    return await this.gameService.handleDrawCard(gameId);
  }

  @Post(':gameId/discard')
  async discard(@Param('gameId') gameId: string, @Body() body: { card: Card }) {
    return await this.gameService.handleDiscardCard(gameId, body.card);
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
