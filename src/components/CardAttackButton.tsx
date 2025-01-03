import React, { useState, useEffect } from "react";
import { Card } from "../types/game";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Swords } from "lucide-react";
import { cn } from "../utils/cn";
import { useGameStore } from "../store/gameStore";

interface CardAttackButtonProps {
  attackCard: Card;
}

export function CardAttackButton({ attackCard }: CardAttackButtonProps) {
  const { t } = useTranslation();
  const { currentPlayer, phase, hasPlayedAction, columns, turn, handleAttack, activateCardAttackButton } =
    useGameStore();

  const column = columns[attackCard.suit];
  const attackStatus = column.attackStatus;
  let attackButtons = attackStatus.attackButtons;

  const isAttackButtonActive = attackButtons.find((button) => button.id === attackCard.value)?.active;
  const lastAttackTurn = attackStatus.lastAttackCard?.turn;

  const [localState, setLocalState] = useState({ currentTurn: turn, canAttackNow: false });
  const [hasDoneOnce, setHasDoneOnce] = useState(false);

  const valet = column?.faceCards?.J;

  // console.log(column);

  useEffect(() => {
    console.log("---------isAttackButtonActive ", isAttackButtonActive);

    if (attackCard.value == "J") {
      if (valet?.activatedBy == "sacrifice" || valet?.activatedBy == "joker") {
        if (!localState.canAttackNow) {
          setLocalState({ ...localState, currentTurn: turn, canAttackNow: true });
          return;
        } else setHasDoneOnce(true);
      }

      if (!isAttackButtonActive && lastAttackTurn + 2 == turn) {
        activateCardAttackButton(attackCard);
      }
    }

    if (localState.currentTurn != turn) {
      setLocalState({ ...localState, currentTurn: turn, canAttackNow: true });
    }
  }, [turn]);

  const handleAttackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("handleAttackClick ", attackButtons);

    handleAttack(attackCard);
  };

  var isEnabled = phase == "action" && !hasPlayedAction;

  if (!hasDoneOnce && attackCard.value == "J") {
    if (valet?.activatedBy == "sacrifice" || valet?.activatedBy == "joker") {
      isEnabled = true;
    }
  }

  const iconClass = cn(
    "w-5 h-5 pl-50 absolute right-[25%]",
    isEnabled ? "text-red-700 animate-pulse transition-opacity duration-1000" : "text-gray-700"
  );

  if (isAttackButtonActive && localState.canAttackNow)
    return <Swords onClick={handleAttackClick} className={iconClass} />;
}
