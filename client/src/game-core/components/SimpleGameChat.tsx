"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Composant interne (client-side uniquement)
const ChatComponent = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<string[]>([
    'Bienvenue dans le chat du jeu !',
    'Double-cliquez pour ouvrir/fermer cette fenêtre.',
    'Vous pouvez la déplacer où vous voulez.'
  ]);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Accès au state du jeu
  const { message, phase, turn } = useGameStore();

  // Écouter les changements du jeu pour ajouter des messages
  useEffect(() => {
    if (message && message.trim() !== '') {
      addMessage(message);
    }
  }, [message]);

  // Ajouter des événements pour les changements de phase
  useEffect(() => {
    if (phase) {
      let phaseMessage = '';
      switch (phase) {
        case 'SETUP':
          phaseMessage = 'Préparation de la partie';
          break;
        case 'DISCARD':
          phaseMessage = `Tour ${turn} : Phase de défausse`;
          break;
        case 'DRAW':
          phaseMessage = `Tour ${turn} : Phase de pioche`;
          break;
        case 'PLAY':
          phaseMessage = `Tour ${turn} : Phase de jeu`;
          break;
        case 'END':
          phaseMessage = 'Fin de la partie';
          break;
      }
      
      if (phaseMessage) {
        addMessage(phaseMessage);
      }
    }
  }, [phase, turn]);

  // Fonction pour ajouter un message
  const addMessage = (text: string) => {
    setMessages(prev => {
      // Garder uniquement les 30 derniers messages
      const newMessages = [...prev, text];
      if (newMessages.length > 30) {
        return newMessages.slice(newMessages.length - 30);
      }
      return newMessages;
    });
  };

  // Positionnement client-side uniquement
  useEffect(() => {
    // Positionner dans le coin droit
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 320, y: 100 });
    }
  }, []);

  // Gestion du double-clic
  const handleDoubleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <motion.div
      className="fixed shadow-xl rounded-lg bg-white dark:bg-gray-800 z-50 border-2 border-blue-500"
      style={{ opacity: isOpen ? 0.95 : 0.8 }}
      animate={{
        x: position.x,
        y: position.y,
        width: isOpen ? 300 : 60,
        height: isOpen ? 300 : 60
      }}
      transition={{ duration: 0.2 }}
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
      onDoubleClick={handleDoubleClick}
    >
      {isOpen ? (
        <>
          <div className="p-2 flex justify-between items-center border-b dark:border-gray-700 bg-blue-100 dark:bg-blue-900">
            <div className="text-sm font-medium">Chat du jeu</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Double-clic pour fermer</div>
          </div>
          <div 
            ref={chatRef}
            className="overflow-y-auto p-2"
            style={{ height: 'calc(100% - 36px)' }}
          >
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className="text-sm mb-2 pb-1 border-b border-gray-100 dark:border-gray-700"
              >
                {msg}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-full w-full flex items-center justify-center cursor-pointer">
          <span className="text-xl">💬</span>
        </div>
      )}
    </motion.div>
  );
};

// Exporter avec dynamic pour s'assurer qu'il est rendu côté client uniquement
export const SimpleGameChat = dynamic(
  () => Promise.resolve(ChatComponent),
  { ssr: false }
);
