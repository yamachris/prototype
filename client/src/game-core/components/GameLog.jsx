import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import './GameLogStyle.css';

export default function GameLog() {
  // Référence du journal pour le drag and drop
  const logRef = useRef(null);
  const headerRef = useRef(null);
  
  // État local pour la position et l'ouverture
  const [position, setPosition] = useState({ x: 20, y: 150 });
  const [isOpen, setIsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newMessage, setNewMessage] = useState(false);
  
  // Message store local pour le développement
  const [localMessages, setLocalMessages] = useState([
    { type: 'system', text: 'Bienvenue dans le jeu UNIT!', timestamp: Date.now() - 5000 },
    { type: 'phase', text: 'Phase de défausse: choisissez une carte à défausser', timestamp: Date.now() - 4000 },
    { type: 'action', text: 'Vous avez défaussé un 5 de cœur', timestamp: Date.now() - 3000 },
    { type: 'opponent', text: 'Votre adversaire a joué un Valet de carreau', timestamp: Date.now() - 2000 },
    { type: 'action', text: 'Vous avez pioché une carte', timestamp: Date.now() - 1000 },
    { type: 'phase', text: 'Phase d\'action: jouez vos cartes', timestamp: Date.now() }
  ]);
  
  // Fonction pour ajouter de nouveaux messages
  const addMessage = (type, text) => {
    setLocalMessages(prevMessages => [...prevMessages, {
      type,
      text,
      timestamp: Date.now()
    }]);
  };
  
  // Simuler l'ajout d'un message toutes les 15 secondes pour tester
  useEffect(() => {
    const messageTypes = ['system', 'phase', 'action', 'opponent'];
    const messages = [
      'Vous avez joué un 8 de pique',
      'Votre adversaire a défaussé une carte',
      'Phase de pioche: piochez une carte',
      'Vous avez gagné 3 points',
      'Votre adversaire a joué une Dame de cœur',
      'Un Joker a été révélé',
      'Votre main a été mélangée',
      'Fin du tour'  
    ];
    
    const interval = setInterval(() => {
      const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      addMessage(randomType, randomMessage);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Utiliser les messages locaux au lieu des messages du store
  const messages = localMessages;

  // Surveiller les nouveaux messages
  useEffect(() => {
    if (messages && messages.length > 0 && !isOpen) {
      setNewMessage(true);
      // Masquer l'indicateur après quelques secondes
      const timer = setTimeout(() => setNewMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  // Référence au conteneur de messages pour le défilement automatique
  const messagesContainerRef = useRef(null);

  // Défilement automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesContainerRef.current && isOpen) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Gestion du Drag and Drop
  const handleMouseDown = (e) => {
    if (headerRef.current && headerRef.current.contains(e.target)) {
      setIsDragging(true);
      const rect = logRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && logRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - logRef.current.offsetWidth, newX)),
          y: Math.max(0, Math.min(window.innerHeight - logRef.current.offsetHeight, newY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Ouverture/fermeture du journal
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setNewMessage(false);
  };

  // Déterminer la classe de message en fonction du type
  const getMessageClass = (type) => {
    switch (type) {
      case 'opponent':
        return 'game-log-opponent';
      case 'action':
        return 'game-log-action';
      case 'phase':
        return 'game-log-phase';
      case 'system':
      default:
        return 'game-log-system';
    }
  };

  // Icône spécifique au type de message
  const getMessageIcon = (type) => {
    switch (type) {
      case 'opponent':
        return '🔎 '; // Loupe (cartes adverses vues)
      case 'action':
        return '⚔️ '; // Épées (action)
      case 'phase':
        return '🕒 '; // Horloge (phase de jeu)
      case 'system':
      default:
        return '📢 '; // Annonce (système)
    }
  };

  // Format de l'horodatage
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <>
      {/* Icône du journal (visible quand minimisé) */}
      {!isOpen && (
        <div 
          className={`game-log-icon ${newMessage ? 'pulsing-icon' : ''}`}
          style={{
            left: `${position.x}px`, 
            top: `${position.y}px`,
          }}
          onClick={toggleOpen}
        >
          📜
        </div>
      )}

      {/* Journal de jeu */}
      {isOpen && (
        <div 
          ref={logRef}
          className="game-log-container"
          style={{
            left: `${position.x}px`, 
            top: `${position.y}px`,
          }}
        >
          {/* En-tête du journal */}
          <div 
            ref={headerRef}
            className="game-log-header"
            onMouseDown={handleMouseDown}
            onDoubleClick={toggleOpen}
          >
            <span>Journal de partie</span>
            <span 
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={toggleOpen}
            >
              Double-clic pour minimiser
            </span>
          </div>

          {/* Corps du journal avec les messages */}
          <div 
            ref={messagesContainerRef}
            className="game-log-body"
          >
            {messages && messages.length > 0 ? messages.map((msg, index) => {
              const messageTypeClass = getMessageClass(msg.type);
              const messageIcon = getMessageIcon(msg.type);
              
              return (
                <div 
                  key={index} 
                  className={`game-log-message ${messageTypeClass} ${index === messages.length - 1 ? 'new-message' : ''}`}
                >
                  <small style={{ opacity: 0.7 }}>{formatTime(msg.timestamp)}</small>
                  <div>
                    <span>{messageIcon}</span>
                    {msg.text}
                  </div>
                </div>
              );
            }) : <div className="game-log-message game-log-system">Aucun message pour le moment</div>}
          </div>
        </div>
      )}
    </>
  );
}
