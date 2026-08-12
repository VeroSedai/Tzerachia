import { useEffect } from 'react';
import { AppState, CustomTask } from '../types';
import { supabase } from '../lib/supabase';

let activeSubscriptionChannel: any = null;
let activeSubscriptionHouseholdId: string | null = null;

export const useHouseholdSync = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const fetchHouseholdData = async (householdId: string) => {
    const [completionsRes, customTasksRes, customGuidesRes, customRecipesRes] = await Promise.all([
      supabase.from('task_completions').select('*').eq('household_id', householdId),
      supabase.from('custom_tasks').select('*').eq('household_id', householdId),
      supabase.from('custom_guides').select('*').eq('household_id', householdId),
      supabase.from('custom_recipes').select('*').eq('household_id', householdId)
    ]);
    
    if (completionsRes.data) {
      const completedIds = completionsRes.data.map((c: any) => c.task_id);
      setState(prev => {
         const updatedDaily = prev.dailyTasks.map(t => ({ ...t, completed: completedIds.includes(t.id) }));
         const updatedWeekly = prev.weeklyTasks.map(t => ({ ...t, completed: completedIds.includes(t.id) }));
         const updatedMonthly = prev.monthlyTasks.map(t => ({ ...t, completed: completedIds.includes(t.id) }));
         return { ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly, monthlyTasks: updatedMonthly };
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
    
    // Use a unique channel name (append timestamp) to avoid collisions if removeChannel hasn't finished asynchronously
    const uniqueChannelName = `household_${householdId}_${Date.now()}`;
    
    activeSubscriptionChannel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `household_id=eq.${householdId}` }, (payload) => {
        const newPayload = payload.new as any;
        const oldPayload = payload.old as any;
        const taskId = newPayload?.task_id || oldPayload?.task_id;
        const isCompleted = payload.eventType === 'INSERT' || payload.eventType === 'UPDATE';
        if (taskId) {
           setState(prev => {
             const updatedDaily = prev.dailyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
             const updatedWeekly = prev.weeklyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
             const updatedMonthly = prev.monthlyTasks.map(t => t.id === taskId ? { ...t, completed: isCompleted } : t);
             return { ...prev, dailyTasks: updatedDaily, weeklyTasks: updatedWeekly, monthlyTasks: updatedMonthly };
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
    const { data, error } = await supabase
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
