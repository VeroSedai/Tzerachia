import { useCallback, useMemo } from 'react';
import { AppState, CustomTask } from '../types';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../lib/supabase';
import {
  safeSetItem,
  DAILY_KEY,
  WEEKLY_KEY,
  MONTHLY_KEY,
  CUSTOM_TASKS_KEY,
  DAILY_COMPLETIONS_BY_DATE_KEY,
} from '../services/storageService';
import {
  getTodayStr,
  getStartOfWeekStr,
  getStartOfMonthStr,
  pruneOldCompletions,
} from '../utils/dateUtils';

export const useTasks = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  /**
   * Synchronizes task completion status with remote Supabase database.
   */
  const pushTaskCompletion = async (
    householdId: string,
    userId: string,
    taskId: string,
    completed: boolean,
    taskType: 'daily' | 'weekly' | 'monthly',
    targetDate: string = getTodayStr()
  ): Promise<void> => {
    try {
      if (completed) {
        const { error } = await supabase.from('task_completions').upsert({
          household_id: householdId,
          task_id: taskId,
          completed_at: targetDate,
          completed_by: userId,
        });
        if (error) console.error('[useTasks] Supabase upsert task completion error:', error);
      } else {
        let query = supabase.from('task_completions').delete().eq('household_id', householdId).eq('task_id', taskId);

        if (taskType === 'daily') {
          query = query.eq('completed_at', targetDate);
        } else if (taskType === 'weekly') {
          query = query.gte('completed_at', getStartOfWeekStr());
        } else if (taskType === 'monthly') {
          query = query.gte('completed_at', getStartOfMonthStr());
        }

        const { error } = await query;
        if (error) console.error('[useTasks] Supabase delete task completion error:', error);
      }
    } catch (err) {
      console.error('[useTasks] Exception during pushTaskCompletion:', err);
    }
  };

  /**
   * Computes weekly tasks that were missed earlier in the week or postponed to Friday.
   */
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

  /**
   * Toggles completion status of a daily or weekly task.
   * State is updated synchronously; persistence and remote sync are run outside the updater.
   */
  const toggleTask = useCallback(
    async (taskId: string) => {
      const targetDate = state.selectedDate || getTodayStr();
      const isDaily = state.dailyTasks.some(t => t.id === taskId);
      const today = getTodayStr();
      let newCompleted = false;

      let updatedDaily = state.dailyTasks;
      let updatedWeekly = state.weeklyTasks;
      let updatedCompletionsByDate = { ...(state.dailyTasksCompletionsByDate || {}) };
      let taskType: 'daily' | 'weekly' = 'daily';

      if (isDaily) {
        taskType = 'daily';
        const currentCompletedIds = updatedCompletionsByDate[targetDate] || [];
        newCompleted = !currentCompletedIds.includes(taskId);

        if (newCompleted) {
          updatedCompletionsByDate[targetDate] = [...currentCompletedIds.filter(id => id !== taskId), taskId];
        } else {
          updatedCompletionsByDate[targetDate] = currentCompletedIds.filter(id => id !== taskId);
        }
        updatedCompletionsByDate = pruneOldCompletions(updatedCompletionsByDate, 30);

        if (targetDate === today) {
          updatedDaily = state.dailyTasks.map(t => (t.id === taskId ? { ...t, completed: newCompleted } : t));
        }
      } else {
        taskType = 'weekly';
        updatedWeekly = state.weeklyTasks.map(t => {
          if (t.id === taskId) {
            newCompleted = !t.completed;
            return { ...t, completed: newCompleted };
          }
          return t;
        });
      }

      // Pure React state update
      setState(prev => ({
        ...prev,
        dailyTasks: updatedDaily,
        weeklyTasks: updatedWeekly,
        dailyTasksCompletionsByDate: updatedCompletionsByDate,
      }));

      // Side effects executed cleanly outside setState
      try {
        if (isDaily) {
          await safeSetItem(DAILY_COMPLETIONS_BY_DATE_KEY, updatedCompletionsByDate);
          if (targetDate === today) {
            await safeSetItem(DAILY_KEY, updatedDaily);
          }
        } else {
          await safeSetItem(WEEKLY_KEY, updatedWeekly);
        }

        if (state.household && state.session) {
          await pushTaskCompletion(
            state.household.id,
            state.session.user.id,
            taskId,
            newCompleted,
            taskType,
            targetDate
          );
        }
      } catch (err) {
        console.error('[useTasks] Error in toggleTask side-effects:', err);
      }
    },
    [
      state.selectedDate,
      state.dailyTasks,
      state.weeklyTasks,
      state.dailyTasksCompletionsByDate,
      state.household,
      state.session,
    ]
  );

  const addCustomTask = useCallback(
    async (title: string, date: string) => {
      const newTask: CustomTask = {
        id: generateUUID(),
        title,
        date,
        completed: false,
        isCustom: true,
      };

      const updated = [...state.customTasks, newTask];

      setState(prev => ({ ...prev, customTasks: updated }));

      try {
        await safeSetItem(CUSTOM_TASKS_KEY, updated);

        if (state.household && state.session) {
          const { error } = await supabase.from('custom_tasks').insert({
            id: newTask.id,
            household_id: state.household.id,
            title: newTask.title,
            date: newTask.date,
            completed: newTask.completed,
            created_by: state.session.user.id,
          });
          if (error) console.error('[useTasks] Supabase insert custom task error:', error);
        }
      } catch (err) {
        console.error('[useTasks] Error in addCustomTask:', err);
      }
    },
    [state.customTasks, state.household, state.session]
  );

  const toggleCustomTask = useCallback(
    async (id: string) => {
      let newCompleted = false;
      const updated = state.customTasks.map(t => {
        if (t.id === id) {
          newCompleted = !t.completed;
          return { ...t, completed: newCompleted };
        }
        return t;
      });

      setState(prev => ({ ...prev, customTasks: updated }));

      try {
        await safeSetItem(CUSTOM_TASKS_KEY, updated);

        if (state.household) {
          const { error } = await supabase.from('custom_tasks').update({ completed: newCompleted }).eq('id', id);
          if (error) console.error('[useTasks] Supabase update custom task error:', error);
        }
      } catch (err) {
        console.error('[useTasks] Error in toggleCustomTask:', err);
      }
    },
    [state.customTasks, state.household]
  );

  const deleteCustomTask = useCallback(
    async (id: string) => {
      const updated = state.customTasks.filter(t => t.id !== id);

      setState(prev => ({ ...prev, customTasks: updated }));

      try {
        await safeSetItem(CUSTOM_TASKS_KEY, updated);

        if (state.household) {
          const { error } = await supabase.from('custom_tasks').delete().eq('id', id);
          if (error) console.error('[useTasks] Supabase delete custom task error:', error);
        }
      } catch (err) {
        console.error('[useTasks] Error in deleteCustomTask:', err);
      }
    },
    [state.customTasks, state.household]
  );

  const reassignTaskDay = useCallback(
    async (taskId: string, newDay: string) => {
      const updatedWeekly = state.weeklyTasks.map(t => (t.id === taskId ? { ...t, dayOfWeek: newDay } : t));

      setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));

      try {
        await safeSetItem(WEEKLY_KEY, updatedWeekly);
      } catch (err) {
        console.error('[useTasks] Error in reassignTaskDay:', err);
      }
    },
    [state.weeklyTasks]
  );

  const postponeTaskToFriday = useCallback(
    async (taskId: string) => {
      const updatedWeekly = state.weeklyTasks.map(t => (t.id === taskId ? { ...t, postponed: true } : t));

      setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));

      try {
        await safeSetItem(WEEKLY_KEY, updatedWeekly);
      } catch (err) {
        console.error('[useTasks] Error in postponeTaskToFriday:', err);
      }
    },
    [state.weeklyTasks]
  );

  const toggleMonthlyTask = useCallback(
    async (id: string) => {
      let newCompleted = false;
      const updatedMonthly = state.monthlyTasks.map(task => {
        if (task.id === id) {
          newCompleted = !task.completed;
          return { ...task, completed: newCompleted };
        }
        return task;
      });

      setState(prev => ({ ...prev, monthlyTasks: updatedMonthly }));

      try {
        await safeSetItem(MONTHLY_KEY, updatedMonthly);

        if (state.household && state.session) {
          await pushTaskCompletion(state.household.id, state.session.user.id, id, newCompleted, 'monthly');
        }
      } catch (err) {
        console.error('[useTasks] Error in toggleMonthlyTask:', err);
      }
    },
    [state.monthlyTasks, state.household, state.session]
  );

  const updateWeeklySchedule = useCallback(
    async (updates: { id: string; title: string }[]) => {
      let updatedWeekly = [...state.weeklyTasks];
      updates.forEach(update => {
        updatedWeekly = updatedWeekly.map(t => (t.id === update.id ? { ...t, title: update.title } : t));
      });

      setState(prev => ({ ...prev, weeklyTasks: updatedWeekly }));

      try {
        await safeSetItem(WEEKLY_KEY, updatedWeekly);
      } catch (err) {
        console.error('[useTasks] Error in updateWeeklySchedule:', err);
      }
    },
    [state.weeklyTasks]
  );

  const resetWeeklySchedule = useCallback(async () => {
    const resetWeekly = state.weeklyTasks.map(t => ({ ...t, completed: false, postponed: false }));

    setState(prev => ({ ...prev, weeklyTasks: resetWeekly }));

    try {
      await safeSetItem(WEEKLY_KEY, resetWeekly);

      if (state.household) {
        const weeklyIds = state.weeklyTasks.map(t => t.id);
        const startOfWeek = getStartOfWeekStr();
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('household_id', state.household.id)
          .in('task_id', weeklyIds)
          .gte('completed_at', startOfWeek);
        if (error) console.error('[useTasks] Error resetting weekly tasks on Supabase:', error);
      }
    } catch (err) {
      console.error('[useTasks] Error in resetWeeklySchedule:', err);
    }
  }, [state.weeklyTasks, state.household]);

  const resetMonthlyTasks = useCallback(async () => {
    const resetMonthly = state.monthlyTasks.map(t => ({ ...t, completed: false }));

    setState(prev => ({ ...prev, monthlyTasks: resetMonthly }));

    try {
      await safeSetItem(MONTHLY_KEY, resetMonthly);

      if (state.household) {
        const monthlyIds = state.monthlyTasks.map(t => t.id);
        const startOfMonth = getStartOfMonthStr();
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('household_id', state.household.id)
          .in('task_id', monthlyIds)
          .gte('completed_at', startOfMonth);
        if (error) console.error('[useTasks] Error resetting monthly tasks on Supabase:', error);
      }
    } catch (err) {
      console.error('[useTasks] Error in resetMonthlyTasks:', err);
    }
  }, [state.monthlyTasks, state.household]);

  const resetDailyTasks = useCallback(async () => {
    const updatedDaily = state.dailyTasks.map(t => ({ ...t, completed: false }));

    setState(prev => ({ ...prev, dailyTasks: updatedDaily }));

    try {
      await safeSetItem(DAILY_KEY, updatedDaily);

      if (state.household) {
        const dailyIds = state.dailyTasks.map(t => t.id);
        const today = getTodayStr();
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('household_id', state.household.id)
          .in('task_id', dailyIds)
          .eq('completed_at', today);
        if (error) console.error('[useTasks] Error resetting daily tasks on Supabase:', error);
      }
    } catch (err) {
      console.error('[useTasks] Error in resetDailyTasks:', err);
    }
  }, [state.dailyTasks, state.household]);

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
    resetDailyTasks,
  };
};
