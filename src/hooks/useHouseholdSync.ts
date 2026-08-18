import { useEffect } from 'react';
import { AppState, CustomTask } from '../types';
import { supabase } from '../lib/supabase';
import { getTodayStr, getStartOfWeekStr, getStartOfMonthStr, pruneOldCompletions } from '../utils/dateUtils';
import { safeSetItem, DAILY_COMPLETIONS_BY_DATE_KEY } from '../services/storageService';

let activeSubscriptionChannel: any = null;

export const useHouseholdSync = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const fetchHouseholdData = async (householdId: string) => {
    const today = getTodayStr();
    const startOfWeek = getStartOfWeekStr();
    const startOfMonth = getStartOfMonthStr();

    // Fetch completions from 30 days ago to cover 15-day history navigation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [completionsRes, customTasksRes, customGuidesRes, customRecipesRes] = await Promise.all([
      supabase.from('task_completions').select('*').eq('household_id', householdId).gte('completed_at', thirtyDaysAgoStr),
      supabase.from('custom_tasks').select('*').eq('household_id', householdId),
      supabase.from('custom_guides').select('*').eq('household_id', householdId),
      supabase.from('custom_recipes').select('*').eq('household_id', householdId)
    ]);
    
    if (completionsRes.data) {
      const completions = completionsRes.data;

      const todayCompletedIds = completions
        .filter((c: any) => c.completed_at === today)
        .map((c: any) => c.task_id);

      const weekCompletedIds = completions
        .filter((c: any) => c.completed_at >= startOfWeek)
        .map((c: any) => c.task_id);

      const monthCompletedIds = completions
        .filter((c: any) => c.completed_at >= startOfMonth)
        .map((c: any) => c.task_id);

      const completionsByDate: Record<string, string[]> = {};
      completions.forEach((c: any) => {
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
           dailyTasksCompletionsByDate: prunedCompletionsByDate
         };
      });
    }
    
    if (customTasksRes.data) {
       setState(prev => ({ ...prev, customTasks: customTasksRes.data as CustomTask[] }));
    }
    
    if (customGuidesRes.data) {
       setState(prev => ({ ...prev, customGuides: customGuidesRes.data as any[] }));
    }
    
    if (customRecipesRes.data) {
       const mappedRecipes = customRecipesRes.data.map((r: any) => ({
         ...r,
         isCustom: true,
         ingredients: Array.isArray(r.ingredients) ? r.ingredients : (r.ingredients ? [r.ingredients] : []),
         steps: Array.isArray(r.steps) ? r.steps : (typeof r.steps === 'string' ? [r.steps] : [])
       }));
       setState(prev => ({ ...prev, customRecipes: mappedRecipes }));
    }
  };

  const setupRealtimeSubscriptions = (householdId: string) => {
    if (activeSubscriptionChannel) {
      supabase.removeChannel(activeSubscriptionChannel);
      activeSubscriptionChannel = null;
    }
    
    const uniqueChannelName = `household_${householdId}_${Date.now()}`;
    
    activeSubscriptionChannel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `household_id=eq.${householdId}` }, (payload) => {
        const newPayload = payload.new as any;
        const oldPayload = payload.old as any;
        const taskId = newPayload?.task_id || oldPayload?.task_id;
        const completedAt = newPayload?.completed_at || oldPayload?.completed_at;
        const isCompleted = payload.eventType === 'INSERT' || payload.eventType === 'UPDATE';
        
        if (taskId) {
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
                 updatedDaily = prev.dailyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
               }
             }

             if (isWeeklyTarget) {
               if (!completedAt || completedAt >= startOfWeek) {
                 updatedWeekly = prev.weeklyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
               }
             }
             if (isMonthlyTarget) {
               if (!completedAt || completedAt >= startOfMonth) {
                 updatedMonthly = prev.monthlyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
               }
             }

             return { 
               ...prev, 
               dailyTasks: updatedDaily, 
               weeklyTasks: updatedWeekly, 
               monthlyTasks: updatedMonthly,
               dailyTasksCompletionsByDate: updatedCompletionsByDate
             };
           });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_tasks', filter: `household_id=eq.${householdId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, customTasks: [...prev.customTasks.filter(t => t.id !== payload.new.id), payload.new as CustomTask] }));
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => ({ ...prev, customTasks: prev.customTasks.map(t => t.id === payload.new.id ? payload.new as CustomTask : t) }));
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({ ...prev, customTasks: prev.customTasks.filter(t => t.id !== payload.old.id) }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_guides', filter: `household_id=eq.${householdId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, customGuides: [...prev.customGuides.filter(t => t.id !== payload.new.id), payload.new as any] }));
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => ({ ...prev, customGuides: prev.customGuides.map(t => t.id === payload.new.id ? payload.new as any : t) }));
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({ ...prev, customGuides: prev.customGuides.filter(t => t.id !== payload.old.id) }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_recipes', filter: `household_id=eq.${householdId}` }, (payload) => {
        const formatRecipe = (r: any) => ({
          ...r,
          isCustom: true,
          ingredients: Array.isArray(r.ingredients) ? r.ingredients : (r.ingredients ? [r.ingredients] : []),
          steps: Array.isArray(r.steps) ? r.steps : (typeof r.steps === 'string' ? [r.steps] : [])
        });
        if (payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, customRecipes: [...prev.customRecipes.filter(t => t.id !== payload.new.id), formatRecipe(payload.new)] }));
        } else if (payload.eventType === 'UPDATE') {
          setState(prev => ({ ...prev, customRecipes: prev.customRecipes.map(t => t.id === payload.new.id ? formatRecipe(payload.new) : t) }));
        } else if (payload.eventType === 'DELETE') {
          setState(prev => ({ ...prev, customRecipes: prev.customRecipes.filter(t => t.id !== payload.old.id) }));
        }
      });
      
    activeSubscriptionChannel.subscribe();
  };

  const fetchHousehold = async (userId: string) => {
    const { data } = await supabase
      .from('household_members')
      .select('household_id, households(id, name, invite_code)')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (data && data.households) {
      const hh = Array.isArray(data.households) ? data.households[0] : data.households;
      setState(prev => ({ ...prev, household: hh as any }));
      fetchHouseholdData(hh.id);
      setupRealtimeSubscriptions(hh.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        } else {
          setState(prev => ({ ...prev, session }));
          fetchHousehold(session.user.id);
        }
      } catch (err) {
        console.warn('Supabase auth bypass on boot:', err);
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
      if (activeSubscriptionChannel) {
        supabase.removeChannel(activeSubscriptionChannel);
      }
    };
  }, []);

  return { fetchHousehold };
};
