import { motion } from "framer-motion";
import { getDailyMessage, useEmotionalCheckin, useSettings, useMoodHistory, getPersonalizedGreeting, type Mood } from "@/lib/store";
import { Link } from "react-router-dom";
import { PenLine, BookHeart, Heart } from "lucide-react";

const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "💭", label: "Thoughtful" },
  { emoji: "🥺", label: "Tender" },
  { emoji: "😴", label: "Tired" },
  { emoji: "✨", label: "Hopeful" },
];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Home() {
  const [checkin, setCheckin] = useEmotionalCheckin();
  const [settings] = useSettings();
  const [moodHistory] = useMoodHistory();
  const message = getDailyMessage();

  // Get today's mood for tone adjustment
  const today = new Date().toISOString().slice(0, 10);
  const todayMood = moodHistory.find((m) => m.date === today);
  const isLowEnergy = todayMood && ["😔", "😴", "😤", "😟"].includes(todayMood.mood);

  return (
    <div className="space-y-8">
      <motion.div {...fadeIn} className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-light text-primary tracking-wide">
          {getPersonalizedGreeting(settings.identity.name)}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">{message}</p>
      </motion.div>

      {/* Emotional check-in */}
      <motion.div {...fadeIn} transition={{ delay: 0.15, duration: 0.5 }} className="bg-card rounded-3xl p-6 shadow-sm">
        <p className="text-center text-sm text-muted-foreground mb-4">
          {isLowEnergy
            ? "You're doing great just being here 💛 No pressure at all."
            : "How are you feeling right now? (no pressure, love 💛)"}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {MOODS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => setCheckin(emoji)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all ${
                checkin === emoji
                  ? "bg-primary/20 scale-110 shadow-sm"
                  : "bg-secondary/40 hover:bg-secondary/70"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
        {checkin && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground mt-4"
          >
            Thank you for sharing, love 💕 Whatever you're feeling is perfectly valid.
          </motion.p>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fadeIn} transition={{ delay: 0.3, duration: 0.5 }} className="grid gap-4 sm:grid-cols-3">
        <Link to="/write" className="bg-lavender hover:bg-lavender/80 rounded-3xl p-6 text-center transition-colors group">
          <PenLine className="h-8 w-8 mx-auto mb-3 text-lavender-foreground group-hover:scale-110 transition-transform" />
          <h3 className="font-display text-lg text-lavender-foreground font-light">Write Something</h3>
          <p className="text-xs text-lavender-foreground/70 mt-1">Let your thoughts flow freely</p>
        </Link>

        <Link to="/dreams" className="bg-peach hover:bg-peach/80 rounded-3xl p-6 text-center transition-colors group">
          <BookHeart className="h-8 w-8 mx-auto mb-3 text-peach-foreground group-hover:scale-110 transition-transform" />
          <h3 className="font-display text-lg text-peach-foreground font-light">Visit Your Dreams</h3>
          <p className="text-xs text-peach-foreground/70 mt-1">Revisit what matters to you</p>
        </Link>

        <Link to="/kindness" className="bg-sage hover:bg-sage/80 rounded-3xl p-6 text-center transition-colors group">
          <Heart className="h-8 w-8 mx-auto mb-3 text-sage-foreground group-hover:scale-110 transition-transform" />
          <h3 className="font-display text-lg text-sage-foreground font-light">I Need Kindness</h3>
          <p className="text-xs text-sage-foreground/70 mt-1">A gentle space just for you</p>
        </Link>
      </motion.div>
    </div>
  );
}
