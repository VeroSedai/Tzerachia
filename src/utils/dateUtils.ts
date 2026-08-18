export const getTodayStr = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getStartOfWeekStr = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const getStartOfMonthStr = (date: Date = new Date()): string => {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
};

export const isSameWeek = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return getStartOfWeekStr(new Date(dateStr1)) === getStartOfWeekStr(new Date(dateStr2));
};

export const isSameMonth = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  return dateStr1.substring(0, 7) === dateStr2.substring(0, 7);
};

export const getLastNDays = (n: number = 15): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const formatDateForPicker = (dateStr: string, language: 'it' | 'en'): { label: string; sublabel: string } => {
  const todayStr = getTodayStr();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dateObj = new Date(dateStr + 'T00:00:00');
  
  const dayNum = dateObj.getDate().toString();
  const monthFormatter = new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', { month: 'short' });
  const weekdayFormatter = new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' });

  const monthName = monthFormatter.format(dateObj);
  const weekdayName = weekdayFormatter.format(dateObj);

  if (dateStr === todayStr) {
    return {
      label: language === 'it' ? 'Oggi' : 'Today',
      sublabel: `${dayNum} ${monthName}`
    };
  }

  if (dateStr === yesterdayStr) {
    return {
      label: language === 'it' ? 'Ieri' : 'Yesterday',
      sublabel: `${dayNum} ${monthName}`
    };
  }

  return {
    label: weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1, 3),
    sublabel: `${dayNum} ${monthName}`
  };
};

export const pruneOldCompletions = (
  completionsByDate: Record<string, string[]>,
  maxDays: number = 30
): Record<string, string[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const pruned: Record<string, string[]> = {};
  for (const [dateKey, taskIds] of Object.entries(completionsByDate)) {
    if (dateKey >= cutoffStr) {
      pruned[dateKey] = taskIds;
    }
  }
  return pruned;
};
