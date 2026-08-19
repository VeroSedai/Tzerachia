import * as Linking from 'expo-linking';
import { AppState } from '../types';

export interface SyncPayload {
  d: string[];
  w: string[];
  m: string[];
}

export const exportAppStatePayload = (state: AppState): string => {
  const payload: SyncPayload = {
    d: state.dailyTasks.filter(t => t.completed).map(t => t.id),
    w: state.weeklyTasks.filter(t => t.completed).map(t => t.id),
    m: state.monthlyTasks.filter(t => t.completed).map(t => t.id),
  };
  
  const jsonString = JSON.stringify(payload);
  return encodeURIComponent(jsonString); // URL safe and compact enough
};

export const importAppStatePayload = (encodedPayload: string): SyncPayload | null => {
  try {
    const jsonString = decodeURIComponent(encodedPayload);
    const payload = JSON.parse(jsonString) as SyncPayload;
    if (Array.isArray(payload.d) && Array.isArray(payload.w) && Array.isArray(payload.m)) {
      return payload;
    }
    return null;
  } catch (e) {
    console.error("Failed to parse sync payload", e);
    return null;
  }
};

export const shareToTelegram = (state: AppState, language: 'it' | 'en') => {
  const encoded = exportAppStatePayload(state);
  const syncUrl = `tzerachia://sync?data=${encoded}`;
  
  const summary = language === 'it' 
    ? `Tzerachìa Sync\n\nHo completato alcune attività in casa! Clicca il link per sincronizzare la nostra app:`
    : `Tzerachìa Sync\n\nI completed some chores! Click the link to sync our app:`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(syncUrl)}&text=${encodeURIComponent(summary)}`;
  
  Linking.openURL(telegramUrl).catch(() => {
    // Fallback if telegram is not installed
    console.error("Could not open Telegram");
  });
};
