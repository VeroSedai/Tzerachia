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
