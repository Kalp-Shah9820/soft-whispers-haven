import { motion } from "framer-motion";
import { selfCareAPI, mapSelfCareCategoryToDB } from "@/lib/api";
import { type SelfCareItem } from "@/lib/store";
import { useSettingsAPI } from "@/lib/store-api";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";

// ── Category definitions ─────────────────────────────────────────────────
const CATEGORIES = {
  water: {
    emoji: "💧",
    label: "Water Intake",
    items: ["Morning glass of water", "Midday hydration", "Afternoon water", "Evening water"],
    settingsKey: "showWater" as const,
  },
  skincare: {
    emoji: "🧴",
    label: "Skincare",
    items: [
      "Morning cleanse",
      "Morning moisturize",
      "Sunscreen",
      "Evening cleanse",
      "Night moisturize",
      "Bath check-up",
      "After bath care",
    ],
    settingsKey: "showSkincare" as const,
  },
  rest: {
    emoji: "😴",
    label: "Rest & Sleep",
    items: ["Took a gentle break today", "Stretched or moved softly", "Wind-down routine", "In bed on time"],
    settingsKey: "showRest" as const,
  },
  period: {
    emoji: "🌺",
    label: "Period Awareness",
    items: ["Tracking today", "Extra rest taken", "Comfort measures", "Warm drink or heat pad"],
    settingsKey: "showPeriod" as const,
  },
};

const SKINCARE_MORNING = ["Morning cleanse", "Morning moisturize", "Sunscreen"];
const SKINCARE_EVENING = ["Evening cleanse", "Night moisturize"];
const SKINCARE_BATH = ["Bath check-up", "After bath care"];

const TODAY = new Date().toISOString().slice(0, 10);

function backendToItem(i: any): SelfCareItem {
  return {
    id: i.id,
    label: i.label,
    category: (i.category as string).toLowerCase() as SelfCareItem["category"],
    checked: i.checked,
    date: i.date,
  };
}

export default function SelfCare() {
  const [items, setItems] = useState<SelfCareItem[]>([]);
  const [settings, , settingsLoading] = useSettingsAPI();
  // initialized: true once we've heard back from the backend load (success or failure)
  const [initialized, setInitialized] = useState(false);
  // creating: true while the initialization POST is in-flight (prevents double-fire)
  const [creating, setCreating] = useState(false);

  // ── Step 1: Load today's items from backend ────────────────────────────
  useEffect(() => {
    selfCareAPI
      .getByDate(TODAY)
      .then(({ items: saved }) => {
        if (saved?.length > 0) {
          setItems(saved.map(backendToItem));
        }
      })
      .catch(() => { /* will initialize below */ })
      .finally(() => setInitialized(true));
  }, []);

  // ── Step 2: Create items for any enabled category that has no items yet ──
  useEffect(() => {
    if (!initialized) return;
    if (settingsLoading) return;
    if (creating) return;
    if (!settings.identity) return;

    // Which enabled categories are completely missing from loaded items?
    const missingCategories = Object.entries(CATEGORIES).filter(([cat, config]) => {
      if (!settings[config.settingsKey]) return false;
      return !items.some((i) => i.category === cat);
    });

    if (missingCategories.length === 0) return;

    setCreating(true);

    const initial: SelfCareItem[] = [];
    for (const [cat, config] of missingCategories) {
      for (const label of config.items) {
        initial.push({
          id: `tmp-${Math.random().toString(36).slice(2)}`,
          label,
          category: cat as SelfCareItem["category"],
          checked: false,
          date: TODAY,
        });
      }
    }

    if (initial.length === 0) { setCreating(false); return; }

    setItems((prev) => [...prev, ...initial]);

    selfCareAPI
      .create(initial.map((i) => ({
        label: i.label,
        category: mapSelfCareCategoryToDB(i.category),
        checked: false,
        date: TODAY,
      })))
      .then(({ items: saved }) => {
        if (saved?.length > 0) {
          setItems((prev) =>
            prev.map((local) => {
              if (!local.id.startsWith("tmp-")) return local;
              const match = saved.find((s: any) => s.label === local.label);
              return { ...local, id: match ? match.id : local.id };
            })
          );
        }
      })
      .catch(() => { })
      .finally(() => setCreating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, settingsLoading, creating, settings, items.length]);

  // ── Toggle: PATCH only, never replaces other items ────────────────────
  const toggle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // Guard against toggling temp-ID items (backend not synced yet)
    if (id.startsWith("tmp-")) {
      toast.error("Still saving, please wait a moment 💛");
      return;
    }

    const newChecked = !item.checked;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: newChecked } : i)));

    try {
      await selfCareAPI.update(id, { checked: newChecked });
      // Partner notification fires server-side when checked === true
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !newChecked } : i)));
      toast.error("Couldn't update 💛");
    }
  };

  const visibleCategories = Object.entries(CATEGORIES).filter(([, c]) => settings[c.settingsKey]);
  const waterFreq = settings.waterReminderFrequency || 2;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-light text-primary mb-1">Take Care 💖</h1>
        <p className="text-sm text-muted-foreground">Go at your own pace, love. No pressure, ever.</p>
      </motion.div>

      {visibleCategories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">All categories are hidden. You can change this in Settings 🌿</p>
        </div>
      ) : (
        visibleCategories.map(([cat, config]) => {
          const categoryItems = items.filter((i) => i.category === cat);
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-light text-foreground flex items-center gap-2">
                  <span className="text-xl">{config.emoji}</span> {config.label}
                </h2>
                {cat === "water" && (
                  <span className="text-xs text-muted-foreground bg-secondary/40 px-3 py-1 rounded-full">
                    Every {waterFreq}h 💧
                  </span>
                )}
              </div>

              {categoryItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-1">Nothing here yet — refresh the page to try again 🌱</p>
              ) : cat === "skincare" ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">☀️ Morning</p>
                  {categoryItems.filter((i) => SKINCARE_MORNING.includes(i.label)).map((item) => (
                    <ItemRow key={item.id} item={item} toggle={toggle} />
                  ))}
                  <p className="text-xs text-muted-foreground font-medium pt-2">🌙 Evening</p>
                  {categoryItems.filter((i) => SKINCARE_EVENING.includes(i.label)).map((item) => (
                    <ItemRow key={item.id} item={item} toggle={toggle} />
                  ))}
                  <p className="text-xs text-muted-foreground font-medium pt-2">🛁 Bath</p>
                  {categoryItems.filter((i) => SKINCARE_BATH.includes(i.label)).map((item) => (
                    <ItemRow key={item.id} item={item} toggle={toggle} />
                  ))}
                </div>
              ) : (
                categoryItems.map((item) => <ItemRow key={item.id} item={item} toggle={toggle} />)
              )}
            </motion.div>
          );
        })
      )}

      <p className="text-center text-xs text-muted-foreground">
        Remember: doing even one little thing is enough 💛
      </p>
    </div>
  );
}

function ItemRow({ item, toggle }: { item: SelfCareItem; toggle: (id: string) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1.5 group">
      <Checkbox
        checked={item.checked}
        onCheckedChange={() => toggle(item.id)}
        className="rounded-full border-primary/40 data-[state=checked]:bg-primary"
      />
      <span className={`text-sm transition-colors ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
        {item.label}
      </span>
    </label>
  );
}
