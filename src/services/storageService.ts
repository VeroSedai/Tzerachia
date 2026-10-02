import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Task } from '../types';
import { getTodayStr, isSameWeek, isSameMonth, pruneOldCompletions } from '../utils/dateUtils';

export const DAILY_KEY = '@tzerachia_daily';
export const WEEKLY_KEY = '@tzerachia_weekly';
export const MONTHLY_KEY = '@tzerachia_monthly';
export const CHALLENGES_KEY = '@tzerachia_challenges';
export const LAST_DATE_KEY = '@tzerachia_last_date';
export const CUSTOM_GUIDES_KEY = '@tzerachia_custom_guides';
export const CUSTOM_RECIPES_KEY = '@tzerachia_custom_recipes';
export const CUSTOM_CATEGORIES_KEY = '@tzerachia_custom_categories';
export const NOTIFICATIONS_ENABLED_KEY = '@tzerachia_notifications_enabled';
export const REMINDER_TIME_KEY = '@tzerachia_reminder_time';
export const LANGUAGE_KEY = '@tzerachia_language';
export const CUSTOM_TASKS_KEY = '@tzerachia_custom_tasks';
export const DAILY_COMPLETIONS_BY_DATE_KEY = '@tzerachia_daily_completions_by_date';

const ALL_STORAGE_KEYS = [
  DAILY_KEY,
  WEEKLY_KEY,
  MONTHLY_KEY,
  CHALLENGES_KEY,
  LAST_DATE_KEY,
  CUSTOM_GUIDES_KEY,
  CUSTOM_RECIPES_KEY,
  CUSTOM_CATEGORIES_KEY,
  NOTIFICATIONS_ENABLED_KEY,
  REMINDER_TIME_KEY,
  LANGUAGE_KEY,
  CUSTOM_TASKS_KEY,
  DAILY_COMPLETIONS_BY_DATE_KEY,
];

/**
 * Safely persists a value into AsyncStorage with uniform JSON serialization.
 */
export const safeSetItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`[Storage] Failed to save key "${key}":`, error);
  }
};

/**
 * Safely removes an item from AsyncStorage.
 */
export const safeRemoveItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove key "${key}":`, error);
  }
};

/**
 * Safely clears all AsyncStorage data.
 */
export const safeClear = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('[Storage] Failed to clear storage:', error);
  }
};

/**
 * Parses raw JSON string with fallback to raw string (handles legacy non-JSON storage).
 */
export const safeParse = <T>(str: string | null, fallback: T): T => {
  if (str === null || str === undefined) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    // If str was stored as raw unquoted string (e.g. legacy "09:00" or "it")
    return str as unknown as T;
  }
};

/**
 * Loads all initial state from AsyncStorage in a single native multiGet batch.
 */
export const loadInitialState = async (
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
  defaultState: AppState
) => {
  try {
    // Single native bridge transaction for all keys
    const entries = await AsyncStorage.multiGet(ALL_STORAGE_KEYS);
    const storageMap = new Map<string, string | null>(entries);

    const dailyStr = storageMap.get(DAILY_KEY) ?? null;
    const weeklyStr = storageMap.get(WEEKLY_KEY) ?? null;
    const monthlyStr = storageMap.get(MONTHLY_KEY) ?? null;
    const challengesStr = storageMap.get(CHALLENGES_KEY) ?? null;
    const lastDateStr = safeParse<string>(storageMap.get(LAST_DATE_KEY) ?? null, '');
    const customGuidesStr = storageMap.get(CUSTOM_GUIDES_KEY) ?? null;
    const customRecipesStr = storageMap.get(CUSTOM_RECIPES_KEY) ?? null;
    const customCategoriesStr = storageMap.get(CUSTOM_CATEGORIES_KEY) ?? null;
    const notifEnabledStr = storageMap.get(NOTIFICATIONS_ENABLED_KEY) ?? null;
    const reminderTimeStr = storageMap.get(REMINDER_TIME_KEY) ?? null;
    const languageStr = safeParse<string>(storageMap.get(LANGUAGE_KEY) ?? null, defaultState.language);
    const customTasksStr = storageMap.get(CUSTOM_TASKS_KEY) ?? null;
    const dailyByDateStr = storageMap.get(DAILY_COMPLETIONS_BY_DATE_KEY) ?? null;

    const today = getTodayStr();
    let dailyTasks = safeParse(dailyStr, defaultState.dailyTasks);
    let customTasks = safeParse(customTasksStr, defaultState.customTasks);
    let weeklyTasks = safeParse(weeklyStr, defaultState.weeklyTasks);
    let monthlyTasks = safeParse(monthlyStr, defaultState.monthlyTasks);
    const activeChallenge = safeParse(challengesStr, defaultState.activeChallenge);
    const customGuides = safeParse(customGuidesStr, defaultState.customGuides);
    const customRecipes = safeParse(customRecipesStr, defaultState.customRecipes);
    const customCategories = safeParse(customCategoriesStr, defaultState.customCategories);
    const notificationsEnabled = safeParse(notifEnabledStr, defaultState.notificationsEnabled);
    const reminderTime = safeParse(reminderTimeStr, defaultState.reminderTime);
    const language = languageStr === 'en' || languageStr === 'it' ? languageStr : defaultState.language;
    let dailyTasksCompletionsByDate = safeParse(dailyByDateStr, defaultState.dailyTasksCompletionsByDate || {});

    // Prune old completions (> 30 days) to prevent memory growth
    dailyTasksCompletionsByDate = pruneOldCompletions(dailyTasksCompletionsByDate, 30);
    safeSetItem(DAILY_COMPLETIONS_BY_DATE_KEY, dailyTasksCompletionsByDate).catch(console.error);

    // Auto-Reset logic if last recorded date is not today
    if (lastDateStr !== today) {
      dailyTasks = dailyTasks.map((t: Task) => ({ ...t, completed: false }));

      if (!lastDateStr || !isSameWeek(lastDateStr, today)) {
        weeklyTasks = weeklyTasks.map((t: Task) => ({ ...t, completed: false, postponed: false }));
      }

      if (!lastDateStr || !isSameMonth(lastDateStr, today)) {
        monthlyTasks = monthlyTasks.map((t: Task) => ({ ...t, completed: false }));
      }

      try {
        await AsyncStorage.multiSet([
          [LAST_DATE_KEY, JSON.stringify(today)],
          [DAILY_KEY, JSON.stringify(dailyTasks)],
          [WEEKLY_KEY, JSON.stringify(weeklyTasks)],
          [MONTHLY_KEY, JSON.stringify(monthlyTasks)],
        ]);
      } catch (e) {
        console.error('[Storage] Error during auto-reset multiSet:', e);
      }
    }

    setState({
      session: null,
      household: null,
      lastResetDate: today,
      selectedDate: today,
      dailyTasks,
      dailyTasksCompletionsByDate,
      customTasks,
      weeklyTasks,
      monthlyTasks,
      activeChallenge,
      customGuides,
      customRecipes,
      customCategories,
      notificationsEnabled,
      reminderTime,
      language,
    });
  } catch (error) {
    console.error('[Storage] Load Error in loadInitialState:', error);
  } finally {
    setIsLoaded(true);
  }
};
