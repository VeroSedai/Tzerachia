import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Task } from '../types';

export const DAILY_KEY = '@simplyclean_daily';
export const WEEKLY_KEY = '@simplyclean_weekly';
export const MONTHLY_KEY = '@simplyclean_monthly';
export const CHALLENGES_KEY = '@simplyclean_challenges';
export const LAST_DATE_KEY = '@simplyclean_last_date';
export const CUSTOM_GUIDES_KEY = '@simplyclean_custom_guides';
export const CUSTOM_RECIPES_KEY = '@simplyclean_custom_recipes';
export const CUSTOM_CATEGORIES_KEY = '@simplyclean_custom_categories';
export const NOTIFICATIONS_ENABLED_KEY = '@simplyclean_notifications_enabled';
export const REMINDER_TIME_KEY = '@simplyclean_reminder_time';
export const LANGUAGE_KEY = '@simplyclean_language';
export const CUSTOM_TASKS_KEY = '@simplyclean_custom_tasks';

export const safeSetItem = async (key: string, value: any) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`AsyncStorage Save Error for key ${key}:`, error);
  }
};

export const safeRemoveItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`AsyncStorage Remove Error for key ${key}:`, error);
  }
};

export const safeClear = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("AsyncStorage Clear Error:", error);
  }
};

export const loadInitialState = async (
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
  defaultState: AppState
) => {
  try {
    const [dailyStr, weeklyStr, monthlyStr, challengesStr, lastDateStr, customGuidesStr, customRecipesStr, customCategoriesStr, notifEnabledStr, reminderTimeStr, languageStr, customTasksStr] = await Promise.all([
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
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(CUSTOM_TASKS_KEY)
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
    let customTasks = safeParse(customTasksStr, defaultState.customTasks);
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
      session: null,
      household: null,
      lastResetDate: today,
      dailyTasks,
      customTasks,
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
