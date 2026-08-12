import { useCallback } from 'react';
import { AppState } from '../types';
import { challengeData } from '../data/guidesAndRecipes';
import { safeSetItem, CHALLENGES_KEY } from '../services/storageService';

export const useChallenges = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {

  const startChallenge = useCallback(async (challengeId: '7-day' | '28-day') => {
    const activeChallenge = {
      id: challengeId,
      title: challengeId === '7-day' ? '7-Day Quick Start' : '28-Day Challenge',
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

  return {
    startChallenge,
    advanceChallengeDay,
    resetActiveChallenge,
    toggleChallengeSubtask
  };
};
