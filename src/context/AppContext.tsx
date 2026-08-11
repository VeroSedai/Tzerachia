import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  toggleMonthlyTask: (taskId: string) => void;
  addCustomGuide: (guide: Guide) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  deleteCustomGuide: (id: string) => void;
  deleteCustomRecipe: (id: string) => void;
  addCustomCategory: (category: string) => void;
  deleteCustomCategory: (category: string) => void;
  updateWeeklySchedule: (updates: { id: string, title: string }[]) => void;
  resetWeeklySchedule: () => void;
  resetMonthlyTasks: () => void;
  resetDailyTasks: () => void;
  resetActiveChallenge: () => void;
  factoryReset: () => void;
  toggleNotifications: (enabled: boolean) => void;
  updateReminderTime: (time: string) => void;
  setLanguage: (lang: 'it' | 'en') => void;
}

const DAILY_KEY = '@simplyclean_daily';
const WEEKLY_KEY = '@simplyclean_weekly';
const MONTHLY_KEY = '@simplyclean_monthly';
const CHALLENGES_KEY = '@simplyclean_challenges';
const LAST_DATE_KEY = '@simplyclean_last_date';
const CUSTOM_GUIDES_KEY = '@simplyclean_custom_guides';
const CUSTOM_RECIPES_KEY = '@simplyclean_custom_recipes';
const CUSTOM_CATEGORIES_KEY = '@simplyclean_custom_categories';
const NOTIFICATIONS_ENABLED_KEY = '@simplyclean_notifications_enabled';
const REMINDER_TIME_KEY = '@simplyclean_reminder_time';
const LANGUAGE_KEY = '@simplyclean_language';

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
  monthlyTasks: [
    { id: 'm1', title: 'Filtri Aria e Bocchette', completed: false, type: 'monthly' },
    { id: 'm2', title: 'Lampadari e Ventilatori', completed: false, type: 'monthly' },
    { id: 'm3', title: 'Muri e Interruttori', completed: false, type: 'monthly' },
    { id: 'm4', title: 'Igienizzazione Materassi', completed: false, type: 'monthly' },
    { id: 'm5', title: 'Decalcificazione Macchina Caffè', completed: false, type: 'monthly' }
  ],
  activeChallenge: null,
  timerDuration: 15 * 60,
  timerActive: false,
  customGuides: [],
  customRecipes: [],
  customCategories: [],
  notificationsEnabled: false,
  reminderTime: '09:00',
  language: 'it',
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [dailyStr, weeklyStr, monthlyStr, challengesStr, lastDateStr, customGuidesStr, customRecipesStr, customCategoriesStr, notifEnabledStr, reminderTimeStr, languageStr] = await Promise.all([
          AsyncStorage.getItem(DAILY_KEY),
          AsyncStorage.getItem(WEEKLY_KEY),
          AsyncStorage.getItem(MONTHLY_KEY),
          AsyncStorage.getItem(CHALLENGES_KEY),
          AsyncStorage.getItem(LAST_DATE_KEY),
          AsyncStorage.getItem(CUSTOM_GUIDES_KEY),
          AsyncStorage.getItem(CUSTOM_RECIPES_KEY),
          AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY),
          AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
          AsyncStorage.getItem(REMINDER_TIME_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY)
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
        const monthlyTasks = safeParse(monthlyStr, defaultState.monthlyTasks);
        const activeChallenge = safeParse(challengesStr, defaultState.activeChallenge);
        const customGuides = safeParse(customGuidesStr, defaultState.customGuides);
        const customRecipes = safeParse(customRecipesStr, defaultState.customRecipes);
        const customCategories = safeParse(customCategoriesStr, defaultState.customCategories);
        const notificationsEnabled = safeParse(notifEnabledStr, defaultState.notificationsEnabled);
        const reminderTime = safeParse(reminderTimeStr, defaultState.reminderTime);
        const language = languageStr === 'en' || languageStr === 'it' ? languageStr : defaultState.language;
        
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
          monthlyTasks,
          activeChallenge,
          timerDuration: 15 * 60,
          timerActive: false,
          customGuides,
          customRecipes,
          customCategories,
          notificationsEnabled,
          reminderTime,
          language,
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
    if (state.timerActive) {
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
  }, [state.timerActive]);

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
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`AsyncStorage Save Error for key ${key}:`, error);
    }
  };

  const safeRemoveItem = async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`AsyncStorage Remove Error for key ${key}:`, error);
    }
  };

  const safeClear = async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("AsyncStorage Clear Error:", error);
    }
  };

  const toggleTask = useCallback(async (taskId: string) => {
    setState(prev => {
      let updatedDaily = [...prev.dailyTasks];
      let updatedWeekly = [...prev.weeklyTasks];
      if (updatedDaily.some(t => t.id === taskId)) {
        updatedDaily = updatedDaily.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        safeSetItem(DAILY_KEY, updatedDaily).catch(console.error);
      } else {
        updatedWeekly = updatedWeekly.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      }
      return { ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly };
    });
  }, []);

  const reassignTaskDay = useCallback(async (taskId: string, newDay: string) => {
    setState(prev => {
      const updatedWeekly = prev.weeklyTasks.map(t => t.id === taskId ? { ...t, dayOfWeek: newDay } : t);
      safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      return { ...prev, weeklyTasks: updatedWeekly };
    });
  }, []);

  const postponeTaskToFriday = useCallback(async (taskId: string) => {
    setState(prev => {
      const updatedWeekly = prev.weeklyTasks.map(t => t.id === taskId ? { ...t, postponed: true } : t);
      safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      return { ...prev, weeklyTasks: updatedWeekly };
    });
  }, []);

  const toggleMonthlyTask = useCallback(async (id: string) => {
    setState(prev => {
      const updatedMonthly = prev.monthlyTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      safeSetItem(MONTHLY_KEY, updatedMonthly).catch(console.error);
      return { ...prev, monthlyTasks: updatedMonthly };
    });
  }, []);

  const startChallenge = useCallback(async (challengeId: '7-day' | '28-day') => {
    const activeChallenge = {
      id: challengeId,
      title: challengeId === '7-day' ? '7-Day Kick Start' : '28-Day Challenge',
      durationDays: challengeId === '7-day' ? 7 : 28,
      currentDay: 1,
      status: 'active' as const,
      tasks: challengeData(1)
    };
    await safeSetItem(CHALLENGES_KEY, activeChallenge);
    setState(prev => ({ ...prev, activeChallenge }));
  }, []);

  const advanceChallengeDay = useCallback(async () => {
    setState(prev => {
      if (!prev.activeChallenge) return prev;
      const isCompleted = prev.activeChallenge.currentDay >= prev.activeChallenge.durationDays;
      const nextDay = isCompleted ? prev.activeChallenge.durationDays : prev.activeChallenge.currentDay + 1;
      const updatedChallenge = {
        ...prev.activeChallenge,
        currentDay: nextDay,
        status: isCompleted ? 'completed' as const : 'active' as const,
        tasks: challengeData(nextDay)
      };
      safeSetItem(CHALLENGES_KEY, updatedChallenge).catch(console.error);
      return { ...prev, activeChallenge: updatedChallenge };
    });
  }, []);

  const setTimer = useCallback((duration: number) => {
    setState(prev => ({ ...prev, timerDuration: duration }));
  }, []);

  const toggleTimerActive = useCallback(() => {
    setState(prev => ({ ...prev, timerActive: !prev.timerActive }));
  }, []);

  const toggleChallengeSubtask = useCallback(async (subtaskId: string) => {
    setState(prev => {
      if (!prev.activeChallenge || !prev.activeChallenge.tasks) return prev;
      const updatedTasks = prev.activeChallenge.tasks.map(task => ({
        ...task,
        subtasks: task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      }));
      const updatedChallenge = { ...prev.activeChallenge, tasks: updatedTasks };
      safeSetItem(CHALLENGES_KEY, updatedChallenge).catch(console.error);
      return { ...prev, activeChallenge: updatedChallenge };
    });
  }, []);

  const addCustomGuide = useCallback(async (guide: Guide) => {
    setState(prev => {
      const updatedGuides = [...prev.customGuides, guide];
      safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides).catch(console.error);
      return { ...prev, customGuides: updatedGuides };
    });
  }, []);

  const addCustomRecipe = useCallback(async (recipe: Recipe) => {
    setState(prev => {
      const updatedRecipes = [...prev.customRecipes, recipe];
      safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes).catch(console.error);
      return { ...prev, customRecipes: updatedRecipes };
    });
  }, []);

  const deleteCustomGuide = useCallback(async (id: string) => {
    setState(prev => {
      const updatedGuides = prev.customGuides.filter(g => g.id !== id);
      safeSetItem(CUSTOM_GUIDES_KEY, updatedGuides).catch(console.error);
      return { ...prev, customGuides: updatedGuides };
    });
  }, []);

  const deleteCustomRecipe = useCallback(async (id: string) => {
    setState(prev => {
      const updatedRecipes = prev.customRecipes.filter(r => r.id !== id);
      safeSetItem(CUSTOM_RECIPES_KEY, updatedRecipes).catch(console.error);
      return { ...prev, customRecipes: updatedRecipes };
    });
  }, []);

  const addCustomCategory = useCallback(async (category: string) => {
    setState(prev => {
      if (prev.customCategories.includes(category)) return prev;
      const updatedCategories = [...prev.customCategories, category];
      safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories).catch(console.error);
      return { ...prev, customCategories: updatedCategories };
    });
  }, []);

  const deleteCustomCategory = useCallback(async (category: string) => {
    setState(prev => {
      const updatedCategories = prev.customCategories.filter(c => c !== category);
      safeSetItem(CUSTOM_CATEGORIES_KEY, updatedCategories).catch(console.error);
      return { ...prev, customCategories: updatedCategories };
    });
  }, []);

  const updateWeeklySchedule = useCallback(async (updates: { id: string, title: string }[]) => {
    setState(prev => {
      let updatedWeekly = [...prev.weeklyTasks];
      updates.forEach(update => {
        updatedWeekly = updatedWeekly.map(t => t.id === update.id ? { ...t, title: update.title } : t);
      });
      safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      return { ...prev, weeklyTasks: updatedWeekly };
    });
  }, []);

  const resetWeeklySchedule = useCallback(async () => {
    setState(prev => {
      const resetWeekly = prev.weeklyTasks.map(t => ({ ...t, completed: false, postponed: false }));
      safeSetItem(WEEKLY_KEY, resetWeekly).catch(console.error);
      return { ...prev, weeklyTasks: resetWeekly };
    });
  }, []);

  const resetMonthlyTasks = useCallback(async () => {
    setState(prev => {
      const resetMonthly = prev.monthlyTasks.map(t => ({ ...t, completed: false }));
      safeSetItem(MONTHLY_KEY, resetMonthly).catch(console.error);
      return { ...prev, monthlyTasks: resetMonthly };
    });
  }, []);

  const resetDailyTasks = useCallback(async () => {
    setState(prev => {
      const updatedDaily = prev.dailyTasks.map(t => ({ ...t, completed: false }));
      safeSetItem(DAILY_KEY, updatedDaily).catch(console.error);
      return { ...prev, dailyTasks: updatedDaily };
    });
  }, []);

  const resetActiveChallenge = useCallback(async () => {
    setState(prev => {
      if (!prev.activeChallenge) return prev;
      const resetChallenge = {
        ...prev.activeChallenge,
        currentDay: 1,
        status: 'active' as const,
        tasks: challengeData(1)
      };
      safeSetItem(CHALLENGES_KEY, resetChallenge).catch(console.error);
      return { ...prev, activeChallenge: resetChallenge };
    });
  }, []);

  const toggleNotifications = useCallback(async (enabled: boolean) => {
    await safeSetItem(NOTIFICATIONS_ENABLED_KEY, enabled);
    setState(prev => ({ ...prev, notificationsEnabled: enabled }));
  }, []);

  const updateReminderTime = useCallback(async (time: string) => {
    await safeSetItem(REMINDER_TIME_KEY, time);
    setState(prev => ({ ...prev, reminderTime: time }));
  }, []);

  const setLanguage = useCallback(async (lang: 'it' | 'en') => {
    await safeSetItem(LANGUAGE_KEY, lang);
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const factoryReset = useCallback(async () => {
    await safeClear();
    setState(JSON.parse(JSON.stringify(defaultState)));
  }, []);


  const contextValue = useMemo(() => ({
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
    toggleMonthlyTask,
    addCustomGuide,
    addCustomRecipe,
    deleteCustomGuide,
    deleteCustomRecipe,
    addCustomCategory,
    deleteCustomCategory,
    updateWeeklySchedule,
    resetWeeklySchedule,
    resetMonthlyTasks,
    resetDailyTasks,
    resetActiveChallenge,
    factoryReset,
    toggleNotifications,
    updateReminderTime,
    setLanguage,
  }), [
    state, catchAllTasks, toggleTask, reassignTaskDay, postponeTaskToFriday, startChallenge, advanceChallengeDay, setTimer, toggleTimerActive, toggleChallengeSubtask, toggleMonthlyTask, addCustomGuide, addCustomRecipe, deleteCustomGuide, deleteCustomRecipe, addCustomCategory, deleteCustomCategory, updateWeeklySchedule, resetWeeklySchedule, resetMonthlyTasks, resetDailyTasks, resetActiveChallenge, factoryReset, toggleNotifications, updateReminderTime, setLanguage
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {isLoaded ? children : null}
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
