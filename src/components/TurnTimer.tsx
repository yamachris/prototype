import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTurnTimer } from '../hooks/useTurnTimer';
import { useTranslation } from 'react-i18next';

// Composant Popup pour les notifications de timeout
const TimeoutPopup = ({ 
  show, 
  message, 
  onClose 
}: { 
  show: boolean; 
  message: string; 
  onClose: () => void 
}) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-xl font-bold">Temps écoulé!</h3>
        </div>
        <p className="mb-4">{message}</p>
        <button 
          onClick={onClose} 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg w-full"
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

// Composant Popup pour les tours rapides
const SpeedTurnPopup = ({ 
  show, 
  onClose 
}: { 
  show: boolean; 
  onClose: () => void 
}) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-yellow-600 mr-2" />
          <h3 className="text-xl font-bold">Tour rapide!</h3>
        </div>
        <p className="mb-4">
          Vous n'avez que 15 secondes pour jouer/réagir.
        </p>
        <button 
          onClick={onClose} 
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg w-full"
        >
          Compris
        </button>
      </div>
    </div>
  );
};

// Composant principal du Timer de tour
export function TurnTimer() {
  const { t } = useTranslation();
  const { 
    timeLeft, 
    isWarning, 
    consecutiveTimeouts,
    showTimeoutPopup,
    showSpeedTurnPopup,
    closeTimeoutPopup,
    closeSpeedTurnPopup,
    timerClasses
  } = useTurnTimer();

  // Calcul du pourcentage pour l'animation circulaire
  const timerPercentage = (timeLeft / 30) * 100;
  
  // Message pour le popup de timeout
  const getTimeoutMessage = () => {
    if (consecutiveTimeouts >= 3) {
      return t("game.timeout.thirdTimeout", "Trois tours sans action ! Vous perdez votre meilleure carte en réserve.");
    }
    return t("game.timeout.defaultTimeout", "Temps écoulé ! Une carte de votre main a été défaussée automatiquement.");
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 flex flex-col items-end space-y-2">
        {/* Chronomètre circulaire */}
        <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-gray-200">
          {/* Cercle de fond */}
          <div className="absolute inset-1 rounded-full bg-gray-100"></div>
          
          {/* Cercle de progression */}
          <svg className="absolute inset-1" viewBox="0 0 36 36">
            <path
              className={`stroke-current ${isWarning ? 'text-red-500' : 'text-blue-500'}`}
              fill="none"
              strokeWidth="3"
              strokeDasharray="100"
              strokeDashoffset={100 - timerPercentage}
              strokeLinecap="round"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          
          {/* Affichage du temps avec clignotement intense quand < 5s */}
          <span className={`${timerClasses} text-2xl font-mono font-extrabold z-10 ${timeLeft <= 5 ? 'animate-pulse text-red-700 scale-125 shadow-lg shadow-red-500' : ''}`}>
            {timeLeft}
          </span>
        </div>

        {/* Indicateur de timeouts consécutifs */}
        {consecutiveTimeouts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {consecutiveTimeouts === 1 
                ? t("game.timeout.warning.one", "Attention : 1 timeout")
                : t("game.timeout.warning.multiple", "Attention : {{count}} timeouts consécutifs", { count: consecutiveTimeouts })}
              {consecutiveTimeouts === 2 && 
                t("game.timeout.warning.nextWarning", " - Prochain timeout : perte d'une carte de réserve !")}
            </span>
          </div>
        )}
      </div>
      
      {/* Popup de timeout */}
      <TimeoutPopup 
        show={showTimeoutPopup} 
        message={getTimeoutMessage()} 
        onClose={closeTimeoutPopup} 
      />
      
      {/* Popup de tour rapide */}
      <SpeedTurnPopup 
        show={showSpeedTurnPopup} 
        onClose={closeSpeedTurnPopup} 
      />
    </>
  );
}