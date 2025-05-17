'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

// Composant de chat très simplifié qui fonctionne côté client uniquement
const BasicGameChatInner = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<string[]>([
    'Bienvenue dans le chat du jeu!',
    'Double-cliquez pour ouvrir/fermer',
    'Cliquez et maintenez pour déplacer'
  ]);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, isDragging: false });
  
  const { message, phase, turn } = useGameStore();
  
  // Positionnement initial
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 320,
        y: window.innerHeight - 400
      });
    }
  }, []);
  
  // Écouter les messages du jeu
  useEffect(() => {
    if (message && message.trim() !== '') {
      addMessage(message);
    }
  }, [message]);
  
  // Écouter les changements de phase
  useEffect(() => {
    if (phase) {
      let phaseMessage = '';
      switch (phase) {
        case 'SETUP': phaseMessage = 'Préparation de la partie'; break;
        case 'DISCARD': phaseMessage = `Tour ${turn}: Phase de défausse`; break;
        case 'DRAW': phaseMessage = `Tour ${turn}: Phase de pioche`; break;
        case 'PLAY': phaseMessage = `Tour ${turn}: Phase de jeu`; break;
        case 'END': phaseMessage = 'Fin de la partie'; break;
      }
      
      if (phaseMessage) {
        addMessage(phaseMessage);
      }
    }
  }, [phase, turn]);
  
  // Défiler vers le dernier message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const addMessage = (text: string) => {
    setMessages(prev => {
      const newMessages = [...prev, text];
      if (newMessages.length > 30) {
        return newMessages.slice(newMessages.length - 30);
      }
      return newMessages;
    });
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Gestion manuelle du drag and drop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatRef.current) {
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
        isDragging: true
      };
      setIsDragging(true);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (dragStartRef.current.isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };
  
  const handleMouseUp = () => {
    dragStartRef.current.isDragging = false;
    setIsDragging(false);
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div 
      ref={chatRef}
      className="fixed z-50"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        opacity: isDragging ? 1 : 0.9,
        transition: isDragging ? 'none' : 'opacity 0.2s'
      }}
    >
      <div 
        className="shadow-xl rounded-lg overflow-hidden"
        style={{
          width: isOpen ? '300px' : '60px',
          height: isOpen ? '300px' : '60px',
          transition: 'width 0.3s, height 0.3s',
          background: 'white',
          border: '2px solid #3b82f6'
        }}
      >
        <div 
          className="bg-blue-100 dark:bg-blue-900 p-2 flex justify-between items-center cursor-grab"
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleChat}
        >
          <div className="font-medium select-none">Chat du jeu</div>
          {isOpen && <div className="text-xs text-gray-500">Double-clic pour fermer</div>}
        </div>
        
        {isOpen ? (
          <div 
            className="p-2 overflow-y-auto"
            style={{ height: 'calc(100% - 36px)', overscrollBehavior: 'contain' }}
          >
            {messages.map((msg, index) => (
              <div key={index} className="mb-2 pb-1 border-b text-sm">
                {msg}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-xl">💬</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper pour s'assurer que le composant est rendu côté client uniquement
export function BasicGameChat() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) return null;
  
  return <BasicGameChatInner />;
}
