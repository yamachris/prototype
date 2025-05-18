import React from "react";
import { Heart, Diamond, Club, Spade, Sword, Crown, Columns, Joystick } from "lucide-react";
import { Card, Suit, ColumnState } from "../types/game";
import { cn } from "../utils/cn";
import { useTranslation } from "react-i18next";
import { useGameStore } from "../store/gameStore";
import { CardExchangeButton } from "./CardExchangeButton";
import { PlaceSevenButton } from "./PlaceSevenButton";
import { CardAttackButton } from "./CardAttackButton";
import { BlockButton } from "./BlockButton";

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
    const canBlock = phase === "PLAY" && !hasPlayedAction;

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

  const getSuitIcon = () => {
    const iconClass = cn(
      "w-5 h-5",
      suit === "HEARTS" || suit === "DIAMONDS" ? "text-red-500" : "text-gray-700 dark:text-gray-100"
    );

    return (
      <div className="flex items-center gap-2">
        {/* Icône de la suite */}
        {(() => {
          switch (suit) {
            case "HEARTS":
              return <Heart className={iconClass} />;
            case "DIAMONDS":
              return <Diamond className={iconClass} />;
            case "CLUBS":
              return <Club className={iconClass} />;
            case "SPADES":
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
                  column.reserveSuit.type === "JOKER"
                    ? column.reserveSuit.color === "red"
                      ? "text-red-500"
                      : "text-gray-700 dark:text-gray-300"
                    : "text-yellow-500 dark:text-yellow-400"
                )}>
                {column.reserveSuit.type === "JOKER" ? "J" : "7"}
              </span>

              {/* Enseigne pour le 7 */}
              {column.reserveSuit.value === "7" && (
                <span
                  className={cn(
                    "text-sm",
                    column.reserveSuit.color === "red" ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  )}>
                  {column.reserveSuit.suit === "HEARTS" && "♥️"}
                  {column.reserveSuit.suit === "DIAMONDS" && "♦️"}
                  {column.reserveSuit.suit === "CLUBS" && "♣️"}
                  {column.reserveSuit.suit === "SPADES" && "♠️"}
                </span>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-1">
              {(column.reserveSuit?.type === "JOKER" || column.reserveSuit?.value === "7") && column.cards[5] ? (
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
    // Adapter la valeur pour la recherche réelle dans les données
    let searchValue = value;
    if (value === "As") searchValue = "A";
    if (value === "R") searchValue = "REVOLUTION"; // À adapter selon la logique de révolution
    let displayValue = value; // On utilise directement la valeur d'affichage

    var cardInSlot = column.cards.find((card) => card.value === searchValue);

    const currentIndex = 10 - index;

    if (column.cards.length > currentIndex)
      var isJokerInSlot = column.cards[currentIndex].value === "JOKER" ? column.cards[currentIndex] : undefined;

    if (!cardInSlot && isJokerInSlot) cardInSlot = isJokerInSlot;

    const isAs = value === "As";
    const isRevolution = value === "0";

    // Pour l'affichage de la révolution, on peut mettre un style spécial
    if (isRevolution) {
      return (
        <div key={value}>
          <div
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900",
              "text-yellow-700 dark:text-yellow-200 font-bold text-base"
            )}
            title="Révolution"
          >
            R
          </div>
        </div>
      );
    }

    const attackCard = column.cards.find((card) => card.value === searchValue);
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
                {displayValue}
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
                {displayValue}
              </span>
            </>
          )}
          {/* Afficher l'épée d'attaque pour les unités normales */}
          {attackCard && <CardAttackButton attackCard={attackCard} />}
          {isJokerInSlot && <Joystick className={cn("w-5 h-5 pl-50 absolute right-[25%]", "text-red-700  ")} />}
        </div>
      </div>
    );
  };

  const handleClick = () => {
    if (isActive) {
      onCardPlace();
    }
  };

  const getColor = (card?: Card) => {
    var color = "black";
    if (card?.suit === "DIAMONDS" || card?.suit === "HEARTS") color = "red";

    return color;
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
          {column.cards.length >= 7 && phase === "PLAY" && !hasPlayedAction && <BlockButton suit={suit} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{column.cards.length}/10</span>
        </div>
      </div>

      {/* Zone des emplacements de cartes */}
      <div className="px-4 py-2 space-y-[6px]">
        {["As", "2", "3", "4", "5", "6", "7", "8", "9", "10", "R"].map((value, index) => renderCardInSlot(value, index))}
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
                  getColor(column.faceCards?.J) === "red" ? "text-red-500" : "text-gray-500 dark:text-[#404859]"
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
                getColor(column.faceCards?.K) === "red" ? "text-red-500" : "text-gray-500 dark:text-[#404859]"
              )}>
              {column.faceCards?.K ? "K" : "Roi"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
