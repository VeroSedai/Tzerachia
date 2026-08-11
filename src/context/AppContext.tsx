import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Vibration, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Challenge, AppState, Guide, Recipe } from '../types';
import { challengeData } from '../data/guidesAndRecipes';

interface AppContextProps {
  state: AppState;
  catchAllTasks: Task[];
  toggleTask: (taskId: string) => void;
  reassignTaskDay: (taskId: string, newDay: string) => void;
  postponeTaskToFriday: (taskId: string) => void;
  startChallenge: (challengeId: '7-day' | '28-day') => void;
  advanceChallengeDay: () => void;
  setTimer: (duration: number) => void;
  toggleTimerActive: () => void;
  toggleChallengeSubtask: (subtaskId: string) => void;
  addCustomGuide: (guide: Guide) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  updateWeeklySchedule: (updates: { id: string, title: string }[]) => void;
  resetWeeklySchedule: () => void;
  resetDailyTasks: () => void;
  resetActiveChallenge: () => void;
  factoryReset: () => void;
}

const DAILY_KEY = '@simplyclean_daily';
const WEEKLY_KEY = '@simplyclean_weekly';
const CHALLENGES_KEY = '@simplyclean_challenges';
const LAST_DATE_KEY = '@simplyclean_last_date';
const CUSTOM_GUIDES_KEY = '@simplyclean_custom_guides';
const CUSTOM_RECIPES_KEY = '@simplyclean_custom_recipes';

const defaultState: AppState = {
  lastResetDate: new Date().toISOString().split('T')[0],
  dailyTasks: [
    { id: 'daily-1', title: 'Rifare i letti', completed: false, type: 'daily' },
    { id: 'daily-2', title: 'Controllare i pavimenti', completed: false, type: 'daily' },
    { id: 'daily-3', title: 'Pulire i banconi', completed: false, type: 'daily' },
    { id: 'daily-4', title: 'Riordinare', completed: false, type: 'daily' },
    { id: 'daily-5', title: 'Fare il bucato', completed: false, type: 'daily' }
  ],
  weeklyTasks: [
    { id: 'weekly-1', title: 'Pulizia bagni', completed: false, type: 'weekly', dayOfWeek: 'Lunedì' },
    { id: 'weekly-2', title: 'Spolverare', completed: false, type: 'weekly', dayOfWeek: 'Martedì' },
    { id: 'weekly-3', title: 'Aspirapolvere', completed: false, type: 'weekly', dayOfWeek: 'Mercoledì' },
    { id: 'weekly-4', title: 'Lavare i pavimenti', completed: false, type: 'weekly', dayOfWeek: 'Giovedì' },
    { id: 'weekly-5', title: 'Catch-all Day', completed: false, type: 'catch-all', dayOfWeek: 'Venerdì' },
    { id: 'weekly-6', title: 'Lenzuola e Asciugamani', completed: false, type: 'weekly', dayOfWeek: 'Sabato' }
  ],
  activeChallenge: null,
  timerDuration: 15 * 60,
  timerActive: false,
  customGuides: [],
  customRecipes: [],
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [dailyStr, weeklyStr, challengesStr, lastDateStr, customGuidesStr, customRecipesStr] = await Promise.all([
          AsyncStorage.getItem(DAILY_KEY),
          AsyncStorage.getItem(WEEKLY_KEY),
          AsyncStorage.getItem(CHALLENGES_KEY),
          AsyncStorage.getItem(LAST_DATE_KEY),
          AsyncStorage.getItem(CUSTOM_GUIDES_KEY),
          AsyncStorage.getItem(CUSTOM_RECIPES_KEY)
        ]);

        const safeParse = (str: string | null, fallback: any) => {
          if (!str) return fallback;
          try {
            return JSON.parse(str);
          } catch (e) {
            console.error("AsyncStorage Load Error: Failed to parse", str, e);
            return fallback;
          }
        };

        const today = new Date().toISOString().split('T')[0];
        let dailyTasks = safeParse(dailyStr, defaultState.dailyTasks);
        const weeklyTasks = safeParse(weeklyStr, defaultState.weeklyTasks);
        const activeChallenge = safeParse(challengesStr, defaultState.activeChallenge);
        const customGuides = safeParse(customGuidesStr, defaultState.customGuides);
        const customRecipes = safeParse(customRecipesStr, defaultState.customRecipes);
        
        // Auto Reset Logic
        if (lastDateStr !== today) {
          dailyTasks = dailyTasks.map((t: Task) => ({ ...t, completed: false }));
          try {
            await safeSetItem(LAST_DATE_KEY, today);
            await safeSetItem(DAILY_KEY, dailyTasks);
          } catch (e) {
            console.error("AsyncStorage Save Error during auto-reset:", e);
          }
        }

        setState({
          lastResetDate: today,
          dailyTasks,
          weeklyTasks,
          activeChallenge,
          timerDuration: 15 * 60,
          timerActive: false,
          customGuides,
          customRecipes,
        });
      } catch (error) {
        console.error('AsyncStorage Load Error:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Global Timer Engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state.timerActive && state.timerDuration > 0) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, timerDuration: prev.timerDuration - 1 }));
      }, 1000);
    } else if (state.timerDuration === 0 && state.timerActive) {
      setState(prev => ({ ...prev, timerActive: false }));
      Vibration.vibrate([500, 500, 500]);
      Alert.alert('Tempo scaduto! 🧹', 'Ottimo lavoro con la sessione Simply Clean!');
    }
    return () => clearInterval(interval);
  }, [state.timerActive, state.timerDuration]);

  // Catch-All Logic
  const catchAllTasks = useMemo(() => {
    const DAYS_ORDER = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 
    
    return state.weeklyTasks.filter(t => {
      if (t.completed || t.type === 'catch-all' || !t.dayOfWeek) return false;
      if (t.postponed) return true;
      const taskDayIndex = DAYS_ORDER.findIndex(d => d.toLowerCase() === t.dayOfWeek?.toLowerCase());
      return taskDayIndex !== -1 && taskDayIndex < currentDayIndex;
    });
  }, [state.weeklyTasks]);


  const safeSetItem = async (key: string, value: any) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await safeSetItem(key, stringValue);
    } catch (error) {
      console.error(`AsyncStorage Save Error for key ${key}:`, error);
    }
  };

  const safeRemoveItem = async (key: string) => {
    try {
      await safeRemoveItem(key);
    } catch (error) {
      console.error(`AsyncStorage Remove Error for key ${key}:`, error);
    }
  };

  const safeClear = async () => {
    try {
      await safeClear();
    } catch (error) {
      console.error("AsyncStorage Clear Error:", error);
    }
  };

  const toggleTask = async (taskId: string) => {
    let updatedDaily = [...state.dailyTasks];
    let updatedWeekly = [...state.weeklyTasks];
    
    if (updatedDaily.some(t => t.id === taskId)) {
      updatedDaily = updatedDaily.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      await safeSetItem(DAILY_KEY, updatedDaily);
    } else {
      updatedWeekly = updatedWeekly.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      await safeSetItem(WEEKLY_KEY, updatedWeekly);
    }

    setState(prev => ({ ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly }));
  };

  const reassignTaskDay = async (taskId: string, newDay: string) => {
    const updatedWeekly = state.weeklyTasks.map(t => t.id === taskId ? { ...t, dayOfWeek: newDay } : t);
    await safeSetItem(WEEKLY_KEY, updatedWeekly);
    setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));
  };

  const postponeTaskToFriday = async (taskId: string) => {
    const updatedWeekly = state.weeklyTasks.map(t => t.id === taskId ? { ...t, postponed: true } : t);
    await safeSetItem(WEEKLY_KEY, updatedWeekly);
    setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));
  };

  const startChallenge = async (challengeId: '7-day' | '28-day') => {
    const activeChallenge: Challenge = {
      id: challengeId,
      title: challengeId === '7-day' ? '7-Day Kick Start' : '28-Day Challenge',
      durationDays: challengeId === '7-day' ? 7 : 28,
      currentDay: 1,
      status: 'active',
      tasks: challengeData(1)
    };
    await safeSetItem(CHALLENGES_KEY, activeChallenge);
    setState(prev => ({ ...prev, activeChallenge }));
  };

  const advanceChallengeDay = async () => {
    if (!state.activeChallenge) return;
    const isCompleted = state.activeChallenge.currentDay >= state.activeChallenge.durationDays;
    const nextDay = isCompleted ? state.activeChallenge.durationDays : state.activeChallenge.currentDay + 1;
    const updatedChallenge: Challenge = {
      ...state.activeChallenge,
      currentDay: nextDay,
      status: isCompleted ? 'completed' : 'active',
      tasks: challengeData(nextDay)
    };
    await safeSetItem(CHALLENGES_KEY, updatedChallenge);
    setState(prev => ({ ...prev, activeChallenge: updatedChallenge }));
  };

  const setTimer = (duration: number) => {
    setState(prev => ({ ...prev, timerDuration: duration }));
  };

  const toggleTimerActive = () => {
    setState(prev => ({ ...prev, timerActive: !prev.timerActive }));
  };

  const toggleChallengeSubtask = async (subtaskId: string) => {
    if (!state.activeChallenge || !state.activeChallenge.tasks) return;
    
    const updatedTasks = state.activeChallenge.tasks.map(task => ({
      ...task,
      subtasks: task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
    
    const updatedChallenge = { ...state.activeChallenge, tasks: updatedTasks };
    await safeSetItem(CHALLENGES_KEY, updatedChallenge);
    setState(prev => ({ ...prev, activeChallenge: updatedChallenge }));
  };

  const addCustomGuide = async (guide: Guide) => {
    const updatedGuides = [...state.customGuides, guide];
    await safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides);
    setState(prev => ({ ...prev, customGuides: updatedGuides }));
  };

  const addCustomRecipe = async (recipe: Recipe) => {
    const updatedRecipes = [...state.customRecipes, recipe];
    await safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes);
    setState(prev => ({ ...prev, customRecipes: updatedRecipes }));
  };

  const updateWeeklySchedule = async (updates: { id: string, title: string }[]) => {
    let updatedWeekly = [...state.weeklyTasks];
    updates.forEach(update => {
      updatedWeekly = updatedWeekly.map(t => t.id === update.id ? { ...t, title: update.title } : t);
    });
    await safeSetItem(WEEKLY_KEY, updatedWeekly);
    setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));
  };

  const resetWeeklySchedule = async () => {
    await safeSetItem(WEEKLY_KEY, defaultState.weeklyTasks);
    setState(prev => ({ ...prev, weeklyTasks: defaultState.weeklyTasks }));
  };

  const resetDailyTasks = async () => {
    const updatedDaily = state.dailyTasks.map(t => ({ ...t, completed: false }));
    await safeSetItem(DAILY_KEY, updatedDaily);
    setState(prev => ({ ...prev, dailyTasks: updatedDaily }));
  };

  const resetActiveChallenge = async () => {
    await safeRemoveItem(CHALLENGES_KEY);
    setState(prev => ({ ...prev, activeChallenge: null }));
  };

  const factoryReset = async () => {
    await safeClear();
    setState(defaultState);
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      catchAllTasks, 
      toggleTask, 
      reassignTaskDay, 
      postponeTaskToFriday,
      startChallenge, 
      advanceChallengeDay, 
      setTimer, 
      toggleTimerActive,
      toggleChallengeSubtask,
      addCustomGuide,
      addCustomRecipe,
      updateWeeklySchedule,
      resetWeeklySchedule,
      resetDailyTasks,
      resetActiveChallenge,
      factoryReset
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
