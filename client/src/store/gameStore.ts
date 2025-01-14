import { create } from 'zustand';
import { Card } from '@/types/card';

interface GameState {
  phase: 'preparation' | 'play' | 'end';
  hand: Card[];
  reserve: Card[];
  selectedCards: Card[];
  isBlocked: boolean;
  setPhase: (phase: 'preparation' | 'play' | 'end') => void;
  addCardToHand: (card: Card) => void;
  addCardToReserve: (card: Card) => void;
  removeCardFromHand: (card: Card) => void;
  removeCardFromReserve: (card: Card) => void;
  selectCard: (card: Card) => void;
  unselectCard: (card: Card) => void;
  clearSelectedCards: () => void;
  setBlocked: (blocked: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'preparation',
  hand: [],
  reserve: [],
  selectedCards: [],
  isBlocked: false,

  setPhase: (phase) => set({ phase }),
  
  addCardToHand: (card) => 
    set((state) => ({ hand: [...state.hand, card] })),
  
  addCardToReserve: (card) =>
    set((state) => ({ reserve: [...state.reserve, card] })),
  
  removeCardFromHand: (card) =>
    set((state) => ({
      hand: state.hand.filter((c) => c.id !== card.id)
    })),
  
  removeCardFromReserve: (card) =>
    set((state) => ({
      reserve: state.reserve.filter((c) => c.id !== card.id)
    })),
  
  selectCard: (card) =>
    set((state) => ({
      selectedCards: [...state.selectedCards, card]
    })),
  
  unselectCard: (card) =>
    set((state) => ({
      selectedCards: state.selectedCards.filter((c) => c.id !== card.id)
    })),
  
  clearSelectedCards: () =>
    set({ selectedCards: [] }),
  
  setBlocked: (blocked) =>
    set({ isBlocked: blocked })
}));
