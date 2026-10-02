import {
  format,
  startOfWeek,
  startOfMonth,
  subDays,
  isSameWeek as dateFnsIsSameWeek,
  isSameMonth as dateFnsIsSameMonth,
  parseISO,
} from 'date-fns';
import { it as itLocale, enUS as enLocale } from 'date-fns/locale';

const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Parses a date input (string or Date) into a valid Date object.
 */
const toDate = (input: string | Date): Date => {
  return typeof input === 'string' ? parseISO(input) : input;
};

/**
 * Returns today's date in YYYY-MM-dd format using local device time.
 */
export const getTodayStr = (): string => {
  return format(new Date(), DATE_FORMAT);
};

/**
 * Returns the Monday of the week for the given date in YYYY-MM-dd format.
 */
export const getStartOfWeekStr = (date: Date | string = new Date()): string => {
  const d = toDate(date);
  return format(startOfWeek(d, { weekStartsOn: 1 }), DATE_FORMAT);
};

/**
 * Returns the first day of the month for the given date in YYYY-MM-dd format.
 */
export const getStartOfMonthStr = (date: Date | string = new Date()): string => {
  const d = toDate(date);
  return format(startOfMonth(d), DATE_FORMAT);
};

/**
 * Checks whether two date strings belong to the same week (starting on Monday).
 */
export const isSameWeek = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return dateFnsIsSameWeek(toDate(dateStr1), toDate(dateStr2), { weekStartsOn: 1 });
};

/**
 * Checks whether two date strings belong to the same month and year.
 */
export const isSameMonth = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return dateFnsIsSameMonth(toDate(dateStr1), toDate(dateStr2));
};

/**
 * Returns an array of the last N days (including today) formatted as YYYY-MM-dd.
 */
export const getLastNDays = (n: number = 15): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    dates.push(format(subDays(today, i), DATE_FORMAT));
  }
  return dates;
};

/**
 * Formats a date string for the 15-day history horizontal picker.
 */
export const formatDateForPicker = (
  dateStr: string,
  language: 'it' | 'en'
): { label: string; sublabel: string } => {
  const todayStr = getTodayStr();
  const yesterdayStr = format(subDays(new Date(), 1), DATE_FORMAT);
  const locale = language === 'it' ? itLocale : enLocale;
  const dateObj = toDate(dateStr);

  const sublabel = format(dateObj, 'd MMM', { locale });

  if (dateStr === todayStr) {
    return {
      label: language === 'it' ? 'Oggi' : 'Today',
      sublabel,
    };
  }

  if (dateStr === yesterdayStr) {
    return {
      label: language === 'it' ? 'Ieri' : 'Yesterday',
      sublabel,
    };
  }

  const rawDayName = format(dateObj, 'EEE', { locale });
  const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);

  return {
    label: dayName,
    sublabel,
  };
};

/**
 * Formats a date string (YYYY-MM-dd) into a full uppercase display string (e.g. "LUNEDÌ 2 OTTOBRE").
 */
export const formatDisplayDate = (dateStr: string, language: 'it' | 'en'): string => {
  const locale = language === 'it' ? itLocale : enLocale;
  const dateObj = toDate(dateStr);
  return format(dateObj, 'EEEE d MMMM', { locale }).toUpperCase();
};

/**
 * Returns today's weekday name in the specified language (e.g. "lunedì" or "monday").
 */
export const getTodayWeekdayName = (language: 'it' | 'en'): string => {
  const locale = language === 'it' ? itLocale : enLocale;
  return format(new Date(), 'EEEE', { locale });
};

/**
 * Prunes task completions older than maxDays (default 30 days) to prevent unbounded storage growth.
 */
export const pruneOldCompletions = (
  completionsByDate: Record<string, string[]>,
  maxDays: number = 30
): Record<string, string[]> => {
  const cutoffStr = format(subDays(new Date(), maxDays), DATE_FORMAT);
  const pruned: Record<string, string[]> = {};

  for (const [dateKey, taskIds] of Object.entries(completionsByDate)) {
    if (dateKey >= cutoffStr) {
      pruned[dateKey] = taskIds;
    }
  }
  return pruned;
};


