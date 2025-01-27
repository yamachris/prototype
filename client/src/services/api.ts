import axios from 'axios';
import { Card, Suit, GameState } from '../game-core/types/game';

const API_URL = 'http://localhost:3007';

export const gameApi = {
  createGame: async (): Promise<string> => {
    const response = await axios.post(`${API_URL}/game/create`);
    return response.data.gameId;
  },

  getGameState: async (gameId: string): Promise<GameState> => {
    const response = await axios.get(`${API_URL}/game/${gameId}`);
    return response.data;
  },

  placeCard: async (gameId: string, suit: Suit, position: number): Promise<GameState> => {
    const response = await axios.put(`${API_URL}/game/${gameId}/place-card`, {
      suit,
      position,
    });
    return response.data;
  },

  drawCard: async (gameId: string): Promise<GameState> => {
    const response = await axios.post(`${API_URL}/game/${gameId}/draw-card`);
    return response.data;
  },

  discard: async (gameId: string, cardId: string): Promise<GameState> => {
    const response = await axios.post(`${API_URL}/game/${gameId}/discard`, {
      cardId,
    });
    return response.data;
  },

  endTurn: async (gameId: string): Promise<GameState> => {
    const response = await axios.post(`${API_URL}/game/${gameId}/end-turn`);
    return response.data;
  },

  selectCard: async (gameId: string, cardId: string): Promise<GameState> => {
    const response = await axios.put(`${API_URL}/game/${gameId}/select-card`, {
      cardId,
    });
    return response.data;
  },
};
