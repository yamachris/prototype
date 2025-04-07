import { attackCardButton } from 'src/types/game';

export const initialAttackButtons: attackCardButton[] = [
  { id: 'A', category: '1', active: true, wasUsed: false },
  { id: '2', category: '1', active: true, wasUsed: false },
  { id: '3', category: '1', active: true, wasUsed: false },
  { id: '4', category: '2', active: true, wasUsed: false },
  { id: '5', category: '2', active: true, wasUsed: false },
  { id: '6', category: '2', active: true, wasUsed: false },
  { id: '7', category: '3', active: false, wasUsed: false }, //la carte 7 toujours à false
  { id: '8', category: '4', active: true, wasUsed: false },
  { id: '9', category: '5', active: true, wasUsed: false },
  { id: 'J', category: '6', active: true, wasUsed: false },
  { id: 'K', category: '7', active: true, wasUsed: false },
];
