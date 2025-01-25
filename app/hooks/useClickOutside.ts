import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useClickOutside(callback: () => void) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleClickOutside = (event: MouseEvent) => {
        callback();
      };
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [callback]);
} 