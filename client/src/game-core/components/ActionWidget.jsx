'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export default function ActionWidget() {
  const [position, setPosition] = useState({ x: 800, y: 300 });
  const [isVisible, setIsVisible] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  
  const { message } = useGameStore();
  
  // Initialisation de la position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 100, y: 300 });
    }
  }, []);
  
  // Surveiller les nouveaux messages
  useEffect(() => {
    if (message && message.trim()) {
      setLastMessage(message);
      setIsVisible(true);
    }
  }, [message]);
  
  // Gérer le début du déplacement
  const handleMouseDown = (e) => {
    setIsDragging(true);
    startPos.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Gérer le déplacement
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.current.x,
        y: e.clientY - startPos.current.y
      });
    }
  };
  
  // Gérer la fin du déplacement
  const handleMouseUp = () => {
    setIsDragging(false);
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
  const handleClick = () => {
    setIsVisible(!isVisible);
  };
  
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      <div style={{ 
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        {isVisible && (
          <div style={{
            backgroundColor: 'rgba(30, 64, 175, 0.95)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            marginRight: '10px',
            maxWidth: '250px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}>
            {lastMessage || 'Dernière action'}
          </div>
        )}
        
        <div
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#1e40af',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            border: '2px solid white',
            fontSize: '24px',
            pointerEvents: 'auto'
          }}
        >
          💬
        </div>
      </div>
    </div>
  );
}
