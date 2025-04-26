import React from "react";
import { Heart, Diamond, Club, Spade, Sword, Crown, Columns, Joystick } from "lucide-react";
import { Suit, ColumnState } from "../types/game";
import { cn } from "../utils/cn";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";
import { CardExchangeButton } from "./CardExchangeButton";
import { PlaceSevenButton } from "./PlaceSevenButton";
import { CardAttackButton } from "./CardAttackButton";
import { BlockButton } from "./BlockButton";
import { ValetAttackButton } from "./ValetAttackButton";

interface UnitColumnProps {
  suit: Suit;
  column: ColumnState;
  onCardPlace: () => void;
  isActive?: boolean;
}

export function UnitColumn({ suit, column, onCardPlace, isActive }: UnitColumnProps) {
  const { t } = useTranslation();
  const { selectedCards, phase, hasPlayedAction, columns } = useGameStore();

  const attackCardValet = column.cards.find((card) => card.value === "J");

  // Debug logs
  // console.log("UnitColumn Debug:", {
  //   suit,
  //   cardsLength: column.cards.length,
  //   phase,
  //   hasPlayedAction,
  //   columnState: column,
  // });

  // Vérifier si la colonne a une séquence complète
  const hasCompleteSequence = () => {
    const hasSevenCards = column.cards.length === 7;
    const canBlock = phase === "action" && !hasPlayedAction;

    console.log("Debug hasCompleteSequence:", {
      suit,
      nombreDeCartes: column.cards.length,
      phase,
      hasPlayedAction,
      hasSevenCards,
      canBlock,
    });

    return hasSevenCards && canBlock;
  };

  // Convertir la suite en index
  const suitToIndex = (suit: Suit): number => {
    switch (suit) {
      case "hearts":
        return 0;
      case "diamonds":
        return 1;
      case "clubs":
        return 2;
      case "spades":
        return 3;
      default:
        return -1;
    }
  };

  const getSuitIcon = () => {
    const iconClass = cn(
      "w-5 h-5",
      suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-gray-700 dark:text-gray-100"
    );

    return (
      <div className="flex items-center gap-2">
        {/* Icône de la suite */}
        {(() => {
          switch (suit) {
            case "hearts":
              return <Heart className={iconClass} />;
            case "diamonds":
              return <Diamond className={iconClass} />;
            case "clubs":
              return <Club className={iconClass} />;
            case "spades":
              return <Spade className={iconClass} />;
          }
        })()}

        {/* Indicateur d'activation (Joker ou 7) */}
        {column.reserveSuit && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-bold",
                  column.reserveSuit.type === "joker"
                    ? column.reserveSuit.color === "red"
                      ? "text-red-500"
                      : "text-gray-700 dark:text-gray-300"
                    : "text-yellow-500 dark:text-yellow-400"
                )}>
                {column.reserveSuit.type === "joker" ? "J" : "7"}
              </span>

              {/* Enseigne pour le 7 */}
              {column.reserveSuit.value === "7" && (
                <span
                  className={cn(
                    "text-sm",
                    column.reserveSuit.color === "red" ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  )}>
                  {column.reserveSuit.suit === "hearts" && "♥️"}
                  {column.reserveSuit.suit === "diamonds" && "♦️"}
                  {column.reserveSuit.suit === "clubs" && "♣️"}
                  {column.reserveSuit.suit === "spades" && "♠️"}
                </span>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-1">
              {(column.reserveSuit?.type === "joker" || column.reserveSuit?.value === "7") && column.cards[5] ? (
                <PlaceSevenButton />
              ) : !column.reserveSuit.value || column.reserveSuit.value !== "7" || !column.cards[5] ? (
                <CardExchangeButton activatorCard={column.reserveSuit} currentSuit={suit} />
              ) : (
                <></>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCardInSlot = (value: string, index: number) => {
    // Normaliser la valeur pour la recherche
    const searchValue = value === "A" ? "As" : value;
    var cardInSlot = column.cards.find((card) => card.value === searchValue);

    const currentIndex = 10 - index - 1;

    if (column.cards.length > currentIndex)
      var isJokerInSlot = column.cards[currentIndex].value === "JOKER" ? column.cards[currentIndex] : undefined;

    if (!cardInSlot && isJokerInSlot) cardInSlot = isJokerInSlot;

    const isAs = value === "A";

    const attackCard = column.cards.find((card) => card.value === value);
    const isValet = value === "J" && cardInSlot;

    return (
      <div key={value}>
        <div
          className={cn(
            "h-7 border rounded-sm flex items-center justify-center",
            cardInSlot
              ? "border-solid border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
              : isAs && column.hasLuckyCard
              ? "border-solid border-yellow-400 dark:border-yellow-500"
              : "border-dashed border-gray-300 dark:border-[#2a3041]",
            isAs && column.hasLuckyCard && "ring-2 ring-yellow-400 dark:ring-yellow-500"
          )}>
          {cardInSlot ? (
            <>
              <span
                className={cn(
                  "text-sm font-medium",
                  cardInSlot.color === "red" ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                )}>
                {value}
              </span>
            </>
          ) : (
            <>
              <span
                className={cn(
                  "text-sm",
                  isAs && column.hasLuckyCard
                    ? "text-yellow-500 dark:text-yellow-400 font-medium"
                    : "text-gray-500 dark:text-[#404859]"
                )}>
                {value}
              </span>
            </>
          )}
          {/* Afficher l'épée d'attaque pour les unités normales */}
          {/* {(attackCard ? true : false) && !isValet && ( */}
          {(attackCard ? true : false) && <CardAttackButton attackCard={attackCard} />}
          {isJokerInSlot && <Joystick className={cn("w-5 h-5 pl-50 absolute right-[25%]", "text-red-700  ")} />}

          {/* Afficher l'épée d'attaque pour le Valet */}
          {/* {isValet && cardInSlot && (
            <ValetAttackButton valetCard={cardInSlot} columnSuit={suit} />
          )} */}
        </div>
      </div>
    );
  };

  // Debug logs améliorés
  // console.log("UnitColumn Debug:", {
  //   suit,
  //   suitIndex: suitToIndex(suit),
  //   cardsLength: column.cards.length,
  //   cardValues: column.cards.map((c) => c.value),
  //   hasCompleteSeq: hasCompleteSequence(),
  //   phase,
  //   hasPlayedAction,
  // });

  const handleClick = () => {
    console.log("Column clicked:", {
      suit,
      isActive,
      hasLuckyCard: column.hasLuckyCard,
      reserveSuit: column.reserveSuit,
    });

    if (isActive) {
      onCardPlace();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative bg-white dark:bg-[rgb(19,25,39)] rounded-xl overflow-hidden transition-all duration-200",
        isActive && [
          "cursor-pointer",
          "ring-2 ring-blue-400 dark:ring-blue-500",
          "shadow-lg",
          "transform hover:scale-[1.02]",
        ],
        isActive && selectedCards.length === 2 && ["ring-4 ring-yellow-400 dark:ring-yellow-500", "animate-pulse"]
      )}>
      {/* En-tête avec l'icône de la suite et le compteur */}
      <div className="flex justify-between items-center px-4 py-2.5">
        <div className="flex items-center gap-4">
          {getSuitIcon()}
          {column.cards.length >= 7 && phase === "action" && !hasPlayedAction && (
            <BlockButton columnIndex={suitToIndex(suit)} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{column.cards.length}/10</span>
        </div>
      </div>

      {/* Zone des emplacements de cartes */}
      <div className="px-4 py-2 space-y-[6px]">
        {["10", "9", "8", "7", "6", "5", "4", "3", "2", "A"].map((value, index) => renderCardInSlot(value, index))}
      </div>

      {/* Zone Valet/Roi avec ligne de séparation */}
      <div>
        <div className="mx-4 border-t border-gray-300 dark:border-[#2a3041]" />
        <div className="grid grid-cols-2 gap-2 p-2">
          {/* Valet */}
          <div
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-lg relative",
              column.faceCards?.J ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-50 dark:bg-[rgb(26,33,47)]"
            )}>
            <div className="flex flex-col items-center space-y-1 relative w-full">
              <Sword className="w-4 h-4 text-gray-500 dark:text-[#404859]" />
              {/* Ajouter l'épée dorée si un Valet est présent */}
              {column.faceCards?.J && (
                <div
                  className={cn(
                    "absolute right-[15%] top-[50%] -translate-y-[50%]",
                    column.faceCards.J.state === "active" ? "animate-pulse" : "text-gray-400"
                  )}>
                  {column.faceCards?.J && <CardAttackButton attackCard={column.faceCards?.J} />}
                </div>
              )}
              <span
                className={cn(
                  "text-xs",
                  column.faceCards?.J?.color === "red" ? "text-red-500" : "text-gray-500 dark:text-[#404859]"
                )}>
                {column.faceCards?.J ? "J" : "Valet"}
              </span>
            </div>
          </div>

          {/* Roi */}
          <div
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-lg",
              column.faceCards?.K ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-50 dark:bg-[rgb(26,33,47)]"
            )}>
            <Crown className="w-4 h-4 text-gray-500 dark:text-[#404859]" />
            <span
              className={cn(
                "text-xs mt-1",
                column.faceCards?.K?.color === "red" ? "text-red-500" : "text-gray-500 dark:text-[#404859]"
              )}>
              {column.faceCards?.K ? "K" : "Roi"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
