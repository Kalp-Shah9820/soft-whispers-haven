import { useState } from "react";
import { motion } from "framer-motion";
import { KINDNESS_AFFIRMATIONS } from "@/lib/store";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Kindness() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % KINDNESS_AFFIRMATIONS.length);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <Link to="/" className="self-start flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back home
      </Link>

      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl p-10 shadow-sm text-center max-w-md"
      >
        <Heart className="h-10 w-10 mx-auto mb-6 text-primary animate-float" />
        <p className="text-lg font-display font-light text-foreground leading-relaxed">
          {KINDNESS_AFFIRMATIONS[index]}
        </p>
      </motion.div>

      <button
        onClick={next}
        className="px-6 py-3 rounded-full bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition-colors"
      >
        Show me more kindness 💕
      </button>
    </div>
  );
}
