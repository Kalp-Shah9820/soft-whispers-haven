import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLetters, genId } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Plus } from "lucide-react";

export default function Letters() {
  const [letters, setLetters] = useLetters();
  const [writing, setWriting] = useState(false);
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [shared, setShared] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const saveLetter = () => {
    if (!content.trim() || !unlockDate) return;
    setLetters((prev) => [
      ...prev,
      { id: genId(), content, unlockDate, shared, createdAt: new Date().toISOString() },
    ]);
    setContent("");
    setUnlockDate("");
    setShared(false);
    setWriting(false);
  };

  const isUnlocked = (date: string) => today >= date;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary mb-1">Letters to Myself 💌</h1>
        <p className="text-sm text-muted-foreground">Words from your past self, waiting to embrace you.</p>
      </motion.div>

      {!writing ? (
        <button
          onClick={() => setWriting(true)}
          className="w-full bg-card rounded-2xl p-6 flex items-center justify-center gap-3 hover:shadow-sm transition-shadow text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-5 w-5" /> Write a letter to your future self
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 space-y-4">
          <Textarea
            placeholder="Dear future me... 💌"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] border-none bg-secondary/30 rounded-xl p-4 resize-none focus-visible:ring-primary/30"
          />
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Open this letter on:</label>
              <input
                type="date"
                value={unlockDate}
                min={today}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="bg-secondary/30 rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Share with partner?</span>
              <Switch checked={shared} onCheckedChange={setShared} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveLetter} disabled={!content.trim() || !unlockDate} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40">
              Seal this letter 💌
            </button>
            <button onClick={() => setWriting(false)} className="px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Letter list */}
      {letters.length === 0 && !writing ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No letters yet — your future self is waiting 🌸</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...letters].reverse().map((letter) => {
            const unlocked = isUnlocked(letter.unlockDate);
            return (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-2xl p-5 ${unlocked ? "bg-card" : "bg-secondary/30"}`}
              >
                {unlocked ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Written on {new Date(letter.createdAt).toLocaleDateString()}
                      </span>
                      {letter.shared && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">💕 Shared</span>}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{letter.content}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">Sealed letter</p>
                      <p className="text-xs">Opens on {new Date(letter.unlockDate).toLocaleDateString()} 🌙</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
