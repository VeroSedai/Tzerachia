import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';
import { AppState, CustomTask, Recipe, Guide } from '../types';
import { supabase } from '../lib/supabase';
import {
  getTodayStr,
  getStartOfWeekStr,
  getStartOfMonthStr,
  pruneOldCompletions,
} from '../utils/dateUtils';
import { safeSetItem, DAILY_COMPLETIONS_BY_DATE_KEY } from '../services/storageService';

interface DBCompletion {
  id: string;
  household_id: string;
  task_id: string;
  completed_at: string;
  completed_by?: string;
}

interface DBRecipe {
  id: string;
  household_id?: string;
  title: string;
  category?: string;
  ingredients?: string[] | string;
  steps?: string[] | string;
  created_by?: string;
}

interface DBGuide {
  id: string;
  household_id?: string;
  title: string;
  category?: string;
  content?: string;
  duration?: string;
  steps?: any;
  created_by?: string;
}

export const useHouseholdSync = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  // Use React ref instead of module-level singleton to avoid memory leaks
  const activeSubscriptionChannelRef = useRef<RealtimeChannel | null>(null);

  const fetchHouseholdData = useCallback(async (householdId: string): Promise<void> => {
    try {
      const today = getTodayStr();
      const startOfWeek = getStartOfWeekStr();
      const startOfMonth = getStartOfMonthStr();
      const thirtyDaysAgoStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const [completionsRes, customTasksRes, customGuidesRes, customRecipesRes] = await Promise.all([
        supabase
          .from('task_completions')
          .select('*')
          .eq('household_id', householdId)
          .gte('completed_at', thirtyDaysAgoStr),
        supabase.from('custom_tasks').select('*').eq('household_id', householdId),
        supabase.from('custom_guides').select('*').eq('household_id', householdId),
        supabase.from('custom_recipes').select('*').eq('household_id', householdId),
      ]);

      if (completionsRes.error) {
        console.error('[useHouseholdSync] Error fetching task completions:', completionsRes.error);
      } else if (completionsRes.data) {
        const completions = completionsRes.data as DBCompletion[];

        const todayCompletedIds = completions
          .filter(c => c.completed_at === today)
          .map(c => c.task_id);

        const weekCompletedIds = completions
          .filter(c => c.completed_at >= startOfWeek)
          .map(c => c.task_id);

        const monthCompletedIds = completions
          .filter(c => c.completed_at >= startOfMonth)
          .map(c => c.task_id);

        const completionsByDate: Record<string, string[]> = {};
        completions.forEach(c => {
          if (!c.completed_at || !c.task_id) return;
          if (!completionsByDate[c.completed_at]) {
            completionsByDate[c.completed_at] = [];
          }
          if (!completionsByDate[c.completed_at].includes(c.task_id)) {
            completionsByDate[c.completed_at].push(c.task_id);
          }
        });

        const prunedCompletionsByDate = pruneOldCompletions(completionsByDate, 30);
        safeSetItem(DAILY_COMPLETIONS_BY_DATE_KEY, prunedCompletionsByDate).catch(console.error);

        setState(prev => {
          const updatedDaily = prev.dailyTasks.map(t => ({ ...t, completed: todayCompletedIds.includes(t.id) }));
          const updatedWeekly = prev.weeklyTasks.map(t => ({ ...t, completed: weekCompletedIds.includes(t.id) }));
          const updatedMonthly = prev.monthlyTasks.map(t => ({ ...t, completed: monthCompletedIds.includes(t.id) }));
          return {
            ...prev,
            dailyTasks: updatedDaily,
            weeklyTasks: updatedWeekly,
            monthlyTasks: updatedMonthly,
            dailyTasksCompletionsByDate: prunedCompletionsByDate,
          };
        });
      }

      if (customTasksRes.error) {
        console.error('[useHouseholdSync] Error fetching custom tasks:', customTasksRes.error);
      } else if (customTasksRes.data) {
        setState(prev => ({ ...prev, customTasks: customTasksRes.data as CustomTask[] }));
      }

      if (customGuidesRes.error) {
        console.error('[useHouseholdSync] Error fetching custom guides:', customGuidesRes.error);
      } else if (customGuidesRes.data) {
        setState(prev => ({ ...prev, customGuides: customGuidesRes.data as Guide[] }));
      }

      if (customRecipesRes.error) {
        console.error('[useHouseholdSync] Error fetching custom recipes:', customRecipesRes.error);
      } else if (customRecipesRes.data) {
        const mappedRecipes: Recipe[] = (customRecipesRes.data as DBRecipe[]).map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          ingredients: Array.isArray(r.ingredients)
            ? r.ingredients
            : r.ingredients
            ? [r.ingredients]
            : [],
        }));
        setState(prev => ({ ...prev, customRecipes: mappedRecipes }));
      }
    } catch (err) {
      console.error('[useHouseholdSync] Unexpected exception in fetchHouseholdData:', err);
    }
  }, [setState]);

  const setupRealtimeSubscriptions = useCallback((householdId: string) => {
    if (activeSubscriptionChannelRef.current) {
      supabase.removeChannel(activeSubscriptionChannelRef.current);
      activeSubscriptionChannelRef.current = null;
    }

    const uniqueChannelName = `household_${householdId}_${Date.now()}`;

    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completions', filter: `household_id=eq.${householdId}` },
        payload => {
          const newPayload = payload.new as DBCompletion | null;
          const oldPayload = payload.old as Partial<DBCompletion> | null;
          const taskId = newPayload?.task_id || oldPayload?.task_id;
          const completedAt = newPayload?.completed_at || oldPayload?.completed_at;
          const isCompleted = payload.eventType === 'INSERT' || payload.eventType === 'UPDATE';

          // If on DELETE the payload does not contain task_id (default Postgres REPLICA IDENTITY), re-fetch
          if (!taskId) {
            fetchHouseholdData(householdId);
            return;
          }

          const today = getTodayStr();
          const startOfWeek = getStartOfWeekStr();
          const startOfMonth = getStartOfMonthStr();

          setState(prev => {
            const isDailyTarget = prev.dailyTasks.some(t => t.id === taskId);
            const isWeeklyTarget = prev.weeklyTasks.some(t => t.id === taskId);
            const isMonthlyTarget = prev.monthlyTasks.some(t => t.id === taskId);

            let updatedDaily = prev.dailyTasks;
            let updatedWeekly = prev.weeklyTasks;
            let updatedMonthly = prev.monthlyTasks;
            let updatedCompletionsByDate = { ...(prev.dailyTasksCompletionsByDate || {}) };

            if (isDailyTarget && completedAt) {
              const dateCompletions = updatedCompletionsByDate[completedAt] || [];
              if (isCompleted) {
                updatedCompletionsByDate[completedAt] = [...dateCompletions.filter(id => id !== taskId), taskId];
              } else {
                updatedCompletionsByDate[completedAt] = dateCompletions.filter(id => id !== taskId);
              }
              updatedCompletionsByDate = pruneOldCompletions(updatedCompletionsByDate, 30);
              safeSetItem(DAILY_COMPLETIONS_BY_DATE_KEY, updatedCompletionsByDate).catch(console.error);

              if (completedAt === today) {
                updatedDaily = prev.dailyTasks.map(t => (t.id === taskId ? { ...t, completed: isCompleted } : t));
              }
            }

            if (isWeeklyTarget) {
              if (!completedAt || completedAt >= startOfWeek) {
                updatedWeekly = prev.weeklyTasks.map(t => (t.id === taskId ? { ...t, completed: isCompleted } : t));
              }
            }
            if (isMonthlyTarget) {
              if (!completedAt || completedAt >= startOfMonth) {
                updatedMonthly = prev.monthlyTasks.map(t => (t.id === taskId ? { ...t, completed: isCompleted } : t));
              }
            }

            return {
              ...prev,
              dailyTasks: updatedDaily,
              weeklyTasks: updatedWeekly,
              monthlyTasks: updatedMonthly,
              dailyTasksCompletionsByDate: updatedCompletionsByDate,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_tasks', filter: `household_id=eq.${householdId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              customTasks: [...prev.customTasks.filter(t => t.id !== (payload.new as CustomTask).id), payload.new as CustomTask],
            }));
          } else if (payload.eventType === 'UPDATE') {
            setState(prev => ({
              ...prev,
              customTasks: prev.customTasks.map(t => (t.id === (payload.new as CustomTask).id ? (payload.new as CustomTask) : t)),
            }));
          } else if (payload.eventType === 'DELETE') {
            setState(prev => ({
              ...prev,
              customTasks: prev.customTasks.filter(t => t.id !== (payload.old as { id: string }).id),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_guides', filter: `household_id=eq.${householdId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              customGuides: [...prev.customGuides.filter(t => t.id !== (payload.new as Guide).id), payload.new as Guide],
            }));
          } else if (payload.eventType === 'UPDATE') {
            setState(prev => ({
              ...prev,
              customGuides: prev.customGuides.map(t => (t.id === (payload.new as Guide).id ? (payload.new as Guide) : t)),
            }));
          } else if (payload.eventType === 'DELETE') {
            setState(prev => ({
              ...prev,
              customGuides: prev.customGuides.filter(t => t.id !== (payload.old as { id: string }).id),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_recipes', filter: `household_id=eq.${householdId}` },
        payload => {
          const formatRecipe = (r: DBRecipe): Recipe => ({
            id: r.id,
            title: r.title,
            category: r.category,
            ingredients: Array.isArray(r.ingredients)
              ? r.ingredients
              : r.ingredients
              ? [r.ingredients]
              : [],
          });

          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              customRecipes: [
                ...prev.customRecipes.filter(t => t.id !== (payload.new as DBRecipe).id),
                formatRecipe(payload.new as DBRecipe),
              ],
            }));
          } else if (payload.eventType === 'UPDATE') {
            setState(prev => ({
              ...prev,
              customRecipes: prev.customRecipes.map(t =>
                t.id === (payload.new as DBRecipe).id ? formatRecipe(payload.new as DBRecipe) : t
              ),
            }));
          } else if (payload.eventType === 'DELETE') {
            setState(prev => ({
              ...prev,
              customRecipes: prev.customRecipes.filter(t => t.id !== (payload.old as { id: string }).id),
            }));
          }
        }
      );

    channel.subscribe();
    activeSubscriptionChannelRef.current = channel;
  }, [fetchHouseholdData, setState]);

  const fetchHousehold = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, households(id, name, invite_code)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[useHouseholdSync] Error fetching household members:', error);
        return;
      }

      if (data && data.length > 0) {
        const memberRecord = data[0];
        let hh: any = memberRecord.households;
        if (Array.isArray(hh)) hh = hh[0];

        if (!hh && memberRecord.household_id) {
          const { data: hhData } = await supabase
            .from('households')
            .select('id, name, invite_code')
            .eq('id', memberRecord.household_id)
            .maybeSingle();
          if (hhData) hh = hhData;
        }

        if (hh) {
          setState(prev => ({ ...prev, household: hh }));
          await fetchHouseholdData(hh.id);
          setupRealtimeSubscriptions(hh.id);
        }
      }
    } catch (e) {
      console.error('[useHouseholdSync] Exception in fetchHousehold:', e);
    }
  }, [fetchHouseholdData, setupRealtimeSubscriptions, setState]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: anonData, error } = await supabase.auth.signInAnonymously();
          if (anonData?.session) {
            setState(prev => ({ ...prev, session: anonData.session }));
            await fetchHousehold(anonData.session.user.id);
          } else if (error) {
            console.warn('[useHouseholdSync] signInAnonymously error:', error);
          }
        } else {
          setState(prev => ({ ...prev, session }));
          await fetchHousehold(session.user.id);
        }
      } catch (err) {
        console.warn('[useHouseholdSync] Supabase auth bypass on boot:', err);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session }));
      if (session) {
        fetchHousehold(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (activeSubscriptionChannelRef.current) {
        supabase.removeChannel(activeSubscriptionChannelRef.current);
        activeSubscriptionChannelRef.current = null;
      }
    };
  }, [fetchHousehold, setState]);

  return { fetchHousehold };
};
