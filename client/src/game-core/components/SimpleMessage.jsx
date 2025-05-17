'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function SimpleMessage() {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const gameState = useGameStore();
  
  // Écouter les changements de message
  useEffect(() => {
    if (gameState.message && gameState.message.trim() !== '') {
      setMessage(gameState.message);
      setShow(true);
    }
  }, [gameState.message]);
  
  // Style inline pour éviter les problèmes
  const containerStyle = {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center'
  };
  
  const messageStyle = {
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    maxWidth: '200px',
    marginRight: '10px',
    display: show ? 'block' : 'none'
  };
  
  const buttonStyle = {
    width: '50px',
    height: '50px',
    backgroundColor: '#1e40af',
    color: 'white',
    border: '2px solid white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '24px'
  };
  
  return (
    <div style={containerStyle}>
      <div style={messageStyle}>
        {message}
      </div>
      <div 
        style={buttonStyle}
        onClick={() => setShow(!show)}
      >
        💬
      </div>
    </div>
  );
}
