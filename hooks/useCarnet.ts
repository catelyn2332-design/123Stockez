// Powered by OnSpace.AI
import { useContext } from 'react';
import { CarnetContext } from '@/contexts/CarnetContext';

export function useCarnet() {
  const context = useContext(CarnetContext);
  if (!context) throw new Error('useCarnet must be used within CarnetProvider');
  return context;
}
