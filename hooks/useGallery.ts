// Powered by OnSpace.AI
import { useContext } from 'react';
import { GalleryContext } from '@/contexts/GalleryContext';

export function useGallery() {
  const context = useContext(GalleryContext);
  if (!context) throw new Error('useGallery must be used within GalleryProvider');
  return context;
}
