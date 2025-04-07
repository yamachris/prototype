import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Card,
  Player,
  Phase,
  Suit,
  ColumnState,
  GameState,
  attackCardButton,
} from '../types/game';
import { Game } from '../entities/game.entity';
import { createDeck, drawCards, shuffleDeck } from '../utils/deck';

import { initialAttackButtons } from 'src/constants/definition';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
  ) {}

  async createGame(mode: string): Promise<string> {
    const game = new Game();
    game.state = this.initializeGameState();
    game.game_mode = mode;
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
    const [remainingDeck, initialHand] = drawCards(shuffledDeck, 7);

    return {
      currentPlayer: {
        id: 'player-1',
        name: 'Joueur 1',
        health: 10,
        maxHealth: 10,
        hand: initialHand,
        reserve: [],
        discardPile: [],
        profile: {
          epithet: '',
        },
      },
      deck: remainingDeck,
      phase: 'SETUP',
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
      // canBlock: false,
      blockedColumns: [],
    };
  }

  private initializeColumns(): Record<Suit, ColumnState> {
    return {
      HEARTS: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
      },
      DIAMONDS: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
      },
      CLUBS: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
      },
      SPADES: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
      },
    };
  }

  async moveToReserve(gameId: string, card: Card): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    const isReserveComplete = gameState.currentPlayer.reserve.length === 2;

    if (!isReserveComplete) {
      const updatedReserve = [...gameState.currentPlayer.reserve, card];
      const updatedHand = gameState.currentPlayer.hand.filter(
        (c) => c.id !== card.id,
      );

      gameState.currentPlayer.reserve = updatedReserve;
      gameState.currentPlayer.hand = updatedHand;
    }

    // Sauvegarder l'état mis à jour
    game.state = gameState;
    await this.gameRepository.save(game);

    return gameState;
  }

  async handleStartGame(gameId: string): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    var gameState = game.state;

    const isReserveComplete = gameState.currentPlayer.reserve.length === 2;

    if (isReserveComplete) {
      gameState = {
        ...gameState,
        phase: 'DISCARD',
        hasDiscarded: false,
        hasDrawn: false,
        hasPlayedAction: false,
      };
    }

    // Sauvegarder l'état mis à jour
    game.state = gameState;
    await this.gameRepository.save(game);

    return gameState;
  }

  async handleCardPlace(
    gameId: string,
    suit: Suit,
    selectedCards: Card[],
  ): Promise<GameState | null> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    const column = gameState.columns[suit];
    if (!column || column.isDestroyed) return null;

    // const selectedCard = gameState.selectedCards[0];
    // if (!selectedCard) return null;

    // Vérifier si la position est valide
    // if (position < 0 || position > column.cards.length) return null;

    // Retirer la carte de la main du joueur
    // gameState.currentPlayer.hand = gameState.currentPlayer.hand.filter(
    //   (card) => card.id !== selectedCard.id,
    // );

    // Placer la carte dans la colonne
    // column.cards.splice(position, 0, selectedCard);
    gameState.selectedCards = [];
    gameState.hasPlayedAction = true;

    // Vérifier les conditions spéciales
    // this.checkSpecialCardEffects(gameState, selectedCard, suit);

    // Sauvegarder l'état mis à jour
    game.state = gameState;
    await this.gameRepository.save(game);

    return gameState;
  }

  private canPlaceCard(
    gameState: GameState,
    suit: Suit,
    selectedCards: Card[],
  ): boolean {
    if (gameState.phase !== 'PLAY') return false;

    // Pour l'activation avec As + JOKER/7
    if (selectedCards.length === 2) {
      const [card1, card2] = selectedCards;

      // Vérifier si c'est une activation de tête
      const hasFaceCard =
        card1.value === 'J' ||
        card1.value === 'K' ||
        card2.value === 'J' ||
        card2.value === 'K';
      const hasActivator =
        card1.type === 'JOKER' ||
        card1.value === '7' ||
        card2.type === 'JOKER' ||
        card2.value === '7';

      // Les têtes de jeu peuvent toujours être jouées avec un activateur, peu importe l'état de la colonne
      if (hasFaceCard && hasActivator) {
        const faceCard = selectedCards.find(
          (card) => card.value === 'J' || card.value === 'K',
        );
        // On vérifie uniquement que la tête correspond à la couleur de la colonne
        return faceCard?.suit === suit;
      }

      // Vérifier si c'est une Dame + activateur
      const hasQueen = card1.value === 'Q' || card2.value === 'Q';
      if (hasQueen && hasActivator) {
        return true;
      }

      // Pour l'activation avec As + Activateur (JOKER ou 7)
      const hasAs = card1.value === 'A' || card2.value === 'A';
      if (hasAs && hasActivator) {
        const ace = selectedCards.find((card) => card.value === 'A');
        return ace?.suit === suit;
      }
    }

    // Pour le placement normal de cartes
    if (selectedCards.length === 1) {
      const column = gameState.columns[suit];
      if (!column.hasLuckyCard) return false;
      return (
        selectedCards[0].suit === suit || selectedCards[0].type === 'JOKER'
      );
    }

    return false;
  }

  private checkSpecialCardEffects(
    gameState: GameState,
    card: Card,
    suit: Suit,
  ): void {
    if (card.isJoker) {
      // Logique du Joker
    } else if (card.isActivator) {
      // Logique de l'Activator
    } else if (card.isSpecial) {
      // Logique des cartes spéciales
    }
  }

  async handleDiscardCard(
    gameId: string,
    card: Card,
  ): Promise<GameState | null> {
    console.log('handleDiscard ', gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.hasDiscarded || gameState.phase !== 'DISCARD') return null;

    const isFromHand = gameState.currentPlayer.hand.some(
      (c) => c.id === card.id,
    );
    const isFromReserve = gameState.currentPlayer.reserve.some(
      (c) => c.id === card.id,
    );

    const newHand = isFromHand
      ? gameState.currentPlayer.hand.filter((c) => c.id !== card.id)
      : [...gameState.currentPlayer.hand];

    const newReserve = isFromReserve
      ? gameState.currentPlayer.reserve.filter((c) => c.id !== card.id)
      : [...gameState.currentPlayer.reserve];

    const newDiscardPile = [...gameState.currentPlayer.discardPile, card];

    gameState.currentPlayer.hand = newHand;
    gameState.currentPlayer.reserve = newReserve;
    gameState.currentPlayer.discardPile = newDiscardPile;
    gameState.hasDiscarded = true;
    gameState.phase = 'DRAW';

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleDrawCard(gameId: string): Promise<GameState | null> {
    console.log('handleDrawCard ', gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.phase !== 'DRAW' || gameState.hasDrawn) return null;

    // Calculer combien de cartes manquent pour compléter la main et la réserve
    const currentHandCount = gameState.currentPlayer.hand.length;
    const currentReserveCount = gameState.currentPlayer.reserve.length;
    const maxHandCards = 5;
    const maxReserveCards = 2;

    // Calculer combien de cartes on peut ajouter
    const handSpace = Math.max(0, maxHandCards - currentHandCount);
    const reserveSpace = Math.max(0, maxReserveCards - currentReserveCount);
    const cardsNeeded = handSpace + reserveSpace;

    // Piocher les cartes nécessaires
    const [newDeck, drawnCards] = drawCards(gameState.deck, cardsNeeded);

    // Distribuer les cartes en priorité à la main
    const newHand = [...gameState.currentPlayer.hand];
    const newReserve = [...gameState.currentPlayer.reserve];

    drawnCards.forEach((card) => {
      if (newHand.length < maxHandCards) {
        newHand.push(card);
      } else if (newReserve.length < maxReserveCards) {
        newReserve.push(card);
      }
    });

    gameState.deck = newDeck;
    gameState.currentPlayer.hand = newHand;
    gameState.currentPlayer.reserve = newReserve;
    gameState.phase = 'PLAY';
    gameState.hasDrawn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleSkipAction(gameId: string): Promise<GameState | null> {
    console.log('handleSkipAction ', gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.phase !== 'PLAY' || gameState.hasPlayedAction) return null;

    gameState.hasPlayedAction = true;
    gameState.canEndTurn = true;
    gameState.playedCardsLastTurn = 0;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async endTurn(gameId: string): Promise<GameState | null> {
    console.log('handleEndTurn ', gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.phase !== 'PLAY' || gameState.hasPlayedAction) return null;

    const nextPhase =
      gameState.currentPlayer.reserve.length +
        gameState.currentPlayer.hand.length !==
      7
        ? 'DRAW'
        : 'DISCARD';

    gameState.hasDrawn = false;
    gameState.hasDiscarded = nextPhase === 'DISCARD' ? false : true;
    gameState.hasPlayedAction = false;
    gameState.phase = nextPhase;
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
    const card = gameState.currentPlayer.hand.find((c) => c.id === cardId);
    if (!card) return null;

    gameState.selectedCards = [card];

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }
}
