import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { Game } from '../entities/game.entity';
import { Player } from '../entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Player])],
  providers: [GameService, GameGateway],
  controllers: [GameController],
})
export class GameModule {}
