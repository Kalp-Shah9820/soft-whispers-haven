import { motion } from "framer-motion";
import { useDreams, TARGET_STATE_LABELS, type TargetState } from "@/lib/store";
import { Link } from "react-router-dom";

const STATES: TargetState[] = ["starting", "in-progress", "feels-good", "resting"];

export default function Targets() {
  const [dreams] = useDreams();
  const allTargets = dreams.flatMap((d) => d.targets.map((t) => ({ ...t, dreamTitle: d.title })));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary mb-1">Gentle Steps 🎯</h1>
        <p className="text-sm text-muted-foreground">Every step counts — even resting.</p>
      </motion.div>

      {allTargets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No steps yet — and that's perfectly fine 🌿</p>
          <Link to="/write" className="inline-block mt-4 text-sm text-primary hover:underline">
            Start with a dream →
          </Link>
        </div>
      ) : (
        STATES.map((state) => {
          const info = TARGET_STATE_LABELS[state];
          const targets = allTargets.filter((t) => t.state === state);
          if (targets.length === 0) return null;
          return (
            <motion.div key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{info.emoji}</span>
                <h2 className="font-display font-semibold text-foreground">{info.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{info.message}</span>
              </div>
              {targets.map((t) => (
                <Link
                  key={t.id}
                  to={`/dreams/${t.dreamId}`}
                  className="block bg-card rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <p className="text-sm font-medium text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">from "{t.dreamTitle}"</p>
                </Link>
              ))}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
