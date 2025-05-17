import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useDarkMode } from '../hooks/useDarkMode';

// Styles pour le journal
const styles = {
  // Journal complet
  fullLog: {
    position: 'fixed',
    width: '300px',
    maxHeight: '400px',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    color: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  // Icône minimisée
  iconOnly: {
    position: 'fixed',
    width: '50px',
    height: '50px',
    backgroundColor: 'rgba(30, 64, 175, 0.95)',
    color: 'white',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid white',
    cursor: 'grab',
    fontSize: '24px'
  },
  
  // Header du journal
  header: {
    padding: '10px',
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    color: 'white',
    fontWeight: 'bold',
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab'
  },
  
  // Zone des messages
  messages: {
    padding: '10px',
    overflowY: 'auto',
    flexGrow: 1,
    maxHeight: '350px',
    backgroundColor: 'transparent'
  }
};

// Les styles sont maintenant dynamiques selon le thème

export default function GameLog() {
  // Intégration du mode jour/nuit
  const { isDark, setIsDark } = useDarkMode();
  
  // State local pour forcer le re-rendu quand le thème change ailleurs
  const [localIsDark, setLocalIsDark] = useState(isDark);
  
  // Détecter les changements de thème en temps réel par événement
  useEffect(() => {
    // Synchronisation initiale avec localStorage
    const storedTheme = localStorage.getItem("darkMode");
    const currentDarkMode = storedTheme ? JSON.parse(storedTheme) : false;
    if (currentDarkMode !== localIsDark) {
      setLocalIsDark(currentDarkMode);
    }
    
    // Écouter l'événement personnalisé de changement de thème
    const handleThemeChange = (event) => {
      setLocalIsDark(event.detail.isDark);
    };
    
    // Ajouter l'écouteur d'événement
    window.addEventListener('themeChange', handleThemeChange);
    
    // Nettoyage à la désinstallation
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);
  
  // Utiliser le thème local qui réagit aux changements
  
  // Utilisation du mode jour/nuit réel sans forçage
  
  // Ajustements de style en fonction du thème réel
  const themeStyles = localIsDark ? {
    // Mode nuit - inchangé comme demandé
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    color: 'white',
    border: '1px solid rgba(55, 65, 81, 0.2)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)'
  } : {
    // Mode jour - avec transparence pour ne pas trop cacher le plateau
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Blanc avec transparence
    color: '#000000', // Texte noir pur pour un contraste maximal
    border: '1px solid rgba(0, 0, 0, 0.7)', // Bordure noire semi-transparente
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' // Ombre plus légère
  };
  
  const [isOpen, setIsOpen] = useState(true);  // true = ouvert, false = minimisé en icône
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [logs, setLogs] = useState([
    { 
      id: 'init-1', 
      message: 'Bienvenue dans le jeu UNIT!', 
      timestamp: new Date().toLocaleTimeString(),
      type: 'system'
    }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newMessage, setNewMessage] = useState(false); // Indique s'il y a un nouveau message
  const [isClosing, setIsClosing] = useState(false); // Pour l'animation de fermeture
  
  // Référence pour le défilement automatique
  const messagesEndRef = useRef(null);
  
  // Récupérer les données du jeu depuis le store
  const gameMessage = useGameStore(state => state.message);
  const phase = useGameStore(state => state.phase);
  const turn = useGameStore(state => state.turn);
  const opponentHand = useGameStore(state => state.opponentHand);
  const opponentReserve = useGameStore(state => state.opponentReserve);

  // Suivre les cartes de l'adversaire pour le journal
  useEffect(() => {
    if (opponentHand && opponentHand.length > 0) {
      const cardCount = opponentHand.length;
      addLog(`Adversaire: ${cardCount} carte${cardCount > 1 ? 's' : ''} en main`, 'opponent');
    }
  }, [opponentHand]);
  
  // Suivre les cartes dans la réserve de l'adversaire
  useEffect(() => {
    if (opponentReserve && opponentReserve.length > 0) {
      const reserveCards = opponentReserve.length;
      addLog(`Adversaire a ${reserveCards} carte${reserveCards > 1 ? 's' : ''} en réserve`, 'opponent');
    }
  }, [opponentReserve]);
  
  // Ajouter les messages du jeu au log
  useEffect(() => {
    if (gameMessage && gameMessage.trim()) {
      addLog(gameMessage, 'action');
    }
  }, [gameMessage]);
  
  // Suivre les changements de phase
  useEffect(() => {
    if (phase) {
      let phaseMessage = '';
      switch (phase) {
        case 'SETUP': phaseMessage = 'Phase de préparation de la partie'; break;
        case 'DISCARD': phaseMessage = `Tour ${turn}: Phase de défausse`; break;
        case 'DRAW': phaseMessage = `Tour ${turn}: Phase de pioche`; break;
        case 'PLAY': phaseMessage = `Tour ${turn}: Phase de jeu`; break;
        case 'END': phaseMessage = 'Fin de la partie'; break;
      }
      
      if (phaseMessage) {
        addLog(phaseMessage, 'phase');
      }
    }
  }, [phase, turn]);

  // Fonction pour ajouter un log
  const addLog = (message, type = 'system') => {
    // Vérifier si le message est déjà le dernier message (pour éviter les doublons)
    const lastLog = logs[logs.length - 1];
    if (lastLog && lastLog.message === message) {
      return; // Éviter les doublons
    }
    
    const newLog = {
      id: `log-${Date.now()}`,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type // peut être: 'system', 'action', 'opponent', 'phase'
    };
    
    setLogs(prevLogs => {
      // Garder seulement les 30 derniers messages
      const updatedLogs = [...prevLogs, newLog];
      if (updatedLogs.length > 30) {
        return updatedLogs.slice(updatedLogs.length - 30);
      }
      return updatedLogs;
    });
    
    // Indiquer qu'il y a un nouveau message
    setNewMessage(true);
    
    // Faire clignoter l'icône si minimisé
    // et auto-ouvrir si c'est une info importante (carte adverse)
    if (!isOpen && type === 'opponent') {
      // Auto-ouvrir le journal pour les infos sur les cartes adverses
      setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }
  };
  
  // Pour suivre si la souris est enfoncée et les positions initiales
  const isMouseDown = useRef(false);
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialElementPos = useRef({ x: 0, y: 0 });
  
  // Gestionnaires d'événements simplifiés pour le déplacement
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Sauvegarder l'état actuel
    isMouseDown.current = true;
    initialMousePos.current = { x: e.clientX, y: e.clientY };
    initialElementPos.current = { x: position.x, y: position.y };
    
    // Le reste sera géré par les gestionnaires d'événements globaux
  };
  
  // Configurer les gestionnaires d'événements globaux
  useEffect(() => {
    // Gérer le mouvement de la souris
    const handleGlobalMouseMove = (e) => {
      if (isMouseDown.current) {
        // Calculer le déplacement
        const deltaX = e.clientX - initialMousePos.current.x;
        const deltaY = e.clientY - initialMousePos.current.y;
        
        // Appliquer le déplacement à la position originale
        setPosition({
          x: initialElementPos.current.x + deltaX,
          y: initialElementPos.current.y + deltaY
        });
      }
    };
    
    // Gérer le relâchement de la souris
    const handleGlobalMouseUp = () => {
      isMouseDown.current = false;
    };
    
    // Ajouter les gestionnaires
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Nettoyer
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []); // Ce useEffect ne dépend d'aucune variable, il est donc configuré une seule fois
  
  // Toggle l'ouverture du log avec une animation à la fermeture
  const toggleOpen = () => {
    if (isOpen) {
      // Animation de fermeture
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300); // Durée de l'animation de fermeture
    } else {
      // Ouverture immédiate
      setIsOpen(true);
      // Scroll au bas après un court délai pour permettre le rendu
      setTimeout(scrollToBottom, 50);
    }
  };

  // Défilement automatique vers le bas lorsqu'un nouveau message arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Appliquer le défilement automatique quand les logs changent
  useEffect(() => {
    if (isOpen && logs.length > 0) {
      scrollToBottom();
    }
  }, [logs, isOpen]);
  
  // Effect pour les animations de transition
  useEffect(() => {
    // Réinitialiser l'animation de message lorsqu'un nouveau message arrive
    if (newMessage && isOpen) {
      const timer = setTimeout(() => {
        setNewMessage(false);
      }, 2000); // Correspondant à la durée de l'animation highlightNew
      
      return () => clearTimeout(timer);
    }
  }, [newMessage, isOpen]);
  
  // Si on est en mode icône
  if (!isOpen) {
    return (
      <div 
        className={`game-log-icon ${newMessage ? 'pulsing-icon' : ''}`}
        style={{
          ...styles.iconOnly,
          backgroundColor: localIsDark ? 'rgba(30, 41, 59, 0.95)' : '#1e40af', // Identique à l'en-tête, bleu foncé solide 
          border: localIsDark ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid #ffffff', // Bordure blanche sur bleu
          boxShadow: localIsDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.5)', // Ombre forte
          left: `${position.x}px`, 
          top: `${position.y}px`,
        }}
        onClick={() => {
          toggleOpen();
          setNewMessage(false);
        }}
        onMouseDown={handleMouseDown}
      >
        📜
      </div>
    );
  }
  
  // Mode journal complet
  return (
    <div 
      className={`game-log ${isClosing ? 'game-log-closing' : ''}`}
      style={{
        ...styles.fullLog,
        ...themeStyles,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'scale(0.8) translateY(10px)' : 'scale(1) translateY(0)'
      }}
    >
      <div 
        className="game-log-header"
        style={{
          ...styles.header,
          backgroundColor: localIsDark ? 'rgba(30, 41, 59, 0.95)' : '#1e40af', // Bleu foncé solide sans transparence
          color: 'white', // Texte blanc pour les deux modes 
          fontWeight: 'bold',
          border: localIsDark ? 'none' : '1px solid #000000', // Bordure noire en mode jour
          boxShadow: localIsDark ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.3)' // Ombre en mode jour
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleOpen}
      >
        <div>Journal de partie</div>
        <div style={{ fontSize: '12px' }}>
          Double-clic pour minimiser
        </div>
      </div>
      
      <div style={styles.messages}>
        {logs.map((log, index) => {
          // Détermine si c'est le message le plus récent
          const isNewest = index === logs.length - 1;
          const animationDelay = `${index * 0.05}s`;
          
          // Styles des messages adaptés à l'interface sombre du jeu
          let messageTypeClass = '';
          let messageIcon = '';
          let messageStyle = {};
          
          switch(log.type) {
            case 'opponent':
              messageTypeClass = 'game-log-opponent';
              messageIcon = '🔎 '; // Loupe (cartes adverses vues)
              messageStyle = localIsDark ? {
                backgroundColor: 'rgba(30, 58, 138, 0.2)',
                borderLeft: '5px solid #3b82f6',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                fontWeight: '500',
                padding: '10px',
                margin: '6px 0'
              } : {
                backgroundColor: 'rgba(219, 234, 254, 0.9)', // Bleu clair avec légère transparence
                borderLeft: '4px solid #1e40af', // Bordure bleue foncée 
                color: '#000000', // Texte noir pour contraste maximal
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)', // Ombre légère
                fontWeight: '500', // Texte légèrement plus gras 
                padding: '8px 10px', // Espacement intérieur
                margin: '6px 0' // Espacement entre messages
              };
              break;
            case 'action':
              messageTypeClass = 'game-log-action';
              messageIcon = '⚔️ '; // Épées (action)
              messageStyle = localIsDark ? {
                backgroundColor: 'rgba(153, 27, 27, 0.2)',
                borderLeft: '5px solid #ef4444',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                fontWeight: '500',
                padding: '10px',
                margin: '6px 0'
              } : {
                backgroundColor: 'rgba(254, 226, 226, 0.9)', // Rouge clair avec légère transparence
                borderLeft: '4px solid #b91c1c', // Rouge foncé 
                color: '#000000', // Texte noir pour contraste maximal
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)', // Ombre légère
                fontWeight: '500', // Texte légèrement plus gras
                padding: '8px 10px', // Espacement intérieur
                margin: '6px 0' // Espacement entre messages
              };
              break;
            case 'phase':
              messageTypeClass = 'game-log-phase';
              messageIcon = '🕒 '; // Horloge (phase de jeu)
              messageStyle = localIsDark ? {
                backgroundColor: 'rgba(22, 101, 52, 0.2)',
                borderLeft: '5px solid #10b981',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                fontWeight: '500',
                padding: '10px',
                margin: '6px 0'
              } : {
                backgroundColor: 'rgba(209, 250, 229, 0.9)', // Vert clair avec légère transparence
                borderLeft: '4px solid #047857', // Vert foncé
                color: '#000000', // Texte noir pour contraste maximal
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)', // Ombre légère
                fontWeight: '500', // Texte légèrement plus gras
                padding: '8px 10px', // Espacement intérieur
                margin: '6px 0' // Espacement entre messages
              };
              break;
            case 'system':
            default:
              messageTypeClass = 'game-log-system';
              messageIcon = '📢 '; // Annonce (système)
              messageStyle = localIsDark ? {
                backgroundColor: 'rgba(91, 33, 182, 0.2)',
                borderLeft: '5px solid #8b5cf6',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                fontWeight: '500',
                padding: '10px',
                margin: '6px 0'
              } : {
                backgroundColor: 'rgba(243, 232, 255, 0.9)', // Violet clair avec légère transparence
                borderLeft: '4px solid #6d28d9', // Violet foncé
                color: '#000000', // Texte noir pour contraste maximal
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)', // Ombre légère
                fontWeight: '500', // Texte légèrement plus gras
                padding: '8px 10px', // Espacement intérieur
                margin: '6px 0' // Espacement entre messages
              };
          }
          
          return (
            <div 
              key={log.id} 
              className={`game-log-message ${messageTypeClass} ${isNewest ? 'game-log-message-new' : ''}`}
              style={{ ...messageStyle, animationDelay, padding: '8px', margin: '4px 0', borderRadius: '4px' }}
            >
              <span 
                className="game-log-timestamp"
                style={{ 
                  fontSize: '10px', 
                  color: isDark ? 'rgba(156, 163, 175, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                  display: 'block',
                  marginBottom: '3px'
                }}
              >
                {log.timestamp}
              </span>
              <div 
                className="game-log-content"
                style={{ 
                  fontWeight: isNewest ? 'bold' : 'normal',
                  color: isDark ? 'white' : '#1e293b'
                }}
              >
                {messageIcon}{log.message}
              </div>
            </div>
          );
        })}
        {/* Élément invisible pour le défilement automatique */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
