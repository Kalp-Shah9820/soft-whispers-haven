// API-based store hooks that replace localStorage with backend API
// This maintains the same interface as store.ts but uses the backend

import { useState, useEffect, useCallback } from "react";
import {
  dreamsAPI,
  thoughtsAPI,
  lettersAPI,
  moodsAPI,
  settingsAPI,
  selfCareAPI,
  sharedAPI,
  mapMoodFromDB,
  mapMoodToDB,
  mapVisitMoodFromDB,
  mapVisitMoodToDB,
  mapTargetStateFromDB,
  mapTargetStateToDB,
  mapCurrentNeedFromDB,
  mapCurrentNeedToDB,
  mapSelfCareCategoryFromDB,
  mapSelfCareCategoryToDB,
  authAPI,
} from "./api";
import type {
  Dream,
  Thought,
  Letter,
  MoodEntry,
  Settings,
  SelfCareItem,
  Target,
  VisitMood,
  Mood,
  TargetState,
  CurrentNeed,
} from "./store";

// Initialize API connection on first load
let isInitialized = false;

export async function initializeAPI() {
  if (isInitialized) return;

  try {
    // Try to get current user
    await authAPI.getMe();
    isInitialized = true;
  } catch {
    // Not logged in yet, will need to register/login
    isInitialized = false;
  }
}

// Dreams hooks
export function useDreamsAPI(): [Dream[], (updater: Dream[] | ((prev: Dream[]) => Dream[])) => void] {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDreams();
  }, []);

  const loadDreams = async () => {
    try {
      const { dreams: apiDreams } = await dreamsAPI.getAll();
      const mapped = apiDreams.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        mood: mapMoodFromDB(d.mood) as Mood,
        shared: d.shared,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        targets: d.targets.map((t: any) => ({
          id: t.id,
          dreamId: t.dreamId,
          text: t.text,
          state: mapTargetStateFromDB(t.state) as TargetState,
          shared: t.shared,
        })),
      }));
      setDreams(mapped);
    } catch (error) {
      console.error("Failed to load dreams:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDreams = useCallback(
    async (updater: Dream[] | ((prev: Dream[]) => Dream[])) => {
      const newDreams = typeof updater === "function" ? updater(dreams) : updater;
      setDreams(newDreams);
    },
    [dreams]
  );

  return [dreams, updateDreams];
}

// Thoughts hooks
export function useThoughtsAPI(): [Thought[], (updater: Thought[] | ((prev: Thought[]) => Thought[])) => void] {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      const { thoughts: apiThoughts } = await thoughtsAPI.getAll();
      const mapped = apiThoughts.map((t: any) => ({
        id: t.id,
        content: t.content,
        mood: mapMoodFromDB(t.mood) as Mood,
        shared: t.shared,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      setThoughts(mapped);
    } catch (error) {
      console.error("Failed to load thoughts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateThoughts = useCallback(
    async (updater: Thought[] | ((prev: Thought[]) => Thought[])) => {
      const newThoughts = typeof updater === "function" ? updater(thoughts) : updater;
      setThoughts(newThoughts);
    },
    [thoughts]
  );

  return [thoughts, updateThoughts];
}

// Letters hooks
export function useLettersAPI(): [Letter[], (updater: Letter[] | ((prev: Letter[]) => Letter[])) => void] {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    try {
      const { letters: apiLetters } = await lettersAPI.getAll();
      const mapped = apiLetters.map((l: any) => ({
        id: l.id,
        content: l.content,
        unlockDate: l.unlockDate || "",
        shared: l.shared,
        sealed: l.sealed,
        createdAt: l.createdAt,
      }));
      setLetters(mapped);
    } catch (error) {
      console.error("Failed to load letters:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLetters = useCallback(
    async (updater: Letter[] | ((prev: Letter[]) => Letter[])) => {
      const newLetters = typeof updater === "function" ? updater(letters) : updater;
      setLetters(newLetters);
    },
    [letters]
  );

  return [letters, updateLetters];
}

// Mood history hooks
export function useMoodHistoryAPI(): [MoodEntry[], (updater: MoodEntry[] | ((prev: MoodEntry[]) => MoodEntry[])) => void] {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      const { moods: apiMoods } = await moodsAPI.getHistory();
      const mapped = apiMoods.map((m: any) => ({
        mood: mapVisitMoodFromDB(m.mood) as VisitMood,
        date: m.date,
        shared: m.shared,
      }));
      setMoods(mapped);
    } catch (error) {
      console.error("Failed to load moods:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMoods = useCallback(
    async (updater: MoodEntry[] | ((prev: MoodEntry[]) => MoodEntry[])) => {
      const newMoods = typeof updater === "function" ? updater(moods) : updater;
      setMoods(newMoods);
    },
    [moods]
  );

  return [moods, updateMoods];
}

// Settings hooks
export function useSettingsAPI(): [Settings, (updater: Settings | ((prev: Settings) => Settings)) => void, boolean] {
  const [settings, setSettings] = useState<Settings>({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { settings: apiSettings } = await settingsAPI.get();
      setSettings({
        globalSharing: apiSettings.globalSharing,
        showWater: apiSettings.showWater,
        showSkincare: apiSettings.showSkincare,
        showRest: apiSettings.showRest,
        showPeriod: apiSettings.showPeriod,
        hideEverything: apiSettings.hideEverything,
        periodStartDate: apiSettings.periodStartDate || "",
        currentNeed: mapCurrentNeedFromDB(apiSettings.currentNeed) as CurrentNeed,
        waterReminderFrequency: apiSettings.waterReminderFrequency,
        identity: apiSettings.identity,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(
    async (updater: Settings | ((prev: Settings) => Settings)) => {
      const newSettings = typeof updater === "function" ? updater(settings) : updater;
      setSettings(newSettings);

      // Sync to backend
      try {
        await settingsAPI.update({
          globalSharing: newSettings.globalSharing,
          showWater: newSettings.showWater,
          showSkincare: newSettings.showSkincare,
          showRest: newSettings.showRest,
          showPeriod: newSettings.showPeriod,
          hideEverything: newSettings.hideEverything,
          periodStartDate: newSettings.periodStartDate,
          currentNeed: mapCurrentNeedToDB(newSettings.currentNeed),
          waterReminderFrequency: newSettings.waterReminderFrequency,
          identity: newSettings.identity,
        });
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },
    [settings]
  );

  return [settings, updateSettings, loading];
}

// Self-care hooks
export function useSelfCareAPI(): [SelfCareItem[], (updater: SelfCareItem[] | ((prev: SelfCareItem[]) => SelfCareItem[])) => void] {
  const [items, setItems] = useState<SelfCareItem[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadSelfCare();
  }, []);

  const loadSelfCare = async () => {
    try {
      const { items: apiItems } = await selfCareAPI.getByDate(today);
      const mapped = apiItems.map((i: any) => ({
        id: i.id,
        label: i.label,
        category: mapSelfCareCategoryFromDB(i.category) as SelfCareItem["category"],
        checked: i.checked,
        date: i.date,
      }));
      setItems(mapped);
    } catch (error) {
      console.error("Failed to load self-care items:", error);
    }
  };

  const updateSelfCare = useCallback(
    async (updater: SelfCareItem[] | ((prev: SelfCareItem[]) => SelfCareItem[])) => {
      const newItems = typeof updater === "function" ? updater(items) : updater;
      setItems(newItems);

      // Sync to backend
      try {
        await selfCareAPI.create(newItems.map((i) => ({
          label: i.label,
          category: mapSelfCareCategoryToDB(i.category),
          checked: i.checked,
          date: i.date,
        })));
      } catch (error) {
        console.error("Failed to update self-care items:", error);
      }
    },
    [items]
  );

  return [items, updateSelfCare];
}

// Helper hooks that maintain compatibility
export function useEmotionalCheckinAPI() {
  const [checkin, setCheckin] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    moodsAPI.getToday().then(({ mood }) => {
      if (mood) {
        setCheckin(mapVisitMoodFromDB(mood.mood));
      }
    });
  }, []);

  const updateCheckin = async (mood: string | null) => {
    setCheckin(mood);
    if (mood) {
      try {
        await moodsAPI.log({
          mood: mapVisitMoodToDB(mood),
          shared: false, // Will use global sharing setting
        });
      } catch (error) {
        console.error("Failed to log mood:", error);
      }
    }
  };

  return [checkin, updateCheckin] as const;
};

export function useLastMoodCheckAPI() {
  const today = new Date().toISOString().slice(0, 10);
  return [today, () => { }] as const; // Always return today since API handles this
};

export function useRoleAPI() {
  const [role, setRole] = useState<"self" | "partner">("self");

  useEffect(() => {
    authAPI.getMe().then(({ user }) => {
      setRole(user.role === "PARTNER" ? "partner" : "self");
    });
  }, []);

  return [role, setRole] as const;
};

// Shared content hook (for partner view and shared page)
export function useSharedAPI() {
  const [sharedDreams, setSharedDreams] = useState<Dream[]>([]);
  const [sharedThoughts, setSharedThoughts] = useState<Thought[]>([]);
  const [sharedLetters, setSharedLetters] = useState<Letter[]>([]);
  const [sharedMoods, setSharedMoods] = useState<MoodEntry[]>([]);
  const [sharedSelfCare, setSharedSelfCare] = useState<SelfCareItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShared();
  }, []);

  const loadShared = async () => {
    try {
      const data = await sharedAPI.getAll();
      setSharedDreams(
        (data.dreams || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          mood: mapMoodFromDB(d.mood) as Mood,
          shared: d.shared,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          targets: (d.targets || []).map((t: any) => ({
            id: t.id,
            dreamId: t.dreamId,
            text: t.text,
            state: mapTargetStateFromDB(t.state) as TargetState,
            shared: t.shared,
          })),
        }))
      );
      setSharedThoughts(
        (data.thoughts || []).map((t: any) => ({
          id: t.id,
          content: t.content,
          mood: mapMoodFromDB(t.mood) as Mood,
          shared: t.shared,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
      );
      setSharedLetters(
        (data.letters || []).map((l: any) => ({
          id: l.id,
          content: l.content,
          unlockDate: l.unlockDate || "",
          shared: l.shared,
          sealed: l.sealed,
          createdAt: l.createdAt,
        }))
      );
      setSharedMoods(
        (data.moods || []).map((m: any) => ({
          mood: mapVisitMoodFromDB(m.mood) as VisitMood,
          date: m.date,
          shared: m.shared,
        }))
      );
      setSharedSelfCare(
        (data.selfCare || []).map((s: any) => ({
          id: s.id,
          label: s.label,
          category: mapSelfCareCategoryFromDB(s.category) as SelfCareItem["category"],
          checked: s.checked,
          date: s.date,
        }))
      );
    } catch (error) {
      console.error("Failed to load shared content:", error);
    } finally {
      setLoading(false);
    }
  };

  return { sharedDreams, sharedThoughts, sharedLetters, sharedMoods, sharedSelfCare, loading };
}
