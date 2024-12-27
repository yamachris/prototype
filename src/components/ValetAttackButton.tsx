import React from "react";
import { Card } from "../types/game";
import { useTranslation } from "react-i18next";
import { Swords } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { cn } from "../utils/cn";

// Props du composant : la carte Valet et l'enseigne de sa colonne
interface ValetAttackButtonProps {
  valetCard: Card;
  columnSuit: string;
}

/**
 * Composant représentant le bouton d'attaque du Valet.
 * Il est cliquable si le Valet est dans l'emplacement J de sa colonne et si on peut attaquer ce tour-ci.
 */
export function ValetAttackButton({ valetCard, columnSuit }: ValetAttackButtonProps) {
  const { t } = useTranslation();
  // Récupère les états nécessaires du store global
  const { phase, hasPlayedAction, columns, handleAttack } = useGameStore();

  /**
   * Vérifie si le Valet est bien placé dans l'emplacement J de sa colonne.
   * Cette vérification est nécessaire car le Valet peut être ailleurs (en main, etc.).
   */
  const isValetInFaceCards = () => {
    const column = columns[columnSuit];
    return column?.faceCards?.J?.id === valetCard.id;
  };

  /**
   * Gestionnaire de clic pour l'attaque.
   * Ne déclenche l'attaque que si le bouton est cliquable.
   */
  const handleAttackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAttack(valetCard);
  };

  const valet = columns[columnSuit]?.faceCards?.J;
  if (!valet) return null;

  // Vérifie si le Valet peut attaquer ce tour-ci
  const canAttackNow = phase === "action" && !hasPlayedAction && (
    // Peut attaquer immédiatement si activé avec JOKER ou sacrifice
    (valet.activatedBy === 'joker' || valet.activatedBy === 'sacrifice') ||
    // Peut attaquer si activé avec 7 et au tour suivant
    (valet.activatedBy === 'seven' && valet.canAttackNextTurn) ||
    // Peut attaquer si c'est son tour après une attaque
    (valet.hasAttacked && valet.canAttackNextTurn)
  );

  // L'épée est grisée uniquement si le Valet est joué avec un 7 et doit attendre
  const isGrayed = valet.activatedBy === 'seven' && !valet.canAttackNextTurn;

  const iconClass = cn(
    "w-5 h-5 pl-50",
    isGrayed
      ? "text-gray-400" // Grise uniquement si activé avec 7 et doit attendre
      : canAttackNow
        ? "text-yellow-500 animate-pulse" // Dorée et animée si peut attaquer
        : "text-yellow-500" // Dorée sinon
  );

  const getTitle = () => {
    if (valet.activatedBy === 'seven' && !valet.canAttackNextTurn) {
      return t("game.messages.valetWaitNextTurn");
    }
    if (valet.hasAttacked && !valet.canAttackNextTurn) {
      return t("game.messages.valetMustWait");
    }
    if (!canAttackNow) {
      return t("game.messages.valetCannotAttack");
    }
    return t("game.messages.valetCanAttack");
  };

  /**
   * N'affiche le bouton que si le Valet est dans l'emplacement J.
   * Sinon, on ne montre rien.
   */
  if (isValetInFaceCards()) {
    return (
      <button
        // Le onClick n'est défini que si le bouton est cliquable
        onClick={canAttackNow ? handleAttackClick : undefined}
        // Style du curseur : pointer si cliquable, not-allowed sinon
        className={cn(
          "focus:outline-none",
          canAttackNow ? "cursor-pointer" : "cursor-not-allowed"
        )}
        // Désactive le bouton si non cliquable
        disabled={!canAttackNow}
        // Message d'aide différent selon l'état
        title={getTitle()}
      >
        <Swords className={iconClass} />
      </button>
    );
  }

  // Si le Valet n'est pas dans l'emplacement J, on ne montre rien
  return null;
}
