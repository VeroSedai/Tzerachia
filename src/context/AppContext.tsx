import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { Task, AppState, Guide, Recipe } from '../types';
import * as Linking from 'expo-linking';
import { importAppStatePayload } from '../utils/syncUtils';
import { supabase } from '../lib/supabase';
import { useTimer } from '../hooks/useTimer';
import { useHouseholdSync } from '../hooks/useHouseholdSync';
import { useTasks } from '../hooks/useTasks';
import { useGuidesAndRecipes } from '../hooks/useGuidesAndRecipes';
import { useChallenges } from '../hooks/useChallenges';
import { 
  loadInitialState, 
  safeSetItem, 
  safeClear, 
  DAILY_KEY, 
  WEEKLY_KEY, 
  MONTHLY_KEY, 
  NOTIFICATIONS_ENABLED_KEY, 
  REMINDER_TIME_KEY, 
  LANGUAGE_KEY 
} from '../services/storageService';

interface AppContextProps {
  state: AppState;
  catchAllTasks: Task[];
  createHousehold: (name?: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  addCustomTask: (title: string, date: string) => void;
  toggleCustomTask: (id: string) => void;
  deleteCustomTask: (id: string) => void;
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
  syncTasks: (payload: string) => void;
  toggleNotifications: (enabled: boolean) => void;
  updateReminderTime: (time: string) => void;
  setLanguage: (lang: 'it' | 'en') => void;
  setSelectedDate: (date: string) => void;
}

const defaultState: AppState = {
  session: null,
  household: null,
  lastResetDate: new Date().toISOString().split('T')[0],
  selectedDate: new Date().toISOString().split('T')[0],
  dailyTasks: [
    { id: 'daily-1', title: 'Rifare i letti', completed: false, type: 'daily' },
    { id: 'daily-2', title: 'Controllare i pavimenti', completed: false, type: 'daily' },
    { id: 'daily-3', title: 'Pulire i banconi', completed: false, type: 'daily' },
    { id: 'daily-4', title: 'Riordinare', completed: false, type: 'daily' },
    { id: 'daily-5', title: 'Fare il bucato', completed: false, type: 'daily' }
  ],
  dailyTasksCompletionsByDate: {},
  customTasks: [],
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
    loadInitialState(setState, setIsLoaded, defaultState);
  }, []);

  const { fetchHousehold } = useHouseholdSync(setState);
  useTimer(state.timerActive, setState);
  
  const taskActions = useTasks(state, setState);
  const guideAndRecipeActions = useGuidesAndRecipes(setState);
  const challengeActions = useChallenges(setState);

  const syncTasks = useCallback(async (payloadString: string) => {
    const payload = importAppStatePayload(payloadString);
    if (!payload) {
      Alert.alert('Errore', 'Impossibile leggere i dati di sincronizzazione.');
      return;
    }
    
    setState(prev => {
      const updatedDaily = prev.dailyTasks.map(t => payload.d.includes(t.id) ? { ...t, completed: true } : t);
      const updatedWeekly = prev.weeklyTasks.map(t => payload.w.includes(t.id) ? { ...t, completed: true } : t);
      const updatedMonthly = prev.monthlyTasks.map(t => payload.m.includes(t.id) ? { ...t, completed: true } : t);
      
      safeSetItem(DAILY_KEY, updatedDaily).catch(console.error);
      safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      safeSetItem(MONTHLY_KEY, updatedMonthly).catch(console.error);
      
      Alert.alert("Sincronizzazione Riuscita!", "Lo stato della casa è stato aggiornato.");
      
      return { ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly, monthlyTasks: updatedMonthly };
    });
  }, []);

  useEffect(() => {
    const handleUrl = (event: Linking.EventType) => {
      const parsed = Linking.parse(event.url);
      if (parsed.scheme === 'tzerachia' && parsed.path === 'sync' && parsed.queryParams?.data) {
        const payloadStr = Array.isArray(parsed.queryParams.data) ? parsed.queryParams.data[0] : parsed.queryParams.data;
        syncTasks(payloadStr);
      }
    };
    
    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });
    
    return () => subscription.remove();
  }, [syncTasks]);

  const createHousehold = useCallback(async (name?: string) => {
    setState(prev => {
      if (!prev.session) return prev;
      (async () => {
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase.from('households').insert({ name: name || 'La mia Casa', invite_code: inviteCode }).select().single();
        if (data) {
          await supabase.from('household_members').insert({ household_id: data.id, user_id: prev.session!.user.id });
          fetchHousehold(prev.session!.user.id);
        } else if (error) {
          Alert.alert("Errore", "Non è stato possibile creare la casa.");
        }
      })();
      return prev;
    });
  }, [fetchHousehold]);

  const joinHousehold = useCallback(async (inviteCode: string) => {
    setState(prev => {
      if (!prev.session) return prev;
      (async () => {
        const { data: hh } = await supabase.from('households').select('*').eq('invite_code', inviteCode.toUpperCase()).single();
        if (hh) {
          const { error } = await supabase.from('household_members').insert({ household_id: hh.id, user_id: prev.session!.user.id });
          if (!error) {
            fetchHousehold(prev.session!.user.id);
            Alert.alert("Successo", "Ti sei unito alla casa!");
          } else {
            Alert.alert("Errore", "Impossibile unirsi alla casa.");
          }
        } else {
          Alert.alert("Errore", "Codice invito non valido.");
        }
      })();
      return prev;
    });
  }, [fetchHousehold]);

  const leaveHousehold = useCallback(async () => {
    if (!state.household || !state.session) return;
    
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('household_id', state.household.id)
      .eq('user_id', state.session.user.id);
      
    if (error) {
      console.error("Error leaving household:", error);
      Alert.alert("Errore", "Impossibile lasciare la casa.");
      return;
    }

    setState(prev => ({ ...prev, household: null }));
  }, [state.household, state.session]);

  const setTimer = useCallback((duration: number) => {
    setState(prev => ({ ...prev, timerDuration: duration }));
  }, []);

  const toggleTimerActive = useCallback(() => {
    setState(prev => ({ ...prev, timerActive: !prev.timerActive }));
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

  const setSelectedDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  const factoryReset = useCallback(async () => {
    await safeClear();
    setState(JSON.parse(JSON.stringify(defaultState)));
  }, []);

  const contextValue = useMemo(() => ({
    state,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    setTimer,
    toggleTimerActive,
    factoryReset,
    toggleNotifications,
    updateReminderTime,
    setLanguage,
    setSelectedDate,
    syncTasks,
    ...taskActions,
    ...guideAndRecipeActions,
    ...challengeActions
  }), [
    state,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    setTimer,
    toggleTimerActive,
    factoryReset,
    toggleNotifications,
    updateReminderTime,
    setLanguage,
    setSelectedDate,
    syncTasks,
    taskActions,
    guideAndRecipeActions,
    challengeActions
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
