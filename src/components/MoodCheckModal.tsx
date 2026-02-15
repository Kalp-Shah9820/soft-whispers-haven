import { motion, AnimatePresence } from "framer-motion";
import { useMoodHistory, useLastMoodCheck, useSettings, VISIT_MOOD_LABELS, type VisitMood } from "@/lib/store";
import { useState } from "react";

const VISIT_MOODS: VisitMood[] = ["😊", "😔", "😌", "😟", "😴", "💗", "😤"];

export default function MoodCheckModal() {
  const [lastCheck, setLastCheck] = useLastMoodCheck();
  const [history, setHistory] = useMoodHistory();
  const [settings] = useSettings();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedMood, setSelectedMood] = useState<VisitMood | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = lastCheck !== today && !dismissed;

  const handleSelect = (mood: VisitMood) => {
    setSelectedMood(mood);
    setLastCheck(today);
    setHistory((prev) => [...prev, { mood, date: today, shared: settings.globalSharing }]);
    setTimeout(() => setDismissed(true), 3000);
  };

  const skip = () => {
    setLastCheck(today);
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
