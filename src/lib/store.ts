import { useState, useEffect } from "react";

// Types
export type Mood = "😊" | "😌" | "🌸" | "💭" | "🌙" | "✨" | "💪" | "🥺" | "😴" | "🌈";
export type VisitMood = "😊" | "😔" | "😌" | "😟" | "😴" | "💗" | "😤";
export type TargetState = "starting" | "in-progress" | "feels-good" | "resting";
export type WritingMode = "dream" | "thought";
export type CurrentNeed = "rest" | "motivation" | "space" | "support" | "silence" | "gentle-reminders";

export interface Dream {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
  targets: Target[];
}

export interface Target {
  id: string;
  dreamId: string;
  text: string;
  state: TargetState;
  shared: boolean;
}

export interface Thought {
  id: string;
  content: string;
  mood: Mood;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id: string;
  content: string;
  unlockDate: string;
  shared: boolean;
  sealed: boolean;
  createdAt: string;
}

export interface SelfCareItem {
  id: string;
  label: string;
  category: "water" | "skincare" | "rest" | "period";
  checked: boolean;
  date: string;
}

export interface MoodEntry {
  mood: VisitMood;
  date: string;
  shared: boolean;
}

export interface Identity {
  name: string;
  phone: string;
  partnerName: string;
  partnerPhone: string;
}

export interface Settings {
  globalSharing: boolean;
  showWater: boolean;
  showSkincare: boolean;
  showRest: boolean;
  showPeriod: boolean;
  hideEverything: boolean;
  periodStartDate: string;
  currentNeed: CurrentNeed;
  identity: Identity;
  waterReminderFrequency: number; // hours
}

const DEFAULT_SETTINGS: Settings = {
  globalSharing: false,
  showWater: true,
  showSkincare: true,
  showRest: true,
  showPeriod: false,
  hideEverything: false,
  periodStartDate: "",
  currentNeed: "gentle-reminders",
  identity: { name: "", phone: "", partnerName: "", partnerPhone: "" },
  waterReminderFrequency: 2,
};

// ID generator
export const genId = () => Math.random().toString(36).slice(2, 10);

// Generic localStorage hook
function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Hooks
export const useDreams = () => useLocalStorage<Dream[]>("dc-dreams", []);
export const useThoughts = () => useLocalStorage<Thought[]>("dc-thoughts", []);
export const useLetters = () => useLocalStorage<Letter[]>("dc-letters", []);
export const useSettings = (): [Settings, (val: Settings | ((prev: Settings) => Settings)) => void] => {
  const [raw, setRaw] = useLocalStorage<Settings>("dc-settings", DEFAULT_SETTINGS);
  // Merge with defaults to handle missing fields from older localStorage data
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...raw,
    identity: { ...DEFAULT_SETTINGS.identity, ...(raw?.identity || {}) },
  };
  return [merged, setRaw];
};
export const useEmotionalCheckin = () => useLocalStorage<string | null>("dc-checkin-today", null);
export const useMoodHistory = () => useLocalStorage<MoodEntry[]>("dc-mood-history", []);
export const useLastMoodCheck = () => useLocalStorage<string>("dc-last-mood-check", "");
export const useRole = () => useLocalStorage<"self" | "partner">("dc-role", "self");

export const useSelfCare = () => {
  const today = new Date().toISOString().slice(0, 10);
  return useLocalStorage<SelfCareItem[]>(`dc-selfcare-${today}`, []);
};

// Motivational messages
export const MOTIVATIONAL_MESSAGES = [
  "You are enough, just as you are 🌸",
  "Today is a lovely day to be gentle with yourself 💛",
  "Your dreams matter — even the quiet ones 🌙",
  "Take your time, darling. There's no rush here 🍃",
  "You're doing so much better than you think ✨",
  "Rest is not giving up — it's giving back to yourself 🌿",
  "Every small step counts, even standing still 💜",
  "You deserve all the softness today 🌷",
  "It's okay to not be okay. You're safe here 💕",
  "Breathe gently. You belong in this moment 🌊",
  "Your feelings are valid, every single one 🦋",
  "Be proud of how far you've come, love 🌈",
  "You carry more strength than you know 🌻",
  "Let today be gentle with you 🕊️",
  "The world is brighter with you in it 💗",
];

export const getDailyMessage = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
};

// Kindness affirmations
export const KINDNESS_AFFIRMATIONS = [
  "You are loved, even when you forget to love yourself 💝",
  "It's okay to take a break. The world will wait for you 🌙",
  "You don't have to carry everything alone, sweetheart 🤍",
  "Your heart is strong, even when it feels fragile 🌸",
  "You are worthy of the same kindness you give to others ✨",
  "This feeling will pass. You will be okay 🌿",
  "You are not a burden. You are a gift 💜",
  "Let yourself be held by this moment of peace 🕊️",
];

export const TARGET_STATE_LABELS: Record<TargetState, { label: string; emoji: string; message: string }> = {
  "starting": { label: "Starting", emoji: "🌱", message: "Every beautiful journey begins with a single thought" },
  "in-progress": { label: "In Progress", emoji: "🌿", message: "You're moving forward — that's beautiful" },
  "feels-good": { label: "Feels Good", emoji: "🌸", message: "Look at you bloom, love!" },
  "resting": { label: "Resting", emoji: "😴", message: "Resting is part of the journey 💛" },
};

export const VISIT_MOOD_LABELS: Record<VisitMood, { label: string; message: string }> = {
  "😊": { label: "Happy", message: "How wonderful! Let that joy fill your heart 🌸" },
  "😔": { label: "Low", message: "It's okay to feel this way. Be extra gentle with yourself today 💛" },
  "😌": { label: "Calm", message: "What a peaceful place to be. Enjoy this stillness 🕊️" },
  "😟": { label: "Anxious", message: "Take a deep breath, love. You're safe here 🌿" },
  "😴": { label: "Tired", message: "Rest is not laziness — it's self-love. Take it easy today 💜" },
  "💗": { label: "Soft", message: "Your softness is your superpower. Embrace it 🌷" },
  "😤": { label: "Overwhelmed", message: "You don't have to do it all. Just breathe for now 🍃" },
};

export const getPersonalizedGreeting = (name: string) => {
  const hour = new Date().getHours();
  const displayName = name || "lovely";
  if (hour < 12) return `Good morning, ${displayName} 🌅`;
  if (hour < 17) return `Good afternoon, ${displayName} ☀️`;
  if (hour < 21) return `Good evening, ${displayName} 🌙`;
  return `Sweet dreams await, ${displayName} ✨`;
};
