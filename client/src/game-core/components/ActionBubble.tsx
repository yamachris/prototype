'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Style pour l'icône et le contenu
const styles = {
  container: {
    position: 'fixed' as const,
    right: '20px',
    bottom: '100px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  bubble: {
    backgroundColor: '#1e40af',
    color: 'white',
    borderRadius: '8px',
    padding: '10px 15px',
    marginRight: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    maxWidth: '250px',
    pointerEvents: 'none',
  },
  icon: {
    backgroundColor: '#1e40af',
    color: 'white',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    border: '2px solid white',
    pointerEvents: 'auto' as const,
    userSelect: 'none' as const,
  },
};

export default function ActionBubble() {
  const [lastMessage, setLastMessage] = useState('');
  const [visible, setVisible] = useState(false);
  
  const { message } = useGameStore();
  
  // Capturer les messages
  useEffect(() => {
    if (message && message.trim()) {
      setLastMessage(message);
      setVisible(true);
      
      // Cacher après 5 secondes
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Toggle la visibilité au clic
  const handleClick = () => {
    setVisible(!visible);
  };
  
  return (
    <div style={styles.container}>
      {visible && lastMessage && (
        <div style={styles.bubble}>
          {lastMessage}
        </div>
      )}
      
      <div 
        style={styles.icon}
        onClick={handleClick}
      >
        💬
      </div>
    </div>
  );
}
