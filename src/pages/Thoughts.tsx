import { useState } from "react";
import { motion } from "framer-motion";
import { useThoughtsAPI } from "@/lib/store-api";
import { thoughtsAPI } from "@/lib/api";
import { type Mood } from "@/lib/store";
import { Link } from "react-router-dom";
import { Search, Trash2, Edit3, X, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

export default function Thoughts() {
  const [thoughts, setThoughts] = useThoughtsAPI();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "shared" | "private">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = thoughts
    .filter((t) => {
      if (filter === "shared") return t.shared;
      if (filter === "private") return !t.shared;
      return true;
    })
    .filter((t) => !search || t.content.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = async (id: string) => {
    const now = new Date().toISOString();
    // Optimistic update
    setThoughts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content: editContent, updatedAt: now } : t))
    );
    setEditingId(null);
    try {
      await thoughtsAPI.update(id, { content: editContent });
    } catch (error) {
      console.error("Failed to save thought:", error);
      toast.error("Couldn't save changes 💭");
    }
  };

  const toggleShare = async (id: string) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    const newShared = !thought.shared;
    // Optimistic update
    setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, shared: newShared } : t)));
    try {
      await thoughtsAPI.update(id, { shared: newShared });
    } catch (error) {
      console.error("Failed to update sharing:", error);
      // Revert
      setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, shared: !newShared } : t)));
      toast.error("Couldn't update sharing 💭");
    }
  };

  const deleteThought = async (id: string) => {
    setLoadingId(id);
    // Optimistic remove
    const removed = thoughts.find((t) => t.id === id);
    setThoughts((prev) => prev.filter((t) => t.id !== id));
    try {
      await thoughtsAPI.delete(id);
    } catch (error) {
      console.error("Failed to delete thought:", error);
      // Revert
      if (removed) setThoughts((prev) => [...prev, removed]);
      toast.error("Couldn't delete this thought 💭");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-light text-primary mb-1">My Thoughts 💭</h1>
        <p className="text-sm text-muted-foreground">Every thought deserves a safe place to land.</p>
      </motion.div>

      {/* Search & filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your thoughts gently..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card rounded-2xl pl-10 pr-4 py-3 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "private", "shared"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary/20 text-primary" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                }`}
            >
              {f === "all" ? "All" : f === "shared" ? "💕 Shared" : "🔒 Private"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            {thoughts.length === 0
              ? "No thoughts yet — and that's perfectly fine 🌿"
              : "No thoughts match your search 🔍"}
          </p>
          {thoughts.length === 0 && (
            <Link to="/write" className="inline-block mt-4 text-sm text-primary hover:underline">
              Write your first thought →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {[...filtered].reverse().map((thought, i) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card rounded-2xl p-5 space-y-3 overflow-hidden ${loadingId === thought.id ? "opacity-50" : ""}`}
            >
              {editingId === thought.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] border-none bg-secondary/30 rounded-xl p-3 text-sm resize-none focus-visible:ring-primary/30"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(thought.id)} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary/60">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-lg">{thought.mood}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground">
                        {thought.shared ? "💕 Shared" : "🔒 Private"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(thought.id, thought.content)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleShare(thought.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        {thought.shared ? "🔒" : "💕"}
                      </button>
                      <button
                        onClick={() => deleteThought(thought.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" style={{ overflowWrap: "anywhere" }}>{thought.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(thought.createdAt).toLocaleDateString()}
                    {thought.updatedAt !== thought.createdAt && " · edited"}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
