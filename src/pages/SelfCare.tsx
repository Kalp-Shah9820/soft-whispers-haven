import { motion } from "framer-motion";
import { useSelfCare, useSettings, genId, type SelfCareItem } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";

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

export default function SelfCare() {
  const [items, setItems] = useSelfCare();
  const [settings] = useSettings();

  // Initialize items for today if empty
  useEffect(() => {
    if (items.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const initial: SelfCareItem[] = [];
      for (const [cat, config] of Object.entries(CATEGORIES)) {
        if (!settings[config.settingsKey]) continue;
        for (const label of config.items) {
          initial.push({ id: genId(), label, category: cat as any, checked: false, date: today });
        }
      }
      setItems(initial);
    }
  }, []);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const visibleCategories = Object.entries(CATEGORIES).filter(([, c]) => settings[c.settingsKey]);

  // Water reminder info
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
              {cat === "skincare" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">☀️ Morning</p>
                  {categoryItems.filter((i) => ["Morning cleanse", "Morning moisturize", "Sunscreen"].includes(i.label)).map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer py-1.5 group">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggle(item.id)} className="rounded-full border-primary/40 data-[state=checked]:bg-primary" />
                      <span className={`text-sm transition-colors ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground font-medium pt-2">🌙 Evening</p>
                  {categoryItems.filter((i) => ["Evening cleanse", "Night moisturize"].includes(i.label)).map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer py-1.5 group">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggle(item.id)} className="rounded-full border-primary/40 data-[state=checked]:bg-primary" />
                      <span className={`text-sm transition-colors ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground font-medium pt-2">🛁 Bath</p>
                  {categoryItems.filter((i) => ["Bath check-up", "After bath care"].includes(i.label)).map((item) => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer py-1.5 group">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggle(item.id)} className="rounded-full border-primary/40 data-[state=checked]:bg-primary" />
                      <span className={`text-sm transition-colors ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {cat !== "skincare" && categoryItems.map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer py-1.5 group">
                  <Checkbox checked={item.checked} onCheckedChange={() => toggle(item.id)} className="rounded-full border-primary/40 data-[state=checked]:bg-primary" />
                  <span className={`text-sm transition-colors ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                </label>
              ))}
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
