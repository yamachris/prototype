'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export default function SimpleChatFix() {
  // États pour le chat
  const [lastMessage, setLastMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 800, y: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  
  // Référence au conteneur
  const containerRef = useRef(null);
  
  // Accéder au message depuis le store
  const message = useGameStore(state => state.message);
  
  // Initialiser la position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialX = window.innerWidth - 150;
      const initialY = 300;
      setPosition({ x: initialX, y: initialY });
    }
  }, []);
  
  // Mettre à jour le dernier message
  useEffect(() => {
    if (message && message.trim()) {
      setLastMessage(message);
      setIsVisible(true);
    }
  }, [message]);
  
  // Gérer le début du dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    
    // Ajouter les écouteurs globalement
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Gérer le mouvement pendant le dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;
    
    // Mettre à jour la position
    setPosition({ x: newX, y: newY });
  };
  
  // Gérer la fin du dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Retirer les écouteurs
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Nettoyer les écouteurs
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Toggle la visibilité
  const handleClick = (e) => {
    // Ne toggle que si ce n'est pas un drag
    if (!isDragging) {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'auto'
      }}
    >
      {isVisible && lastMessage && (
        <div
          style={{
            backgroundColor: '#1e40af',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            marginRight: '10px',
            maxWidth: '250px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
        >
          {lastMessage}
        </div>
      )}
      
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: '#1e40af',
          color: 'white',
          border: '2px solid white',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          fontSize: '24px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}
      >
        💬
      </div>
    </div>
  );
}
