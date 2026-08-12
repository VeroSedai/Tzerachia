import { useEffect } from 'react';
import { Vibration, Alert } from 'react-native';
import { AppState } from '../types';

export const useTimer = (
  timerActive: boolean,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timerDuration <= 1) {
            clearInterval(interval);
            Vibration.vibrate([500, 500, 500]);
            Alert.alert('Tempo scaduto! 🧹', 'Ottimo lavoro con la sessione Simply Clean!');
            return { ...prev, timerDuration: 0, timerActive: false };
          }
          return { ...prev, timerDuration: prev.timerDuration - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, setState]);
};
