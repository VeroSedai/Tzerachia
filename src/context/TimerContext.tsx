import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState as RNAppState, AppStateStatus, Vibration, Alert } from 'react-native';

const DEFAULT_DURATION = 15 * 60; // 15-minute standard session

interface TimerContextValue {
  timerDuration: number;
  timerActive: boolean;
  startTimer: (duration?: number) => void;
  pauseTimer: () => void;
  toggleTimerActive: () => void;
  setTimer: (duration: number) => void;
  resetTimer: (duration?: number) => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timerDuration, setTimerDuration] = useState<number>(DEFAULT_DURATION);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const targetEndTimeRef = useRef<number | null>(null);

  const calculateRemaining = useCallback(() => {
    if (!targetEndTimeRef.current) return 0;
    const diff = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
    return Math.max(0, diff);
  }, []);

  const handleTimerComplete = useCallback(() => {
    setTimerActive(false);
    targetEndTimeRef.current = null;
    setTimerDuration(0);
    Vibration.vibrate([500, 500, 500]);
    Alert.alert('Tempo scaduto!', 'Ottimo lavoro con la sessione Tzerachìa!');
  }, []);

  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
        handleTimerComplete();
      } else {
        setTimerDuration(remaining);
      }
    }, 500);

    // Handle return from background / locked screen on iOS and Android
    const subscription = RNAppState.addEventListener('change', (nextStatus: AppStateStatus) => {
      if (nextStatus === 'active' && targetEndTimeRef.current) {
        const remaining = calculateRemaining();
        if (remaining <= 0) {
          handleTimerComplete();
        } else {
          setTimerDuration(remaining);
        }
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [timerActive, calculateRemaining, handleTimerComplete]);

  const startTimer = useCallback((duration?: number) => {
    const totalDuration = duration !== undefined ? duration : (timerDuration > 0 ? timerDuration : DEFAULT_DURATION);
    targetEndTimeRef.current = Date.now() + totalDuration * 1000;
    setTimerDuration(totalDuration);
    setTimerActive(true);
  }, [timerDuration]);

  const pauseTimer = useCallback(() => {
    if (targetEndTimeRef.current) {
      setTimerDuration(calculateRemaining());
    }
    targetEndTimeRef.current = null;
    setTimerActive(false);
  }, [calculateRemaining]);

  const toggleTimerActive = useCallback(() => {
    if (timerActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [timerActive, pauseTimer, startTimer]);

  const setTimer = useCallback((duration: number) => {
    targetEndTimeRef.current = null;
    setTimerActive(false);
    setTimerDuration(duration);
  }, []);

  const resetTimer = useCallback((duration: number = DEFAULT_DURATION) => {
    targetEndTimeRef.current = null;
    setTimerActive(false);
    setTimerDuration(duration);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timerDuration,
        timerActive,
        startTimer,
        pauseTimer,
        toggleTimerActive,
        setTimer,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
