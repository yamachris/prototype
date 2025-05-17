'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

// Version très simple et fiable de l'icône d'action
export default function ActionIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const { message } = useGameStore();

  // Capturer le dernier message
  useEffect(() => {
    if (message && message.trim() !== '') {
      setLastMessage(message);
    }
  }, [message]);

  // Style pour l'icône
  const iconStyle = {
    position: 'fixed',
    right: '20px',
    bottom: '150px',
    zIndex: 1000,
    backgroundColor: '#1e40af',
    color: 'white',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    fontSize: '24px'
  };

  // Style pour la bulle de message
  const messageStyle = {
    position: 'fixed',
    right: '80px',
    bottom: '150px',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    maxWidth: '250px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 1000
  };

  return (
    <>
      {isOpen && lastMessage && (
        <div style={messageStyle as React.CSSProperties}>
          {lastMessage}
        </div>
      )}
      
      <div 
        style={iconStyle as React.CSSProperties}
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </div>
    </>
  );
}
