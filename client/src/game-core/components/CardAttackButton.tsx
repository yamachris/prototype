import React, { useState, useEffect } from "react";
import { Card } from "../types/game";
import { Swords } from "lucide-react";
import { cn } from "../utils/cn";
import { useGameStore } from "../store/gameStore";

interface CardAttackButtonProps {
  attackCard: Card;
}

export function CardAttackButton({ attackCard }: CardAttackButtonProps) {
  const { phase, hasPlayedAction, columns, turn, handleAttack, activateCardAttackButton } = useGameStore();

  const column = columns[attackCard.suit];
  const attackStatus = column.attackStatus;
  const attackButtons = attackStatus.attackButtons;

  const isAttackButtonActive = attackButtons.find((button) => button.id === attackCard.value)?.active;
  const jokerInsertedTurn = attackButtons.find((button) => button.id === attackCard.value)?.insertedTurn;

  const [localState, setLocalState] = useState({ currentTurn: turn, canAttackNow: false });

  const valet = column?.faceCards?.J;

  useEffect(() => {
    if (attackCard.value == "J") {
      if (valet?.activatedBy == "SACRIFICE" || valet?.activatedBy == "JOKER") {
        if (!localState.canAttackNow) {
          setLocalState({ ...localState, currentTurn: turn, canAttackNow: true });
          return;
        }
      }
    }

    if (localState.currentTurn != turn) {
      setLocalState({ ...localState, currentTurn: turn, canAttackNow: true });
    }
  }, [turn]);

  const handleAttackClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    handleAttack(attackCard);
  };

  var isEnabled = phase == "PLAY" && !hasPlayedAction;

  if (attackCard.value == "J" && jokerInsertedTurn == turn) {
    isEnabled = true;
  }

  const iconClass = cn(
    "w-5 h-5 pl-50 absolute right-[25%]",
    isEnabled ? "text-red-700 animate-pulse transition-opacity duration-1000" : "text-gray-700"
  );

  if (isAttackButtonActive) return <Swords onClick={handleAttackClick} className={iconClass} />;
}
