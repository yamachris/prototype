import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Game } from './game.entity';
import { Player } from './player.entity';

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  sessionToken: string;

  @OneToOne(() => Game)
  @JoinColumn()
  game: Game;

  @Column()
  gameId: string;

  @ManyToMany(() => Player)
  @JoinTable({
    name: 'session_players',
    joinColumn: { name: 'session_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'player_id', referencedColumnName: 'id' },
  })
  players: Player[];

  @Column({ type: 'jsonb', nullable: true })
  clientData: any;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  currentTurnPlayerId: string;

  @Column({ nullable: true, type: 'jsonb' })
  temporaryState: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
