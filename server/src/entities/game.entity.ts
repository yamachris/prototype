import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { GameState } from '../types/game';
import { Player } from './player.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  state: GameState;

  @Column({ type: 'text' })
  game_mode: string;

  @Column({ nullable: true })
  @Index()
  sessionId: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastInteraction: Date;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ type: 'jsonb', nullable: true })
  gameHistory: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
