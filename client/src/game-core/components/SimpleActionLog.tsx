'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

// Composant principal qui sera exporté
export function SimpleActionLog() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <ActionIcon />;
}

// Composant interne pour l'icône d'action
function ActionIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 800, y: 400 });
  const [lastAction, setLastAction] = useState('');
  const dragRef = useRef<{ isDragging: boolean, startX: number, startY: number }>({ isDragging: false, startX: 0, startY: 0 });
  const { message } = useGameStore();

  // Suivre le dernier message
  useEffect(() => {
    if (message && message.trim() !== '') {
      setLastAction(message);
    }
  }, [message]);

  // Position initiale
  useEffect(() => {
    // Sécurité pour le rendu côté client
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
    setPosition({ x: width - 80, y: 400 });
  }, []);

  // Gestion du double-clic séparée
  const handleDoubleClick = () => {
    setIsOpen(!isOpen);
  };

  // Variables pour suivre les clics
  const clickRef = useRef({
    clickCount: 0,
    lastClickTime: 0,
    timeout: null as ReturnType<typeof setTimeout> | null
  });
  
  // Gestion du drag-and-drop avec prise en charge du double-clic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Gérer la détection du double-clic manuellement
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - clickRef.current.lastClickTime;
    
    if (timeSinceLastClick < 300) { // Double-clic détecté
      clickRef.current.clickCount = 0;
      clickRef.current.lastClickTime = 0;
      if (clickRef.current.timeout) {
        clearTimeout(clickRef.current.timeout);
        clickRef.current.timeout = null;
      }
      // Exécuter l'action de double-clic
      handleDoubleClick();
      return; // Ne pas démarrer le drag
    }
    
    // Premier clic
    clickRef.current.clickCount += 1;
    clickRef.current.lastClickTime = currentTime;
    
    // Configurer le drag après un court délai pour permettre un double-clic
    clickRef.current.timeout = setTimeout(() => {
      // Configurer le drag seulement si ce n'est pas un double-clic
      dragRef.current = {
        isDragging: true,
        startX: e.clientX - position.x,
        startY: e.clientY - position.y
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, 10);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Nettoyage des écouteurs d'événements
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (clickRef.current.timeout) {
        clearTimeout(clickRef.current.timeout);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Dernière action (visible uniquement si le chat est ouvert) */}
      {isOpen && lastAction && (
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            maxWidth: '250px',
            marginBottom: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {lastAction}
        </div>
      )}
      
      {/* Icône de chat */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: '#1e40af',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'grab',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '24px',
          userSelect: 'none'
        }}
      >
        💬
      </div>
    </div>
  );
}
