import { useState, useEffect, useCallback } from "react";

// Types
export type Mood = "😊" | "😌" | "🌸" | "💭" | "🌙" | "✨" | "💪" | "🥺" | "😴" | "🌈";
export type TargetState = "starting" | "in-progress" | "feels-good" | "resting";
export type WritingMode = "dream" | "thought";

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
  shared: boolean;
  createdAt: string;
}

export interface Letter {
  id: string;
  content: string;
  unlockDate: string;
  shared: boolean;
  createdAt: string;
}

export interface SelfCareItem {
  id: string;
  label: string;
  category: "water" | "skincare" | "rest" | "period";
  checked: boolean;
  date: string;
}

export interface Settings {
  globalSharing: boolean;
  showWater: boolean;
  showSkincare: boolean;
  showRest: boolean;
  showPeriod: boolean;
  hideEverything: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  globalSharing: false,
  showWater: true,
  showSkincare: true,
  showRest: true,
  showPeriod: false,
  hideEverything: false,
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
export const useSettings = () => useLocalStorage<Settings>("dc-settings", DEFAULT_SETTINGS);
export const useEmotionalCheckin = () => useLocalStorage<string | null>("dc-checkin-today", null);

export const useSelfCare = () => {
  const today = new Date().toISOString().slice(0, 10);
  return useLocalStorage<SelfCareItem[]>(`dc-selfcare-${today}`, []);
};

// Motivational messages
export const MOTIVATIONAL_MESSAGES = [
  "You are enough, just as you are 🌸",
  "Today is a good day to be gentle with yourself 💛",
  "Your dreams matter — even the quiet ones 🌙",
  "Take your time. There's no rush here 🍃",
  "You're doing better than you think ✨",
  "Rest is not giving up — it's giving back to yourself 🌿",
  "Every small step counts, even standing still 💜",
  "You deserve softness today 🌷",
  "It's okay to not be okay. You're safe here 💕",
  "Breathe. You belong in this moment 🌊",
  "Your feelings are valid, all of them 🦋",
  "Be proud of how far you've come 🌈",
  "You carry more strength than you know 🌻",
  "Let today be gentle with you 🕊️",
  "The world is better with you in it 💗",
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
  "You don't have to carry everything alone 🤍",
  "Your heart is strong, even when it feels fragile 🌸",
  "You are worthy of the same kindness you give to others ✨",
  "This feeling will pass. You will be okay 🌿",
  "You are not a burden. You are a gift 💜",
  "Let yourself be held by this moment of peace 🕊️",
];

export const TARGET_STATE_LABELS: Record<TargetState, { label: string; emoji: string; message: string }> = {
  "starting": { label: "Starting", emoji: "🌱", message: "Every journey begins with a single thought" },
  "in-progress": { label: "In Progress", emoji: "🌿", message: "You're moving — that's beautiful" },
  "feels-good": { label: "Feels Good", emoji: "🌸", message: "Look at you bloom!" },
  "resting": { label: "Resting", emoji: "😴", message: "You're resting — that's okay 💛" },
};
