import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface GameEvent {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'action' | 'warning' | 'success';
}

interface GameEventLogProps {
  className?: string;
}

export const GameEventLog: React.FC<GameEventLogProps> = ({ className }) => {
  // État local
  const [isOpen, setIsOpen] = useState(true); // Ouvert par défaut
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Position initiale
  const [isMounted, setIsMounted] = useState(false); // Pour éviter les erreurs de rendu côté serveur
  
  // Attendre que le composant soit monté (côté client uniquement)
  useEffect(() => {
    setIsMounted(true);
    // Positionner en haut à droite de l'écran
    setPosition({ x: window.innerWidth - 320, y: 20 });
    
    // Ajouter un événement initial après une seconde
    setTimeout(() => {
      addEvent('Bienvenue dans le journal de partie ! Double-cliquez pour réduire ou agrandir.', 'success');
      addEvent('Vous pouvez faire glisser cette fenêtre où vous voulez.', 'info');
    }, 1000);
  }, []);
  
  const [events, setEvents] = useState<GameEvent[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Accès au state du jeu
  const { message, phase, turn, currentPlayer } = useGameStore();

  // Fonction pour ajouter un événement
  const addEvent = (message: string, type: GameEvent['type'] = 'info') => {
    const newEvent: GameEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date(),
      type
    };
    
    setEvents(prev => {
      // Garder uniquement les 100 derniers événements pour éviter que la liste ne devienne trop longue
      const updatedEvents = [newEvent, ...prev];
      if (updatedEvents.length > 100) {
        return updatedEvents.slice(0, 100);
      }
      return updatedEvents;
    });
  };

  // Écouter les changements du jeu pour ajouter des événements
  useEffect(() => {
    // Si le message du jeu change, l'ajouter au log
    if (message && message.trim() !== '') {
      addEvent(message, 'action');
    }
  }, [message]);

  // Ajouter des événements pour les changements de phase
  useEffect(() => {
    if (phase) {
      let phaseMessage = '';
      switch (phase) {
        case 'SETUP':
          phaseMessage = 'Préparation de la partie';
          break;
        case 'DISCARD':
          phaseMessage = `Tour ${turn} : Phase de défausse`;
          break;
        case 'DRAW':
          phaseMessage = `Tour ${turn} : Phase de pioche`;
          break;
        case 'PLAY':
          phaseMessage = `Tour ${turn} : Phase de jeu`;
          break;
        case 'END':
          phaseMessage = 'Fin de la partie';
          break;
      }
      
      if (phaseMessage) {
        addEvent(phaseMessage, 'info');
      }
    }
  }, [phase, turn]);

  // Faire défiler automatiquement vers le bas lorsqu'un nouveau message est ajouté
  useEffect(() => {
    if (logContainerRef.current && isOpen) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [events, isOpen]);

  // Gérer le double-clic pour ouvrir/fermer
  const handleDoubleClick = () => {
    setIsOpen(!isOpen);
  };

  // Rendu des événements
  const renderEvents = () => {
    return events.map(event => (
      <div 
        key={event.id}
        className={`p-1 text-xs border-b border-gray-200 dark:border-gray-700 
          ${event.type === 'action' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
          ${event.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}
          ${event.type === 'success' ? 'bg-green-50 dark:bg-green-900/30' : ''}
        `}
      >
        <span className="text-gray-500 dark:text-gray-400 text-[10px] mr-1">
          {event.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
        </span>
        <span>{event.message}</span>
      </div>
    ));
  };

  if (!isMounted) {
    return null; // Ne rien rendre côté serveur
  }
  
  // Utiliser createPortal pour rendre le composant directement dans le body
  return createPortal(
    <motion.div
      className={`fixed shadow-lg rounded-md bg-white dark:bg-gray-800 z-50 border-2 border-blue-500 ${className}`}
      initial={{ opacity: 0.9 }}
      animate={{ 
        opacity: isDragging ? 1 : 0.9,
        x: position.x, 
        y: position.y,
        width: isOpen ? 300 : 60,
        height: isOpen ? 300 : 60,
      }}
      transition={{ duration: 0.2 }}
      drag
      dragConstraints={{ left: 0, right: 800, top: 0, bottom: 600 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setPosition(prev => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y
        }));
        setIsDragging(false);
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isOpen ? (
        <>
          <div className="p-2 flex justify-between items-center border-b dark:border-gray-700">
            <div className="text-sm font-medium">Journal de partie</div>
            <div className="text-xs text-gray-500">Double-clic pour fermer</div>
          </div>
          <div 
            ref={logContainerRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ height: 'calc(100% - 36px)' }}
          >
            {events.length > 0 ? renderEvents() : (
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
                Les événements du jeu apparaîtront ici.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="h-full w-full flex items-center justify-center cursor-pointer">
          <span className="text-xl">📜</span>
        </div>
      )}
    </motion.div>
  , document.body);
};
