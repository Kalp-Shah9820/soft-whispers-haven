import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDreams, useThoughts, genId, type Mood, type WritingMode } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const MOODS: Mood[] = ["😊", "😌", "🌸", "💭", "🌙", "✨", "💪", "🥺", "😴", "🌈"];

export default function Write() {
  const [mode, setMode] = useState<WritingMode>("dream");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>("🌸");
  const [shared, setShared] = useState(false);
  const [dreams, setDreams] = useDreams();
  const [thoughts, setThoughts] = useThoughts();
  const [saved, setSaved] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    const key = `dc-draft-${mode}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ title, content, mood, shared }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, content, mood, shared, mode]);

  // Load draft on mode switch
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(`dc-draft-${mode}`) || "{}");
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setMood(draft.mood || "🌸");
      setShared(draft.shared || false);
    } catch {
      // ignore
    }
  }, [mode]);

  const handleSave = () => {
    if (!content.trim()) return;
    if (mode === "dream") {
      setDreams((prev) => [
        ...prev,
        {
          id: genId(),
          title: title || "Untitled Dream",
          content,
          mood,
          shared,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          targets: [],
        },
      ]);
    } else {
      setThoughts((prev) => [
        ...prev,
        { id: genId(), content, shared, createdAt: new Date().toISOString() },
      ]);
    }
    setTitle("");
    setContent("");
    setShared(false);
    localStorage.removeItem(`dc-draft-${mode}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary mb-1">Write Freely ✍️</h1>
        <p className="text-sm text-muted-foreground">No rules, no limits. Just you.</p>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-secondary/40 rounded-xl p-1">
        {(["dream", "thought"] as WritingMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {m === "dream" ? "🌙 Dream" : "💭 Thought"}
          </button>
        ))}
      </div>

      {/* Writing area */}
      <div className="space-y-4">
        {mode === "dream" && (
          <input
            type="text"
            placeholder="Give your dream a name (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none text-xl font-display font-semibold placeholder:text-muted-foreground/50 focus:outline-none"
          />
        )}

        <Textarea
          placeholder={mode === "dream" ? "What are you dreaming of? 🌙" : "Let it all out... no one's watching 💭"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[250px] border-none bg-card/50 rounded-2xl p-5 text-base resize-none focus-visible:ring-primary/30"
        />

        {mode === "dream" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">How does this dream feel?</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-xl p-2 rounded-lg transition-all ${
                    mood === m ? "bg-primary/20 scale-110" : "hover:bg-secondary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3">
          <span className="text-sm text-muted-foreground">Share with partner?</span>
          <Switch checked={shared} onCheckedChange={setShared} />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Save {mode === "dream" ? "Dream" : "Thought"} 🌸
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-accent-foreground">
              Saved! ✨
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
