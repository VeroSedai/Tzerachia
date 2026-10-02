import { useCallback } from 'react';
import { AppState } from '../types';
import { challengeData } from '../data/guidesAndRecipes';
import { safeSetItem, CHALLENGES_KEY } from '../services/storageService';

export const useChallenges = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const startChallenge = useCallback(
    async (challengeId: '7-day' | '28-day') => {
      const activeChallenge = {
        id: challengeId,
        title: challengeId === '7-day' ? '7-Day Quick Start' : '28-Day Challenge',
        durationDays: challengeId === '7-day' ? 7 : 28,
        currentDay: 1,
        status: 'active' as const,
        tasks: challengeData(1),
      };

      // Pure React state update
      setState(prev => ({ ...prev, activeChallenge }));

      // Side-effects outside setState
      try {
        await safeSetItem(CHALLENGES_KEY, activeChallenge);
      } catch (err) {
        console.error('[useChallenges] Error in startChallenge:', err);
      }
    },
    []
  );

  const advanceChallengeDay = useCallback(async () => {
    if (!state.activeChallenge) return;
    const isCompleted = state.activeChallenge.currentDay >= state.activeChallenge.durationDays;
    const nextDay = isCompleted ? state.activeChallenge.durationDays : state.activeChallenge.currentDay + 1;
    const updatedChallenge = {
      ...state.activeChallenge,
      currentDay: nextDay,
      status: isCompleted ? ('completed' as const) : ('active' as const),
      tasks: challengeData(nextDay),
    };

    // Pure React state update
    setState(prev => ({ ...prev, activeChallenge: updatedChallenge }));

    // Side-effects outside setState
    try {
      await safeSetItem(CHALLENGES_KEY, updatedChallenge);
    } catch (err) {
      console.error('[useChallenges] Error in advanceChallengeDay:', err);
    }
  }, [state.activeChallenge]);

  const resetActiveChallenge = useCallback(async () => {
    if (!state.activeChallenge) return;
    const resetChallenge = {
      ...state.activeChallenge,
      currentDay: 1,
      status: 'active' as const,
      tasks: challengeData(1),
    };

    // Pure React state update
    setState(prev => ({ ...prev, activeChallenge: resetChallenge }));

    // Side-effects outside setState
    try {
      await safeSetItem(CHALLENGES_KEY, resetChallenge);
    } catch (err) {
      console.error('[useChallenges] Error in resetActiveChallenge:', err);
    }
  }, [state.activeChallenge]);

  const toggleChallengeSubtask = useCallback(
    async (subtaskId: string) => {
      if (!state.activeChallenge || !state.activeChallenge.tasks) return;
      const updatedTasks = state.activeChallenge.tasks.map(task => ({
        ...task,
        subtasks: task.subtasks.map(st => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
      }));
      const updatedChallenge = { ...state.activeChallenge, tasks: updatedTasks };

      // Pure React state update
      setState(prev => ({ ...prev, activeChallenge: updatedChallenge }));

      // Side-effects outside setState
      try {
        await safeSetItem(CHALLENGES_KEY, updatedChallenge);
      } catch (err) {
        console.error('[useChallenges] Error in toggleChallengeSubtask:', err);
      }
    },
    [state.activeChallenge]
  );

  return {
    startChallenge,
    advanceChallengeDay,
    resetActiveChallenge,
    toggleChallengeSubtask,
  };
};
