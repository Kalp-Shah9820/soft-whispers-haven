import { motion, AnimatePresence } from "framer-motion";
import { useSettingsAPI } from "@/lib/store-api";
import { moodsAPI, mapVisitMoodToDB } from "@/lib/api";
import { VISIT_MOOD_LABELS, type VisitMood } from "@/lib/store";
import { useState, useEffect } from "react";

const VISIT_MOODS: VisitMood[] = ["😊", "😔", "😌", "😟", "😴", "💗", "😤"];

export default function MoodCheckModal() {
  const [settings] = useSettingsAPI();
  const [selectedMood, setSelectedMood] = useState<VisitMood | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hasMoodToday, setHasMoodToday] = useState<boolean | null>(null);

  // Check if mood was logged today via API — this is the single source of truth
  useEffect(() => {
    const checkMoodToday = async () => {
      try {
        const { mood } = await moodsAPI.getToday();
        setHasMoodToday(!!mood);
      } catch (error) {
        console.error("Failed to check today's mood:", error);
        // Default to not showing if we can't reach backend
        setHasMoodToday(true);
      }
    };
    checkMoodToday();
  }, []);

  const shouldShow = hasMoodToday === false && !dismissed;

  const handleSelect = async (mood: VisitMood) => {
    setSelectedMood(mood);
    try {
      await moodsAPI.log({
        mood: mapVisitMoodToDB(mood),
        shared: settings.globalSharing,
      });
      setHasMoodToday(true);
    } catch (error) {
      console.error("Failed to save mood:", error);
    }
    setTimeout(() => setDismissed(true), 3000);
  };

  const skip = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/10 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card rounded-3xl p-8 max-w-md w-full shadow-lg text-center space-y-5"
          >
            {!selectedMood ? (
              <>
                <p className="font-display text-2xl text-foreground font-light">
                  How are you feeling right now? 🌸
                </p>
                <p className="text-sm text-muted-foreground">
                  No pressure — just checking in with you, gently.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {VISIT_MOODS.map((mood) => {
                    const info = VISIT_MOOD_LABELS[mood];
                    return (
                      <button
                        key={mood}
                        onClick={() => handleSelect(mood)}
                        className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 transition-all hover:scale-105"
                      >
                        <span className="text-2xl">{mood}</span>
                        <span className="text-xs text-muted-foreground">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={skip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  I'd rather not say right now
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 py-4"
              >
                <span className="text-5xl block">{selectedMood}</span>
                <p className="text-foreground font-display text-lg leading-relaxed">
                  {VISIT_MOOD_LABELS[selectedMood].message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Thank you for sharing, love 💕
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
