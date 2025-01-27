import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card, Player, Phase, Suit, ColumnState, GameState } from '../types/game';
import { Game } from '../entities/game.entity';
import { createDeck, drawCards, shuffleDeck } from '../utils/deck';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>
  ) {}

  async createGame(): Promise<string> {
    const game = new Game();
    game.state = this.initializeGameState();
    const savedGame = await this.gameRepository.save(game);
    return savedGame.id;
  }

  async getGameState(gameId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    return game?.state || null;
  }

  private initializeGameState(): GameState {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const initialHand = drawCards(shuffledDeck, 5);

    return {
      currentPlayer: {
        id: "player-1",
        name: "Joueur 1",
        health: 10,
        maxHealth: 10,
        hand: initialHand,
      },
      deck: shuffledDeck.slice(5),
      phase: 'DRAW',
      turn: 1,
      selectedCards: [],
      selectedSacrificeCards: [],
      columns: this.initializeColumns(),
      hasDiscarded: false,
      hasDrawn: false,
      hasPlayedAction: false,
      isGameOver: false,
      playedCardsLastTurn: 0,
      attackMode: false,
      message: '',
      winner: null,
      canEndTurn: false,
      blockableColumns: [],
      canBlock: false,
      blockedColumns: [],
    };
  }

  private initializeColumns(): Record<Suit, ColumnState> {
    return {
      HEARTS: { cards: [], isDestroyed: false },
      DIAMONDS: { cards: [], isDestroyed: false },
      CLUBS: { cards: [], isDestroyed: false },
      SPADES: { cards: [], isDestroyed: false },
    };
  }

  async handleCardPlace(gameId: string, suit: Suit, position: number): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    const column = gameState.columns[suit];
    if (!column || column.isDestroyed) return null;

    const selectedCard = gameState.selectedCards[0];
    if (!selectedCard) return null;

    // Vérifier si la position est valide
    if (position < 0 || position > column.cards.length) return null;

    // Retirer la carte de la main du joueur
    gameState.currentPlayer.hand = gameState.currentPlayer.hand.filter(
      card => card.id !== selectedCard.id
    );

    // Placer la carte dans la colonne
    column.cards.splice(position, 0, selectedCard);
    gameState.selectedCards = [];
    gameState.hasPlayedAction = true;

    // Vérifier les conditions spéciales
    this.checkSpecialCardEffects(gameState, selectedCard, suit);

    // Sauvegarder l'état mis à jour
    game.state = gameState;
    await this.gameRepository.save(game);

    return gameState;
  }

  private checkSpecialCardEffects(gameState: GameState, card: Card, suit: Suit): void {
    if (card.isJoker) {
      // Logique du Joker
    } else if (card.isActivator) {
      // Logique de l'Activator
    } else if (card.isSpecial) {
      // Logique des cartes spéciales
    }
  }

  async handleDrawCard(gameId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.hasDrawn) return null;

    if (gameState.deck.length > 0) {
      const [drawnCard, ...remainingDeck] = gameState.deck;
      gameState.currentPlayer.hand.push(drawnCard);
      gameState.deck = remainingDeck;
      gameState.hasDrawn = true;
      gameState.phase = 'PLAY';
    }

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleDiscard(gameId: string, cardId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.hasDiscarded) return null;

    const cardIndex = gameState.currentPlayer.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return null;

    gameState.currentPlayer.hand.splice(cardIndex, 1);
    gameState.hasDiscarded = true;
    gameState.phase = 'END';

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async endTurn(gameId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    gameState.hasDrawn = false;
    gameState.hasDiscarded = false;
    gameState.hasPlayedAction = false;
    gameState.phase = 'DRAW';
    gameState.turn += 1;
    gameState.selectedCards = [];
    gameState.blockableColumns = [];
    gameState.blockedColumns = [];

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async selectCard(gameId: string, cardId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    const card = gameState.currentPlayer.hand.find(c => c.id === cardId);
    if (!card) return null;

    gameState.selectedCards = [card];
    
    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }
}
