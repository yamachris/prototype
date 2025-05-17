'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export default function DraggableActionIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 800, y: 400 });
  const [lastMessage, setLastMessage] = useState('Double-cliquez pour afficher/masquer');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const iconRef = useRef(null);
  
  const { message } = useGameStore();

  // Initialiser la position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 100,
        y: window.innerHeight - 200,
      });
    }
  }, []);

  // Capturer le dernier message
  useEffect(() => {
    if (message && message.trim() !== '') {
      setLastMessage(message);
      // Auto-ouvrir quand un nouveau message arrive
      setIsOpen(true);
    }
  }, [message]);

  // Gestionnaire de mousedown - début du drag
  const handleMouseDown = (e) => {
    // Si c'est un clic droit, ignorer
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Enregistrer la position initiale du curseur par rapport à l'icône
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    
    // Ajouter les écouteurs d'événements pour le déplacement
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Gestionnaire de mousemove - pendant le drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculer la nouvelle position en tenant compte du décalage initial
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  // Gestionnaire de mouseup - fin du drag
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Vérifier si c'est un clic (pas un drag) en fonction de la distance parcourue
    const wasClick = Math.abs(e.clientX - (position.x + dragStartRef.current.x)) < 5 &&
                     Math.abs(e.clientY - (position.y + dragStartRef.current.y)) < 5;
    
    // Si c'était un clic et non un drag, basculer l'état d'ouverture
    if (wasClick) {
      setIsOpen(!isOpen);
    }
    
    // Supprimer les écouteurs d'événements
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Nettoyer les écouteurs d'événements à la démontage
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Bulle de message */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            left: `${position.x - 200}px`, 
            top: `${position.y}px`,
            backgroundColor: 'rgba(30, 64, 175, 0.9)',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '10px',
            maxWidth: '250px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 1000,
            fontSize: '14px',
            transition: 'all 0.2s',
            opacity: isOpen ? 1 : 0
          }}
        >
          {lastMessage}
        </div>
      )}
      
      {/* Icône */}
      <div 
        ref={iconRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: `${position.x}px`, 
          top: `${position.y}px`,
          backgroundColor: '#1e40af',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1001,
          transition: isDragging ? 'none' : 'all 0.2s',
          border: '2px solid white'
        }}
      >
        💬
      </div>
    </>
  );
}
