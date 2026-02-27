import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThoughtsAPI } from "@/lib/store-api";
import { thoughtsAPI } from "@/lib/api";
import { Link } from "react-router-dom";
import { Search, Trash2, Edit3, X, Check, MessageCircle } from "lucide-react";
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
    setThoughts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content: editContent, updatedAt: now } : t))
    );
    setEditingId(null);
    try {
      await thoughtsAPI.update(id, { content: editContent });
    } catch {
      toast.error("Couldn't save changes 💭");
    }
  };

  const toggleShare = async (id: string) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    const newShared = !thought.shared;
    setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, shared: newShared } : t)));
    try {
      await thoughtsAPI.update(id, { shared: newShared });
    } catch {
      setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, shared: !newShared } : t)));
      toast.error("Couldn't update sharing 💭");
    }
  };

  const deleteThought = async (id: string) => {
    setLoadingId(id);
    const removed = thoughts.find((t) => t.id === id);
    setThoughts((prev) => prev.filter((t) => t.id !== id));
    try {
      await thoughtsAPI.delete(id);
    } catch {
      if (removed) setThoughts((prev) => [...prev, removed]);
      toast.error("Couldn't delete this thought 💭");
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-1">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-2xl bg-primary/15">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-light text-primary tracking-wide">My Thoughts</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-1">Every thought deserves a safe place to land. 🌿</p>
      </motion.div>

      {/* ── Search & Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search your thoughts gently..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow shadow-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["all", "private", "shared"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f
                  ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                }`}
            >
              {f === "all" ? "✨ All" : f === "shared" ? "💕 Shared" : "🔒 Private"}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">
            {filtered.length} {filtered.length === 1 ? "thought" : "thoughts"}
          </span>
        </div>
      </motion.div>

      {/* ── Thoughts List ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 flex flex-col items-center gap-3"
        >
          <div className="text-5xl mb-2">💭</div>
          <p className="text-muted-foreground text-base font-light">
            {thoughts.length === 0
              ? "No thoughts yet — and that's perfectly fine."
              : "No thoughts match your search."}
          </p>
          {thoughts.length === 0 && (
            <Link
              to="/write"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/70 transition-colors"
            >
              Write your first thought →
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {[...filtered].reverse().map((thought, i) => (
              <motion.article
                key={thought.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={`
                  group relative bg-card rounded-3xl border border-border/30
                  shadow-sm hover:shadow-md transition-shadow duration-300
                  overflow-hidden w-full
                  ${loadingId === thought.id ? "opacity-40 pointer-events-none" : ""}
                `}
              >
                {/* Accent bar — colour by shared state */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full rounded-l-3xl ${thought.shared ? "bg-primary/60" : "bg-secondary/80"
                    }`}
                />

                <div className="pl-5 pr-5 pt-4 pb-5 space-y-3">

                  {/* ── Card header ── */}
                  {editingId === thought.id ? (
                    /* Edit mode */
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[120px] w-full border border-border/40 bg-secondary/20 rounded-2xl px-4 py-3 text-sm text-foreground leading-relaxed resize-none focus-visible:ring-primary/30"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(thought.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary/40 text-muted-foreground text-xs font-medium hover:bg-secondary/60 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mood + badges + actions row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl leading-none">{thought.mood}</span>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${thought.shared
                                ? "bg-primary/15 text-primary"
                                : "bg-secondary/60 text-muted-foreground"
                              }`}
                          >
                            {thought.shared ? "💕 Shared" : "🔒 Private"}
                          </span>
                        </div>

                        {/* Action buttons — always visible on mobile, visible on hover on desktop */}
                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(thought.id, thought.content)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleShare(thought.id)}
                            title={thought.shared ? "Make private" : "Share"}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-sm leading-none"
                          >
                            {thought.shared ? "🔒" : "💕"}
                          </button>
                          <button
                            onClick={() => deleteThought(thought.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ── Thought content ── */}
                      <div
                        className="text-sm text-foreground/90 leading-[1.8] max-w-full"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {thought.content}
                      </div>

                      {/* ── Date & edited ── */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatDate(thought.createdAt)} · {formatTime(thought.createdAt)}
                        </span>
                        {thought.updatedAt !== thought.createdAt && (
                          <span className="text-[11px] text-muted-foreground/50 italic">· edited</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
