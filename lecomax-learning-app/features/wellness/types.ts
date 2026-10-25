export type Copy = { fr: string; en: string; ar: string };
export type Locale = keyof Copy;
export type Goal =
  | 'health'
  | 'energy'
  | 'focus'
  | 'memory'
  | 'food'
  | 'movement'
  | 'sleep'
  | 'calm'
  | 'discipline'
  | 'learn';
export type Interest =
  | 'habits'
  | 'nutrition'
  | 'sleep'
  | 'productivity'
  | 'memory'
  | 'technology'
  | 'growth'
  | 'knowledge';
export interface UserPreferences {
  goals: Goal[];
  wakeTime: string;
  sleepTime: string;
  activity: 'gentle' | 'moderate' | 'active';
  diet: 'balanced' | 'vegetarian' | 'vegan';
  exerciseMinutes: number;
  interests: Interest[];
  onboarded: boolean;
}
export type TaskId =
  | 'water'
  | 'fruit'
  | 'vegetables'
  | 'move'
  | 'brain'
  | 'learn'
  | 'mindful'
  | 'meal'
  | 'reflect'
  | 'sleep';
export interface DailyTask {
  id: TaskId;
  title: Copy;
  section: 'morning' | 'body' | 'mind' | 'food' | 'evening';
}
export interface LearningLesson {
  id: string;
  category: Interest;
  title: Copy;
  body: Copy;
  practice: Copy;
}
export interface BrainExercise {
  id: string;
  title: Copy;
  instruction: Copy;
  answer?: Copy;
}
export interface Meal {
  id: string;
  title: Copy;
  vegan: boolean;
  vegetarian: boolean;
}
export interface DailyPlan {
  date: string;
  brain: string;
  lesson: string;
  meals: string[];
  mindfulness: number;
  movement: number;
  sleepTip: number;
  motivation: number;
  minutes: number;
  wakeTime: string;
  sleepTime: string;
}
export interface DailyCheckIn {
  mood?: number;
  energy?: number;
  focus?: number;
  sleep?: number;
  stress?: number;
  note: string;
}
export interface HabitCompletion {
  date: string;
  compass?: { priority: string; focused: boolean; connected: boolean };
  dailyMoment?: { completed: boolean; gratitude: string };
  tasks: Partial<Record<TaskId, boolean>>;
  checkIn?: DailyCheckIn;
  plan: DailyPlan;
}
export type ReminderId = 'morning' | 'brain' | 'meal' | 'learn' | 'movement' | 'evening' | 'bedtime';
export interface NotificationPreferences {
  quietStart?: string;
  quietEnd?: string;
  enabled: boolean;
  sound: boolean;
  categories: Record<ReminderId, { enabled: boolean; time: string }>;
}
export interface StreakData {
  current: number;
  longest: number;
  completedDays: number;
}
export interface ProgressStats extends StreakData {
  completion: number;
  mood: number | null;
  sleep: number | null;
  focus: number | null;
  water: number;
  learning: number;
  brain: number;
  active: number;
  healthy: number;
}
export interface JourneyState {
  life?: import('./life-model').LifeState;
  version: 1;
  startDate: string;
  preferences: UserPreferences;
  notifications: NotificationPreferences;
  days: Record<string, HabitCompletion>;
  achievements: string[];
}
