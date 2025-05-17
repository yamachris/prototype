"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export function GameChat() {
  const [isOpen, setIsOpen] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<string[]>([
    'Bienvenue dans le chat du jeu!',
    'Double-cliquez sur cette boîte pour l\'ouvrir ou la fermer',
    'Vous pouvez faire glisser cette fenêtre où vous voulez'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { message, phase, turn } = useGameStore();
  
  // Ajouter les messages du jeu
  useEffect(() => {
    if (message && message.trim() !== '') {
      addMessage(message);
    }
  }, [message]);
  
  // Positionner dans le coin droit au premier rendu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 320, y: window.innerHeight - 400 });
    }
  }, []);
  
  // Défiler automatiquement vers le dernier message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Ajouter les changements de phase
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
  
  const addMessage = (text: string) => {
    setMessages(prev => {
      const newMessages = [...prev, text];
      if (newMessages.length > 20) {
        return newMessages.slice(newMessages.length - 20);
      }
      return newMessages;
    });
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <motion.div 
      className="fixed z-50"
      initial={{ opacity: 0.9 }}
      animate={{ 
        x: position.x, 
        y: position.y,
        opacity: isDragging ? 1 : 0.9 
      }}
      drag
      dragConstraints={{ left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 100 : 500, top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 500 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setPosition(prev => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y
        }));
        setIsDragging(false);
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 transition-all duration-300 ${isOpen ? 'w-72 h-60' : 'w-12 h-12'}`}
        onDoubleClick={toggleChat}
        style={{ cursor: 'grab' }}
      >
        {isOpen ? (
          <>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 flex justify-between items-center border-b">
              <span className="font-medium">Chat du jeu</span>
              <span className="text-xs text-gray-500">Double-clic pour fermer</span>
            </div>
            <div className="p-2 overflow-y-auto h-48" style={{ overscrollBehavior: 'contain' }}>
              {messages.map((msg, index) => (
                <div key={index} className="mb-2 text-sm border-b pb-1">
                  {msg}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-xl">💬</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
