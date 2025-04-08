import { useState, useEffect } from "react";
import { Card, Phase, Player } from "../types/game";
import { drawCards } from "../utils/deck";

export function useGameTurn() {
  const [phase, setPhase] = useState<Phase>("DISCARD");
  const [timeLeft, setTimeLeft] = useState(30);
  const [turn, setTurn] = useState(1);

  useEffect(() => {
    if (phase === "setup") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handlePassPhase();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const handleDiscard = (player: Player, card: Card, deck: Card[]) => {
    if (phase !== "DISCARD") return null;

    const [newDeck, [drawnCard]] = drawCards(deck, 1);

    return {
      updatedPlayer: {
        ...player,
        hand: [...player.hand.filter((c) => c.id !== card.id), drawnCard],
        discardPile: [...player.discardPile, card],
      },
      newDeck,
    };
  };

  const handlePassPhase = () => {
    setPhase((prev) => {
      switch (prev) {
        case "DISCARD":
          return "DISCARD";
        case "DRAW":
          return "PLAY";
        case "PLAY":
          return "DISCARD";
        default:
          return prev;
      }
    });
    setTimeLeft(30);
  };

  const handlePassTurn = () => {
    setTurn((prev) => prev + 1);
    setPhase("DISCARD");
    setTimeLeft(30);
  };

  return {
    phase,
    timeLeft,
    turn,
    handleDiscard,
    handlePassPhase,
    handlePassTurn,
  };
}
