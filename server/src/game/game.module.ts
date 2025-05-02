import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { SessionService } from './session.service';
import { Game } from '../entities/game.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Player, GameSession])],
  providers: [GameService, GameGateway, SessionService],
  controllers: [GameController],
  exports: [GameService, SessionService],
})
export class GameModule {}
