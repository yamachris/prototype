import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const joinGame = (gameId: string) => {
    socket.current?.emit('joinGame', { gameId });
  };

  const playCard = (gameId: string, cardId: string, position: number) => {
    socket.current?.emit('playCard', { gameId, cardId, position });
  };

  const drawCard = (gameId: string) => {
    socket.current?.emit('drawCard', { gameId });
  };

  const endTurn = (gameId: string) => {
    socket.current?.emit('endTurn', { gameId });
  };

  const onPlayerJoined = (callback: (data: { playerId: string; gameId: string }) => void) => {
    socket.current?.on('playerJoined', callback);
  };

  const onCardPlayed = (callback: (data: { playerId: string; cardId: string; position: number }) => void) => {
    socket.current?.on('cardPlayed', callback);
  };

  const onCardDrawn = (callback: (data: { playerId: string }) => void) => {
    socket.current?.on('cardDrawn', callback);
  };

  const onTurnEnded = (callback: (data: { playerId: string }) => void) => {
    socket.current?.on('turnEnded', callback);
  };

  return {
    socket: socket.current,
    joinGame,
    playCard,
    drawCard,
    endTurn,
    onPlayerJoined,
    onCardPlayed,
    onCardDrawn,
    onTurnEnded,
  };
};
