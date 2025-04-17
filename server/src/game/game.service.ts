import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Card, Player, Phase, Suit, ColumnState, GameState, attackCardButton, Profile } from "../types/game";
import { Game } from "../entities/game.entity";
import { createDeck, drawCards, shuffleDeck } from "../utils/deck";

import { initialAttackButtons } from "src/constants/definition";
import { getRandomValues } from "crypto";

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>
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
        id: "player-1",
        name: "Joueur 1",
        health: 10,
        maxHealth: 10,
        hand: initialHand,
        reserve: [],
        discardPile: [],
        profile: {
          epithet: "",
        },
        hasUsedStrategicShuffle: false,
      },
      deck: remainingDeck,
      phase: "SETUP",
      turn: 1,
      selectedCards: [],
      selectedSacrificeCards: [],
      columns: this.initializeColumns(),
      hasDiscarded: false,
      hasDrawn: false,
      hasPlayedAction: false,
      isGameOver: false,
      attackMode: false,
      message: "",
      winner: null,
      canEndTurn: false,
      blockableColumns: [],
      // canBlock: false,
      blockedColumns: [],
      showRevolutionPopup: false,
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
        reserveSuit: null,
        faceCards: {},
      },
      DIAMONDS: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
        reserveSuit: null,
        faceCards: {},
      },
      CLUBS: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
        reserveSuit: null,
        faceCards: {},
      },
      SPADES: {
        cards: [],
        isDestroyed: false,
        attackStatus: {
          attackButtons: initialAttackButtons,
          lastAttackCard: {},
        },
        hasLuckyCard: false,
        reserveSuit: null,
        faceCards: {},
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
      const updatedHand = gameState.currentPlayer.hand.filter((c) => c.id !== card.id);

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
        phase: "DISCARD",
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

  async handleCardPlace(gameId: string, suit: Suit, selectedCards: Card[]): Promise<GameState | null> {
    console.log("handleCardPlace ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    const column = gameState.columns[suit];
    if (!column || column.isDestroyed) return null;

    const reserveSuitCard = column.reserveSuit;
    const position = column.cards.length;

    // Handle placing a 7 from reserve suit to column
    if (reserveSuitCard?.value === "7" && reserveSuitCard.suit === suit && position === 6) {
      gameState.selectedCards = [];
      gameState.hasPlayedAction = true;

      game.state = gameState;
      await this.gameRepository.save(game);
      return gameState;
    }

    // Handle placing a 7 from hand/reserve to reserve suit
    const selectedCard = selectedCards.find((card) => card.value === "7" || card.type === "JOKER");
    if (selectedCard && position === 6) {
      // Remove selected card from hand or reserve
      const newHand = gameState.currentPlayer.hand.filter((c) => c.id !== selectedCard.id);
      const newReserve = gameState.currentPlayer.reserve.filter((c) => c.id !== selectedCard.id);

      // Move reserve suit card to hand or reserve based on where the 7/Joker came from
      const isFromHand = gameState.currentPlayer.hand.some((c) => c.id === selectedCard.id);
      if (reserveSuitCard) {
        if (isFromHand) {
          newHand.push(reserveSuitCard);
        } else {
          newReserve.push(reserveSuitCard);
        }
      }

      gameState.columns[suit].cards = [
        ...column.cards.slice(0, position),
        selectedCard,
        ...column.cards.slice(position + 1),
      ];
      gameState.columns[suit].reserveSuit = null;

      gameState.currentPlayer.hand = newHand;
      gameState.currentPlayer.reserve = newReserve;
      gameState.hasPlayedAction = true;
      gameState.selectedCards = [];

      game.state = gameState;
      await this.gameRepository.save(game);
      return gameState;
    }

    // Si c'est un Joker et que la colonne est pleine (10 cartes), on bloque simplement le placement
    if (selectedCards[0]?.type === "JOKER" && column.cards.length >= 10) {
      gameState.selectedCards = [];
      gameState.message = "Cette colonne est pleine"; //TBC

      game.state = gameState;
      await this.gameRepository.save(game);
      return gameState;
    }

    // Cas d'activation avec Tête + Activateur
    if (selectedCards.length === 2) {
      const hasFaceCard = selectedCards.some((card) => card.value === "J" || card.value === "K");
      const hasActivator = selectedCards.some((card) => card.type === "JOKER" || card.value === "7");

      if (hasFaceCard && hasActivator) {
        var faceCard = selectedCards.find((card) => card.value === "J" || card.value === "K");
        const activatorCard = selectedCards.find((card) => card.type === "JOKER" || card.value === "7");
        const activator = selectedCards.some((c) => c.type === "JOKER") ? "JOKER" : "seven";

        // Pour les têtes, on vérifie uniquement la couleur, pas l'activation
        if (faceCard?.suit === suit) {
          const newHand = gameState.currentPlayer.hand.filter(
            (card) => !selectedCards.some((selected) => selected.id === card.id)
          );
          const newReserve = gameState.currentPlayer.reserve.filter(
            (card) => !selectedCards.some((selected) => selected.id === card.id)
          );

          gameState.columns[suit].faceCards[faceCard.value] = { ...faceCard, activatedBy: activator };

          gameState.currentPlayer.hand = newHand;
          gameState.currentPlayer.reserve = newReserve;
          gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, activatorCard];
          gameState.hasPlayedAction = true;
          gameState.selectedCards = [];

          game.state = gameState;
          await this.gameRepository.save(game);
          return gameState;
        }
      }

      // Sinon on vérifie si c'est un As + activateur
      if (selectedCards.some((card) => card.value === "A") && hasActivator && position === 0) {
        console.log("Sinon on vérifie si c'est un As + activateur");

        const ace = selectedCards.find((card) => card.value === "A");
        const activator = selectedCards.find((card) => card.type === "JOKER" || card.value === "7");

        if (ace?.suit === suit && (column.cards.length === 0 || !column.hasLuckyCard)) {
          // Réinitialiser le blocage pour cette colonne car c'est un nouveau cycle
          const newBlockedColumns = gameState.blockedColumns.filter((i) => {
            const columnSuit = Object.keys(gameState.columns)[i];
            return columnSuit !== suit;
          });

          // Remove cards from hand/reserve
          const newHand = gameState.currentPlayer.hand.filter(
            (card) => !selectedCards.some((selected) => selected.id === card.id)
          );
          const newReserve = gameState.currentPlayer.reserve.filter(
            (card) => !selectedCards.some((selected) => selected.id === card.id)
          );

          // Déterminer le type d'activateur
          const activatorDisplay = activator?.type === "JOKER" ? "JOKER" : `7${activator.suit}`; // Combine le 7 avec sa famille

          gameState.blockedColumns = newBlockedColumns;
          gameState.columns[suit].hasLuckyCard = true;
          gameState.columns[suit].cards = [ace];
          gameState.columns[suit].reserveSuit = activator;
          // gameState.columns[suit].activatorType = activatorDisplay;//TBC

          gameState.currentPlayer.hand = newHand;
          gameState.currentPlayer.reserve = newReserve;
          gameState.hasPlayedAction = true;
          gameState.selectedCards = [];

          game.state = gameState;
          await this.gameRepository.save(game);
          return gameState;
        }
      }
    }

    // Placement normal d'une carte
    if (selectedCards.length === 1) {
      const card = selectedCards[0];

      // Vérifier si c'est un 7 ou un Joker pour la reserveSuit
      // const isActivator = card.type === "JOKER" || card.value === "7";
      const isActivator = card.value === "7";

      if (isActivator) {
        // Vérifier si la reserveSuit est déjà occupée
        if (column.reserveSuit !== null) {
          return gameState;
        }

        // Placement dans reserveSuit uniquement pour 7 et Joker
        const newHand = gameState.currentPlayer.hand.filter((c) => c.id !== card.id);
        const newReserve = gameState.currentPlayer.reserve.filter((c) => c.id !== card.id);

        gameState.columns[suit].reserveSuit = card;

        gameState.currentPlayer.hand = newHand;
        gameState.currentPlayer.reserve = newReserve;
        gameState.hasPlayedAction = true;
        gameState.selectedCards = [];

        await this.gameRepository.save(game);
        return gameState;
      }

      // Pour les cartes numériques (As à 10)
      if (card.type != "JOKER") {
        if (card.suit !== suit || !column.hasLuckyCard) {
          return gameState;
        }

        // Vérifier si c'est une carte numérique (As à 10)
        const numericValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        if (!numericValues.includes(card.value)) {
          return gameState;
        }

        // Vérifier l'ordre chronologique
        const currentValue = card.value;
        const expectedValue = numericValues[column.cards.length];
        if (currentValue !== expectedValue) {
          return gameState;
        }

        var newButtonsState = gameState.columns[suit].attackStatus.attackButtons;

        // Si on remplace un Joker, réactiver les attaques pour cette catégorie
        const cardToReplace = column.cards[column.cards.length];
        if (cardToReplace && cardToReplace.type === "JOKER") {
          const currentCategory = initialAttackButtons[column.cards.length].category;
          newButtonsState = gameState.columns[suit].attackStatus.attackButtons.map((button) => {
            if (button.category === currentCategory && !button.wasUsed) {
              return { ...button, active: true }; // Réactiver les boutons si pas encore attaqué
            }
            return button;
          });
        }

        // Placement normal dans la séquence
        const newHand = gameState.currentPlayer.hand.filter((c) => c.id !== card.id);
        const newReserve = gameState.currentPlayer.reserve.filter((c) => c.id !== card.id);

        gameState.columns[suit].cards = [...gameState.columns[suit].cards, card];
        gameState.columns[suit].attackStatus = { attackButtons: newButtonsState, lastAttackCard: {} };

        gameState.currentPlayer.hand = newHand;
        gameState.currentPlayer.reserve = newReserve;
        gameState.hasPlayedAction = true;
        gameState.selectedCards = [];

        // check for revolution
        const _gameState = this.checkRevolution(gameState, suit);
        game.state = _gameState;

        await this.gameRepository.save(game);
        return gameState;
      }

      // si joker
      if (card.value == "JOKER") {
        //le joker ne peut remplacer A, 7 et 10
        if (position == 0 || position == 6 || position == 9) {
          gameState.selectedCards = [];
          game.state = gameState;
          await this.gameRepository.save(game);
          return gameState;
        }

        //desactiver l'attaque pour la categorie correspondante
        const currentCategory = initialAttackButtons[column.cards.length].category;
        newButtonsState = gameState.columns[suit].attackStatus.attackButtons.map((button) => {
          if (button.category === currentCategory) {
            return { ...button, active: false }; // Désactiver les boutons de la catégorie
          }
          return button;
        });
      }

      // Placement normal dans la séquence
      const newHand = gameState.currentPlayer.hand.filter((c) => c.id !== card.id);
      const newReserve = gameState.currentPlayer.reserve.filter((c) => c.id !== card.id);

      gameState.columns[suit].cards = [...gameState.columns[suit].cards, card];
      gameState.columns[suit].attackStatus = { attackButtons: newButtonsState, lastAttackCard: {} };

      gameState.currentPlayer.hand = newHand;
      gameState.currentPlayer.reserve = newReserve;
      gameState.hasPlayedAction = true;
      gameState.selectedCards = [];

      // check for revolution
      const _gameState = this.checkRevolution(gameState, suit);
      game.state = _gameState;
      await this.gameRepository.save(game);
      return gameState;
    }

    // Cas d'activation avec Dame + Activateur
    if (selectedCards.length === 2) {
      const hasQueen = selectedCards.some((card) => card.value === "Q");
      const hasActivator = selectedCards.some((card) => card.type === "JOKER" || card.value === "7");

      if (hasQueen && hasActivator) {
        const queen = selectedCards.find((card) => card.value === "Q");
        const activator = selectedCards.find((card) => card.type === "JOKER" || card.value === "7");

        // Remove cards from hand/reserve
        const newHand = gameState.currentPlayer.hand.filter(
          (card) => !selectedCards.some((selected) => selected.id === card.id)
        );
        const newReserve = gameState.currentPlayer.reserve.filter(
          (card) => !selectedCards.some((selected) => selected.id === card.id)
        );

        // Calculate health gain
        const healAmount = activator?.type === "JOKER" ? 4 : 2;
        const newMaxHealth = gameState.currentPlayer.maxHealth + healAmount;

        gameState.currentPlayer.hand = newHand;
        gameState.currentPlayer.reserve = newReserve;
        gameState.currentPlayer.health = newMaxHealth;
        gameState.currentPlayer.maxHealth = newMaxHealth;
        gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, queen, activator];

        gameState.selectedCards = [];
        gameState.hasPlayedAction = true;
        gameState.canEndTurn = true;

        game.state = gameState;
        await this.gameRepository.save(game);
        return gameState;
      }
    }

    console.log("ret end");

    // Sauvegarder l'état mis à jour
    game.state = gameState;
    await this.gameRepository.save(game);

    return gameState;
  }

  async handleJokerExchange(gameId: string, selectedCard: Card): Promise<GameState | null> {
    console.log("handleJokerExchange ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (gameState.phase !== "PLAY" || gameState.hasPlayedAction) return null;

    const updatedPlayer = { ...gameState.currentPlayer };
    const isInHand = updatedPlayer.hand.some((c) => c.id === selectedCard.id);

    const jokerCard = gameState.columns[selectedCard.suit].cards[parseInt(selectedCard.value) - 1];

    if (isInHand) updatedPlayer.hand = updatedPlayer.hand.map((c) => (c.id === selectedCard.id ? jokerCard : c));
    else updatedPlayer.reserve = updatedPlayer.reserve.map((c) => (c.id === selectedCard.id ? jokerCard : c));

    const updatedColumns = { ...gameState.columns };

    updatedColumns[selectedCard.suit].cards = updatedColumns[selectedCard.suit].cards.map(
      (card: Card, index: number) => ((index + 1).toString() == selectedCard.value ? selectedCard : card)
    );

    const attackBtns = updatedColumns[selectedCard.suit].attackStatus.attackButtons;

    const newAttackButtons = attackBtns.map((btn) => {
      return !btn.active && !btn.wasUsed ? { ...btn, active: true } : { ...btn };
    });

    updatedColumns[selectedCard.suit].attackStatus.attackButtons = newAttackButtons;

    gameState.currentPlayer = updatedPlayer;
    gameState.columns = updatedColumns;
    gameState.hasPlayedAction = true;
    // gameState.exchangeMode = false;
    // gameState.selectedForExchange = null;
    gameState.phase = "PLAY";
    gameState.canEndTurn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleJokerAction(gameId: string, jokerCard: Card, action: string): Promise<GameState | null> {
    console.log("handleJokerAction ", action, " ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (jokerCard.type !== "JOKER" || gameState.hasPlayedAction || gameState.phase !== "PLAY") {
      return null;
    }

    let updatedPlayer = { ...gameState.currentPlayer };

    if (action === "heal") {
      // Augmente les PV max et actuels de 3
      const newHealth = updatedPlayer.health + 3;
      updatedPlayer.maxHealth = newHealth;
      updatedPlayer.health = newHealth;

      // Déplace le Joker vers la défausse
      updatedPlayer.hand = updatedPlayer.hand.filter((c) => c.id !== jokerCard.id);
      updatedPlayer.reserve = updatedPlayer.reserve.filter((c) => c.id !== jokerCard.id);
      updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];
    } else if (action === "attack") {
      // Simule une attaque en mode solo
      updatedPlayer.hand = updatedPlayer.hand.filter((c) => c.id !== jokerCard.id);
      updatedPlayer.reserve = updatedPlayer.reserve.filter((c) => c.id !== jokerCard.id);
      updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];
    }

    gameState.currentPlayer = updatedPlayer;
    gameState.hasPlayedAction = true;
    gameState.selectedCards = [];
    gameState.canEndTurn = true;
    gameState.phase = "PLAY";

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleQueenChallenge(gameId: string, selectedCards: Card[], isCorrect: boolean): Promise<GameState | null> {
    console.log("handleQueenChallenge ", selectedCards.length, " ", isCorrect, " ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    const healAmount = isCorrect ? 5 : 1;
    const newMaxHealth = gameState.currentPlayer.maxHealth + healAmount;

    const queen = selectedCards.find((card) => card.value === "Q");
    const joker = selectedCards.find((card) => card.type === "JOKER");

    if (!queen || !joker) return null;

    const newHand = gameState.currentPlayer.hand.filter(
      (card) => !gameState.selectedCards.some((selected) => selected.id === card.id)
    );
    const newReserve = gameState.currentPlayer.reserve.filter(
      (card) => !gameState.selectedCards.some((selected) => selected.id === card.id)
    );

    gameState.currentPlayer.hand = newHand;
    gameState.currentPlayer.reserve = newReserve;
    gameState.currentPlayer.health = newMaxHealth;
    gameState.currentPlayer.maxHealth = newMaxHealth;
    gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, queen, joker];
    gameState.selectedCards = [];
    gameState.hasPlayedAction = true;
    gameState.canEndTurn = true;
    gameState.canEndTurn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleActivatorExchange(gameId: string, columnCard: Card, playerCard: Card): Promise<GameState | null> {
    console.log("handleActivatorExchange ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (gameState.phase !== "PLAY" || gameState.hasPlayedAction) return null;

    const isActivator = (card: Card) => card.type === "JOKER" || card.value === "7";
    if (!isActivator(columnCard) || !isActivator(playerCard)) {
      return null;
    }

    const updatedPlayer = { ...gameState.currentPlayer };
    const isInHand = updatedPlayer.hand.some((c) => c.id === playerCard.id);

    if (isInHand) {
      updatedPlayer.hand = updatedPlayer.hand.map((c) => (c.id === playerCard.id ? columnCard : c));
    } else {
      updatedPlayer.reserve = updatedPlayer.reserve.map((c) => (c.id === playerCard.id ? columnCard : c));
    }

    const updatedColumns = { ...gameState.columns };
    const targetColumn = Object.values(updatedColumns).find((col) => col.reserveSuit?.id === columnCard.id);

    if (targetColumn) {
      targetColumn.reserveSuit = playerCard;
    }

    gameState.currentPlayer = updatedPlayer;
    gameState.columns = updatedColumns;
    gameState.hasPlayedAction = true;
    gameState.message = "Échange d'activateurs effectué";
    gameState.canEndTurn = true;
    gameState.phase = "PLAY";

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleAttack(gameId: string, attackCard: Card): Promise<GameState | null> {
    console.log("handleAttack ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    var gameState = game.state;

    const column = gameState.columns[attackCard.suit];
    const valet = column?.faceCards?.J;

    //Le valet doit être en position d’attaque des qu’il rentre sur le terrain avec un sacrifice ou un Joker, donc possibilité d’attaquer des le tour où il est joué
    if (attackCard.value === "J" && (valet?.activatedBy == "SACRIFICE" || valet?.activatedBy == "JOKER")) {
    } else {
      if (gameState.phase !== "PLAY" || gameState.hasPlayedAction) return null;
    }

    // Logique spécifique pour l'attaque du Valet
    if (attackCard.value === "J") {
      const column = gameState.columns[attackCard.suit];
      const valet = column.faceCards?.J;

      const buttonsState = column.attackStatus.attackButtons;
      const clickedButtonState = buttonsState.find((button) => button.id === attackCard.value);

      if (!clickedButtonState || !clickedButtonState.active) {
        return null;
      }

      // Désactiver tous les boutons de la même catégorie
      const newButtonsState = buttonsState.map((button) => {
        if (button.category === clickedButtonState.category) {
          return { ...button, active: false, wasUsed: true }; // Désactiver les boutons de la catégorie
        }
        return button;
      });

      const updatedColumns = { ...gameState.columns };

      updatedColumns[attackCard.suit].attackStatus = {
        lastAttackCard: { cardValue: attackCard.value, turn: gameState.turn },
        attackButtons: newButtonsState,
      };

      gameState.columns = updatedColumns;
      gameState.hasPlayedAction = true;
    } else {
      // Vérifier d'abord si un Roi bloque l'attaque
      const isKingInvolved = this.handleAttackWithKing(gameState, attackCard).isHandleWithKing;
      if (isKingInvolved) {
        // L'attaque a été gérée par la logique du Roi
        gameState = this.handleAttackWithKing(gameState, attackCard).gameState;
      } else {
        // Si aucun Roi n'est impliqué, continuer avec la logique d'attaque normale
        // Trouver le bouton cliqué
        const buttonsState = gameState.columns[attackCard.suit].attackStatus.attackButtons;

        const clickedButtonState = buttonsState.find((button) => button.id === attackCard.value);

        if (!clickedButtonState || !clickedButtonState.active) {
          return null;
        }

        // Désactiver tous les boutons de la même catégorie
        const newButtonsState = buttonsState.map((button) => {
          if (button.category === clickedButtonState.category) {
            return { ...button, active: false, wasUsed: true }; // Désactiver les boutons de la catégorie
          }
          return button;
        });

        const updatedColumns = { ...gameState.columns };

        updatedColumns[attackCard.suit].attackStatus = {
          lastAttackCard: attackCard.value,
          attackButtons: newButtonsState,
        };

        gameState.columns = updatedColumns;
        gameState.hasPlayedAction = true;
      }
    }

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  private handleAttackWithKing(
    gameState: GameState,
    attackingCard: Card
  ): { gameState: GameState; isHandleWithKing: boolean } {
    const defendingKing = gameState.columns[attackingCard.suit]?.faceCards?.K;

    if (!defendingKing) {
      return { gameState: gameState, isHandleWithKing: false }; // Pas de Roi présent, l'attaque continue normalement
    }

    // Vérifier si le Roi bloque l'attaque
    if (this.isAttackBlockedByKing(attackingCard, defendingKing)) {
      gameState.hasPlayedAction = true;
      gameState.canEndTurn = true;
      gameState.message = `Attaque bloquée par le Roi de ${defendingKing.suit}!`;

      return { gameState: gameState, isHandleWithKing: true }; // Attaque bloquée
    }

    // Vérifier si le Roi est vaincu
    if (this.isKingDefeated(attackingCard, defendingKing)) {
      gameState = this.handleKingDefeat(gameState, attackingCard, defendingKing);
      return { gameState: gameState, isHandleWithKing: true }; // Roi vaincu
    }

    return { gameState: gameState, isHandleWithKing: false }; // L'attaque continue normalement
  }

  // Vérifie si une attaque est bloquée par le Roi
  private isAttackBlockedByKing(attackingCard: Card, defendingKing: Card): boolean {
    // Vérifie si la carte est de la même enseigne et si elle est inférieure ou égale à 6
    if (attackingCard.suit === defendingKing.suit) {
      const blockedValues = ["A", "2", "3", "4", "5", "6"];
      return blockedValues.includes(attackingCard.value);
    }
    return false;
  }

  // Vérifie si le Roi est battu par une carte autorisée
  private isKingDefeated(attackingCard: Card, defendingKing: Card): boolean {
    const defeatingValues = ["8", "9"];
    return (
      (attackingCard.suit === defendingKing.suit && defeatingValues.includes(attackingCard.value)) ||
      attackingCard.type === "JOKER"
    );
  }

  // Met à jour le GameStore lorsque le Roi est battu
  private handleKingDefeat(gameState: GameState, attackingCard: Card, defendingKing: Card) {
    // Retire le Roi du terrain
    const updatedColumns = { ...gameState.columns };
    const column = updatedColumns[defendingKing.suit];

    if (column && column.faceCards) {
      // Supprimer le Roi des faceCards
      const { K, ...restFaceCards } = column.faceCards;
      column.faceCards = restFaceCards;

      gameState.columns = updatedColumns;
      gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, defendingKing];
      gameState.message = `Le Roi de ${defendingKing.suit} a été vaincu par ${
        attackingCard.type === "JOKER" ? "le Joker" : attackingCard.value
      } !`;
      gameState.hasPlayedAction = true;
      gameState.canEndTurn = true;
    }

    return gameState;
  }

  async handleStrategicShuffle(gameId: string): Promise<GameState | null> {
    console.log("handleStrategicShuffle ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (!this.canUseStrategicShuffle(gameState)) return null;

    const allDiscardedCards = [...gameState.currentPlayer.hand, ...gameState.currentPlayer.discardPile];
    const allCards = [...gameState.deck, ...allDiscardedCards];
    const newDeck = shuffleDeck(allCards);
    const [remainingDeck, newHand] = drawCards(newDeck, 5);

    if (gameState.currentPlayer.hasUsedStrategicShuffle) {
      gameState.hasPlayedAction = true;
      gameState.canEndTurn = true;
    }

    gameState.deck = remainingDeck;
    gameState.currentPlayer.hand = newHand;
    gameState.currentPlayer.discardPile = [];
    gameState.phase = "PLAY";
    gameState.hasDiscarded = true;
    gameState.hasDrawn = true;
    gameState.hasPlayedAction = false;
    gameState.currentPlayer.hasUsedStrategicShuffle = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleExchangeCards(gameId: string, card1: Card, card2: Card): Promise<GameState | null> {
    console.log("handleExchangeCards ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    const hand = [...gameState.currentPlayer.hand];
    const reserve = [...gameState.currentPlayer.reserve];

    // Trouver les indices des cartes
    const handIndex = hand.findIndex((c) => c.id === card1.id);
    const reserveIndex = reserve.findIndex((c) => c.id === card2.id);

    // Si l'une des cartes n'est pas trouvée, annuler l'échange
    if (handIndex === -1 || reserveIndex === -1) {
      return null;
    }

    // Échanger les cartes
    const tempCard = hand[handIndex];
    hand[handIndex] = reserve[reserveIndex];
    reserve[reserveIndex] = tempCard;

    gameState.currentPlayer.hand = hand;
    gameState.currentPlayer.reserve = reserve;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleSacrificeSpecialCard(
    gameId: string,
    specialCard: Card,
    selectedCards: Card[]
  ): Promise<GameState | null> {
    console.log("handleSacrificeSpecialCard ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (!specialCard || selectedCards.length === 0) return null;

    // Vérifier le nombre de cartes requis
    const requiredCards = specialCard.value === "K" ? 3 : specialCard.value === "Q" ? 2 : 1;

    if (selectedCards.length !== requiredCards) return null;

    // Retirer les cartes sacrifiées des colonnes
    const updatedColumns = { ...gameState.columns };
    selectedCards.forEach((card) => {
      const column = updatedColumns[card.suit];
      if (column) {
        // Garder l'état hasLuckyCard, reserveSuit et activatorType tout en retirant la carte
        const newCards = column.cards.filter((c) => c.id !== card.id);
        column.cards = newCards;
        // Préserver l'état d'activation de la colonne
        column.hasLuckyCard = column.hasLuckyCard;
        column.reserveSuit = column.reserveSuit;
        column.activatorType = column.activatorType;
      }
    });

    // Pour le Roi et le Valet, ajouter la carte spéciale aux faceCards
    if (specialCard.value === "K" || specialCard.value === "J") {
      const column = updatedColumns[specialCard.suit];
      column.faceCards = {
        ...column.faceCards,
        [specialCard.value]: { ...specialCard, activatedBy: "SACRIFICE" },
      };
    }

    // Calculer le bonus de santé
    let healthBonus = specialCard.value === "Q" ? 2 : 0;

    // Retirer la carte spéciale de la main ou de la réserve
    const newHand = gameState.currentPlayer.hand.filter((c) => c.id !== specialCard.id);
    const newReserve = gameState.currentPlayer.reserve.filter((c) => c.id !== specialCard.id);

    // Mettre toutes les cartes sacrifiées dans la défausse
    const cardsToDiscard = [...selectedCards];
    if (specialCard.value === "Q") {
      cardsToDiscard.push(specialCard);
    }

    // Construire le message final
    const actionMessage =
      specialCard.value === "K"
        ? "Roi placé après sacrifice de 3 unités"
        : specialCard.value === "Q"
          ? "Dame sacrifiée, +2 points de vie"
          : "Valet placé après sacrifice";
    const message = `${actionMessage}. Cliquez sur 'Fin du tour' pour continuer.`;

    gameState.columns = updatedColumns;
    gameState.currentPlayer.hand = newHand;
    gameState.currentPlayer.reserve = newReserve;
    gameState.currentPlayer.health = gameState.currentPlayer.health + healthBonus;
    gameState.currentPlayer.maxHealth =
      specialCard.value === "Q" ? gameState.currentPlayer.maxHealth + healthBonus : gameState.currentPlayer.maxHealth;
    gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, ...cardsToDiscard];
    gameState.selectedCards = [];

    gameState.hasPlayedAction = true;
    gameState.message = message;
    gameState.canEndTurn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleBlock(gameId: string, suit: Suit): Promise<GameState | null> {
    console.log("handleBlock ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    const { phase, hasPlayedAction, blockedColumns } = gameState;

    // Vérifier si l'action est valide
    if (phase !== "PLAY" || hasPlayedAction || blockedColumns.includes(suit)) {
      return null;
    }

    // Vérifier si la colonne a une séquence complète
    const column = gameState.columns[suit];

    if (!column) {
      return null;
    }

    // Vérifier la séquence de cartes
    const sequence = ["A", "2", "3", "4", "5", "6", "7"];
    const columnCards = column.cards.slice(0, 7);
    const columnValues = columnCards.map((card) => {
      return card.value;
    });

    // Vérifier si la séquence est complète et dans l'ordre
    const isSequenceComplete = sequence.every((value, index) => {
      const cardValue = columnValues[index];
      return cardValue === value || cardValue === "JOKER";
    });

    if (!isSequenceComplete) {
      return null;
    }

    gameState.hasPlayedAction = true;
    gameState.canEndTurn = true;
    gameState.blockedColumns = [...gameState.blockedColumns, suit];
    gameState.message = "game.messages.blockSuccess";

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  private canUseStrategicShuffle(gameState): boolean {
    return (
      gameState.phase === "DISCARD" && // Uniquement en phase de défausse (début du tour)
      !gameState.hasDiscarded && // Pas encore défaussé
      !gameState.hasDrawn && // Pas encore pioché
      !gameState.hasPlayedAction && // Pas encore joué d'action
      !gameState.currentPlayer.hasUsedStrategicShuffle // N'a pas encore utilisé le mélange ce tour-ci
    );
  }

  private checkRevolution(gameState: GameState, suit: Suit): GameState {
    console.log("checkRevolution ");

    const column = gameState.columns[suit];

    const isJokerReplaceCard = column.cards.some((card) => card.type === "JOKER");

    // Vérifie si la colonne est complète (10 cartes)
    if (column.cards.length === 10 && !isJokerReplaceCard) {
      // Récupérer la carte de reserveSuit si elle existe
      const reserveSuitCard = column.reserveSuit;

      // Séparer les cartes face (valet et roi) des autres cartes
      const faceCards = column.cards.filter((card) => card.value === "J" || card.value === "K");

      // Ne défausser que les cartes qui ne sont pas des valets ou des rois
      const cardsToDiscard = column.cards.filter((card) => card.value !== "J" && card.value !== "K");

      // Ajouter l'activateur à la défausse si présent
      if (reserveSuitCard) {
        cardsToDiscard.push(reserveSuitCard);
      }

      // Réinitialise la colonne mais garde les cartes face
      gameState.columns[suit].cards = faceCards;
      // gameState.columns[suit].isLocked = false;
      gameState.columns[suit].hasLuckyCard = false;
      // gameState.columns[suit].activatorType = null;
      // gameState.columns[suit].sequence = [];
      gameState.columns[suit].reserveSuit = null;
      // gameState.columns[suit].isReserveSuitLocked = false;// S'assure que la colonne n'est pas verrouillée
      gameState.columns[suit].faceCards = column.faceCards; // Préserve les cartes face existantes
      gameState.columns[suit].attackStatus = { attackButtons: initialAttackButtons, lastAttackCard: {} };

      gameState.currentPlayer.discardPile = [...gameState.currentPlayer.discardPile, ...cardsToDiscard];

      gameState.showRevolutionPopup = true;
      gameState.hasPlayedAction = true;
    }

    return gameState;
  }

  private canPlaceCard(gameState: GameState, suit: Suit, selectedCards: Card[]): boolean {
    if (gameState.phase !== "PLAY") return false;

    // Pour l'activation avec As + JOKER/7
    if (selectedCards.length === 2) {
      const [card1, card2] = selectedCards;

      // Vérifier si c'est une activation de tête
      const hasFaceCard = card1.value === "J" || card1.value === "K" || card2.value === "J" || card2.value === "K";
      const hasActivator =
        card1.type === "JOKER" || card1.value === "7" || card2.type === "JOKER" || card2.value === "7";

      // Les têtes de jeu peuvent toujours être jouées avec un activateur, peu importe l'état de la colonne
      if (hasFaceCard && hasActivator) {
        const faceCard = selectedCards.find((card) => card.value === "J" || card.value === "K");
        // On vérifie uniquement que la tête correspond à la couleur de la colonne
        return faceCard?.suit === suit;
      }

      // Vérifier si c'est une Dame + activateur
      const hasQueen = card1.value === "Q" || card2.value === "Q";
      if (hasQueen && hasActivator) {
        return true;
      }

      // Pour l'activation avec As + Activateur (JOKER ou 7)
      const hasAs = card1.value === "A" || card2.value === "A";
      if (hasAs && hasActivator) {
        const ace = selectedCards.find((card) => card.value === "A");
        return ace?.suit === suit;
      }
    }

    // Pour le placement normal de cartes
    if (selectedCards.length === 1) {
      const column = gameState.columns[suit];
      if (!column.hasLuckyCard) return false;
      return selectedCards[0].suit === suit || selectedCards[0].type === "JOKER";
    }

    return false;
  }

  async handleDiscardCard(gameId: string, card: Card): Promise<GameState | null> {
    console.log("handleDiscard ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (gameState.hasDiscarded || gameState.phase !== "DISCARD") return null;

    const isFromHand = gameState.currentPlayer.hand.some((c) => c.id === card.id);
    const isFromReserve = gameState.currentPlayer.reserve.some((c) => c.id === card.id);

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
    gameState.phase = "DRAW";

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleDrawCard(gameId: string): Promise<GameState | null> {
    console.log("handleDrawCard ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.phase !== "DRAW" || gameState.hasDrawn) return null;

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
    gameState.phase = "PLAY";
    gameState.hasDrawn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleSkipAction(gameId: string): Promise<GameState | null> {
    console.log("handleSkipAction ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;
    if (gameState.phase !== "PLAY" || gameState.hasPlayedAction) return null;

    gameState.hasPlayedAction = true;
    gameState.canEndTurn = true;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async endTurn(gameId: string): Promise<GameState | null> {
    console.log("handleEndTurn ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    // Réinitialiser l'état des Valets au début du tour
    // Object.keys(updatedColumns).forEach((suit) => {
    //   const valet = updatedColumns[suit].faceCards?.J;
    //   if (valet) {
    //     if (valet.activatedBy === "seven" && !valet.hasAttacked) {
    //       // Si le Valet a été activé avec un 7 et n'a pas encore attaqué
    //       updatedColumns[suit].faceCards.J = {
    //         ...valet,
    //         canAttackNextTurn: true,
    //         state: "active",
    //       };
    //     } else if (valet.hasAttacked) {
    //       // Si le Valet a attaqué, il doit attendre un tour
    //       updatedColumns[suit].faceCards.J = {
    //         ...valet,
    //         canAttackNextTurn: !valet.canAttackNextTurn, // Alterne entre true et false
    //       };
    //     }
    //   }
    // });

    const gameState = game.state;
    if (gameState.phase !== "PLAY") return null;

    const nextPhase =
      gameState.currentPlayer.reserve.length + gameState.currentPlayer.hand.length !== 7 ? "DRAW" : "DISCARD";

    gameState.currentPlayer.hasUsedStrategicShuffle = false;
    gameState.hasDrawn = false;
    gameState.hasDiscarded = nextPhase === "DISCARD" ? false : true;
    gameState.phase = nextPhase;
    gameState.turn += 1;
    gameState.hasPlayedAction = false;
    gameState.selectedCards = [];
    gameState.blockableColumns = [];
    gameState.blockedColumns = [];

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleRecycleDiscardPile(gameId: string): Promise<GameState | null> {
    console.log("handleRecycleDiscardPile ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    if (gameState.deck.length > 0 || gameState.currentPlayer.discardPile.length === 0) return null;

    const newDeck = shuffleDeck([...gameState.currentPlayer.discardPile]);

    gameState.deck = newDeck;
    gameState.currentPlayer.discardPile = [];

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleSurrender(gameId: string): Promise<GameState | null> {
    console.log("handleSurrender ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    gameState.isGameOver = true;
    gameState.winner = "opponent";
    gameState.message = "Vous avez abandonné la partie";

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }

  async handleUpdateProfile(gameId: string, profile: Profile): Promise<GameState | null> {
    console.log("handleUpdateProfile ", gameId);

    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return null;

    const gameState = game.state;

    gameState.currentPlayer.name = profile.name;
    gameState.currentPlayer.profile.epithet = profile.epithet;
    gameState.currentPlayer.profile.avatar = profile.avatar;

    game.state = gameState;
    await this.gameRepository.save(game);
    return gameState;
  }
}
