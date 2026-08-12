export type TaskType = 'daily' | 'weekly' | 'catch-all' | 'monthly';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: TaskType;
  dayOfWeek?: string;
  postponed?: boolean;
}

export interface CustomTask {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  isCustom: true;
}

export interface WeeklySchedule {
  [day: string]: string; // e.g. "Monday" -> "Bagni"
}

export type ChallengeStatus = 'inactive' | 'active' | 'completed';

export interface ChallengeSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ChallengeTask {
  id: string;
  title: string;
  subtasks: ChallengeSubtask[];
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  currentDay: number;
  status: ChallengeStatus;
  tasks?: ChallengeTask[];
}

export interface Recipe {
  id: string;
  title: string;
  category?: string;
  ingredients: string[];
}

export interface GuideStep {
  step: number;
  description: string;
}

export interface Guide {
  id: string;
  title: string;
  category?: string;
  duration?: string;
  steps: GuideStep[];
}

export interface AppState {
  lastResetDate: string; // YYYY-MM-DD
  dailyTasks: Task[];
  customTasks: CustomTask[];
  weeklyTasks: Task[];
  monthlyTasks: Task[];
  activeChallenge: Challenge | null;
  timerDuration: number;
  timerActive: boolean;
  customGuides: Guide[];
  customRecipes: Recipe[];
  customCategories: string[];
  notificationsEnabled: boolean;
  reminderTime: string; // HH:mm format
  language: 'it' | 'en';
}

export type RootStackParamList = {
  MainTabs: undefined;
  GuidesList: undefined;
  GuideDetail: { item: Recipe | Guide; type: 'recipe' | 'guide' };
  AddGuide: undefined;
  ChallengesList: undefined;
  ChallengeDetail: { challengeId: string };
  Settings: undefined;
  EditSchedule: undefined;
};

