import { useCallback, useMemo } from 'react';
import { AppState, CustomTask } from '../types';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../lib/supabase';
import { safeSetItem, DAILY_KEY, WEEKLY_KEY, MONTHLY_KEY, CUSTOM_TASKS_KEY } from '../services/storageService';
import { getTodayStr, getStartOfWeekStr, getStartOfMonthStr } from '../utils/dateUtils';

export const useTasks = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {

  const pushTaskCompletion = async (householdId: string, userId: string, taskId: string, completed: boolean, taskType: 'daily' | 'weekly' | 'monthly') => {
    const today = getTodayStr();
    if (completed) {
      await supabase.from('task_completions').upsert({
        household_id: householdId,
        task_id: taskId,
        completed_at: today,
        completed_by: userId
      });
    } else {
      if (taskType === 'daily') {
        await supabase.from('task_completions')
          .delete()
          .eq('household_id', householdId)
          .eq('task_id', taskId)
          .eq('completed_at', today);
      } else if (taskType === 'weekly') {
        const startOfWeek = getStartOfWeekStr();
        await supabase.from('task_completions')
          .delete()
          .eq('household_id', householdId)
          .eq('task_id', taskId)
          .gte('completed_at', startOfWeek);
      } else if (taskType === 'monthly') {
        const startOfMonth = getStartOfMonthStr();
        await supabase.from('task_completions')
          .delete()
          .eq('household_id', householdId)
          .eq('task_id', taskId)
          .gte('completed_at', startOfMonth);
      } else {
        await supabase.from('task_completions')
          .delete()
          .eq('household_id', householdId)
          .eq('task_id', taskId);
      }
    }
  };

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

  const toggleTask = useCallback(async (taskId: string) => {
    setState(prev => {
      let updatedDaily = [...prev.dailyTasks];
      let updatedWeekly = [...prev.weeklyTasks];
      let newCompleted = false;
      let taskType: 'daily' | 'weekly' = 'daily';
      if (updatedDaily.some(t => t.id === taskId)) {
        taskType = 'daily';
        updatedDaily = updatedDaily.map(t => {
          if (t.id === taskId) {
            newCompleted = !t.completed;
            return { ...t, completed: newCompleted };
          }
          return t;
        });
        safeSetItem(DAILY_KEY, updatedDaily).catch(console.error);
      } else {
        taskType = 'weekly';
        updatedWeekly = updatedWeekly.map(t => {
          if (t.id === taskId) {
            newCompleted = !t.completed;
            return { ...t, completed: newCompleted };
          }
          return t;
        });
        safeSetItem(WEEKLY_KEY, updatedWeekly).catch(console.error);
      }
      
      if (prev.household && prev.session) {
        pushTaskCompletion(prev.household.id, prev.session.user.id, taskId, newCompleted, taskType).catch(console.error);
      }
      
      return { ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly };
    });
  }, []);

  const addCustomTask = useCallback(async (title: string, date: string) => {
    setState(prev => {
      const newTask: CustomTask = {
        id: generateUUID(),
        title,
        date,
        completed: false,
        isCustom: true
      };
      
      if (prev.household && prev.session) {
        supabase.from('custom_tasks').insert({
          id: newTask.id,
          household_id: prev.household.id,
          title: newTask.title,
          date: newTask.date,
          completed: newTask.completed,
          created_by: prev.session.user.id
        }).then(({ error }) => {
          if (error) console.error(error);
        });
      }

      const updated = [...prev.customTasks, newTask];
      safeSetItem(CUSTOM_TASKS_KEY, updated).catch(console.error);
      return { ...prev, customTasks: updated };
    });
  }, []);

  const toggleCustomTask = useCallback(async (id: string) => {
    setState(prev => {
      let newCompleted = false;
      const updated = prev.customTasks.map(t => {
        if (t.id === id) {
          newCompleted = !t.completed;
          return { ...t, completed: newCompleted };
        }
        return t;
      });
      
      if (prev.household) {
        supabase.from('custom_tasks').update({ completed: newCompleted }).eq('id', id).then(({error}) => {
          if (error) console.error(error);
        });
      }

      safeSetItem(CUSTOM_TASKS_KEY, updated).catch(console.error);
      return { ...prev, customTasks: updated };
    });
  }, []);

  const deleteCustomTask = useCallback(async (id: string) => {
    setState(prev => {
      if (prev.household) {
        supabase.from('custom_tasks').delete().eq('id', id).then(({error}) => {
          if (error) console.error(error);
        });
      }
      const updated = prev.customTasks.filter(t => t.id !== id);
      safeSetItem(CUSTOM_TASKS_KEY, updated).catch(console.error);
      return { ...prev, customTasks: updated };
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
      let newCompleted = false;
      const updatedMonthly = prev.monthlyTasks.map(task => {
        if (task.id === id) {
          newCompleted = !task.completed;
          return { ...task, completed: newCompleted };
        }
        return task;
      });
      
      if (prev.household && prev.session) {
        pushTaskCompletion(prev.household.id, prev.session.user.id, id, newCompleted, 'monthly').catch(console.error);
      }

      safeSetItem(MONTHLY_KEY, updatedMonthly).catch(console.error);
      return { ...prev, monthlyTasks: updatedMonthly };
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
      
      if (prev.household) {
        const weeklyIds = prev.weeklyTasks.map(t => t.id);
        const startOfWeek = getStartOfWeekStr();
        supabase
          .from('task_completions')
          .delete()
          .eq('household_id', prev.household.id)
          .in('task_id', weeklyIds)
          .gte('completed_at', startOfWeek)
          .then(({ error }) => {
            if (error) console.error('Error resetting weekly tasks on Supabase:', error);
          });
      }
      
      return { ...prev, weeklyTasks: resetWeekly };
    });
  }, []);

  const resetMonthlyTasks = useCallback(async () => {
    setState(prev => {
      const resetMonthly = prev.monthlyTasks.map(t => ({ ...t, completed: false }));
      safeSetItem(MONTHLY_KEY, resetMonthly).catch(console.error);
      
      if (prev.household) {
        const monthlyIds = prev.monthlyTasks.map(t => t.id);
        const startOfMonth = getStartOfMonthStr();
        supabase
          .from('task_completions')
          .delete()
          .eq('household_id', prev.household.id)
          .in('task_id', monthlyIds)
          .gte('completed_at', startOfMonth)
          .then(({ error }) => {
            if (error) console.error('Error resetting monthly tasks on Supabase:', error);
          });
      }
      
      return { ...prev, monthlyTasks: resetMonthly };
    });
  }, []);

  const resetDailyTasks = useCallback(async () => {
    setState(prev => {
      const updatedDaily = prev.dailyTasks.map(t => ({ ...t, completed: false }));
      safeSetItem(DAILY_KEY, updatedDaily).catch(console.error);
      
      if (prev.household) {
        const dailyIds = prev.dailyTasks.map(t => t.id);
        const today = getTodayStr();
        supabase
          .from('task_completions')
          .delete()
          .eq('household_id', prev.household.id)
          .in('task_id', dailyIds)
          .eq('completed_at', today)
          .then(({ error }) => {
            if (error) console.error('Error resetting daily tasks on Supabase:', error);
          });
      }
      
      return { ...prev, dailyTasks: updatedDaily };
    });
  }, []);

  return {
    catchAllTasks,
    toggleTask,
    addCustomTask,
    toggleCustomTask,
    deleteCustomTask,
    reassignTaskDay,
    postponeTaskToFriday,
    toggleMonthlyTask,
    updateWeeklySchedule,
    resetWeeklySchedule,
    resetMonthlyTasks,
    resetDailyTasks
  };
};
