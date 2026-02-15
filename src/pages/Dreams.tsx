import { motion } from "framer-motion";
import { useDreams } from "@/lib/store";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Dreams() {
  const [dreams] = useDreams();
  const [filter, setFilter] = useState<"all" | "shared" | "private">("all");

  const filtered = dreams.filter((d) => {
    if (filter === "shared") return d.shared;
    if (filter === "private") return !d.shared;
    return true;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-light text-primary mb-1">My Dreams 📖</h1>
        <p className="text-sm text-muted-foreground">Every dream deserves to be held gently and lovingly.</p>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "private", "shared"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              filter === f ? "bg-primary/20 text-primary" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {f === "all" ? "All" : f === "shared" ? "💕 Shared" : "🔒 Private"}
          </button>
        ))}
      </div>

      {/* Dream grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nothing here yet — and that's perfectly fine 🌿</p>
          <Link to="/write" className="inline-block mt-4 text-sm text-primary hover:underline">
            Write your first dream →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((dream, i) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/dreams/${dream.id}`}
                className="block bg-card rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{dream.mood}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground">
                    {dream.shared ? "💕 Shared" : "🔒 Private"}
                  </span>
                </div>
                <h3 className="font-display text-lg font-light text-foreground group-hover:text-primary transition-colors">
                  {dream.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{dream.content}</p>
                {dream.targets.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {dream.targets.length} gentle step{dream.targets.length > 1 ? "s" : ""}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
