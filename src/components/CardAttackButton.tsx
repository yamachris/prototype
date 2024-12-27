import React, { useState, useEffect } from "react";
import { Card } from "../types/game";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Swords } from "lucide-react";
import { cn } from "../utils/cn";
import { useGameStore } from "../store/gameStore";

interface CardAttackButtonProps {
  attackCard: Card;
  currentPlayedCard: Card;
}

export function CardAttackButton({ attackCard, currentPlayedCard }: CardAttackButtonProps) {
  const { t } = useTranslation();
  const { currentPlayer, phase, hasPlayedAction, columns, turn, handleAttack } = useGameStore();

  const attackStatus = columns[currentPlayedCard.suit].attackStatus;
  let attackButtons = attackStatus.attackButtons;

  const isActive = attackButtons.find((button) => button.id === attackCard.value)?.active;

  const [localState, setLocalState] = useState({ currentTurn: turn, canAttackNow: false });

  console.log(attackButtons);

  useEffect(() => {
    if (localState.currentTurn != turn) {
      console.log("set currentTurn ");
      setLocalState({ currentTurn: turn, canAttackNow: true });
    }
  }, [turn]);

  const handleAttackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("handleAttackClick ", attackButtons);

    handleAttack(attackCard, attackButtons);
  };

  const isEnabled = phase == "action" && !hasPlayedAction;

  const iconClass = cn(
    "w-5 h-5 pl-50 absolute right-[25%]", 
    isEnabled ? "text-red-700 animate-pulse transition-opacity duration-1000" : "text-gray-700"
  );

  if (isActive && localState.canAttackNow) return <Swords onClick={handleAttackClick} className={iconClass} />;
}
