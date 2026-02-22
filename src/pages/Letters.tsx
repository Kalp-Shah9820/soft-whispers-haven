import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLettersAPI } from "@/lib/store-api";
import { lettersAPI } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mail, Lock, Unlock, Plus, Edit3, Check, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function Letters() {
  const [letters, setLetters] = useLettersAPI();
  const [writing, setWriting] = useState(false);
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [shared, setShared] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const saveLetter = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      const { letter } = await lettersAPI.create({
        content,
        unlockDate: unlockDate || undefined,
        shared,
        sealed: !!unlockDate,
      });
      setLetters((prev) => [
        ...prev,
        {
          id: letter.id,
          content: letter.content,
          unlockDate: letter.unlockDate || "",
          shared: letter.shared,
          sealed: letter.sealed,
          createdAt: letter.createdAt,
        },
      ]);
      setContent("");
      setUnlockDate("");
      setShared(true);
      setWriting(false);
    } catch (error: any) {
      console.error("Failed to save letter:", error);
      toast.error(error?.message || "Couldn't save letter 💌");
    } finally {
      setSaving(false);
    }
  };

  const toggleSeal = async (id: string) => {
    const letter = letters.find((l) => l.id === id);
    if (!letter) return;
    const newSealed = !letter.sealed;
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, sealed: newSealed } : l)));
    try {
      await lettersAPI.update(id, { sealed: newSealed });
    } catch (error) {
      setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, sealed: !newSealed } : l)));
      toast.error("Couldn't update letter 💌");
    }
  };

  const toggleShare = async (id: string) => {
    const letter = letters.find((l) => l.id === id);
    if (!letter) return;
    const newShared = !letter.shared;
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, shared: newShared } : l)));
    try {
      await lettersAPI.update(id, { shared: newShared });
    } catch (error) {
      setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, shared: !newShared } : l)));
      toast.error("Couldn't update sharing 💌");
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = async (id: string) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, content: editContent } : l)));
    setEditingId(null);
    try {
      await lettersAPI.update(id, { content: editContent });
    } catch (error) {
      toast.error("Couldn't save edit 💌");
    }
  };

  const deleteLetter = async (id: string) => {
    const removed = letters.find((l) => l.id === id);
    setLetters((prev) => prev.filter((l) => l.id !== id));
    try {
      await lettersAPI.delete(id);
    } catch (error) {
      if (removed) setLetters((prev) => [...prev, removed]);
      toast.error("Couldn't delete letter 💌");
    }
  };

  const isUnlocked = (letter: { unlockDate: string; sealed: boolean }) => {
    if (!letter.sealed) return true;
    if (!letter.unlockDate) return true;
    return today >= letter.unlockDate;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-light text-primary mb-1">Letters to Myself 💌</h1>
        <p className="text-sm text-muted-foreground">Words from your heart, waiting to embrace you whenever you're ready.</p>
      </motion.div>

      {!writing ? (
        <button
          onClick={() => setWriting(true)}
          className="w-full bg-card rounded-3xl p-6 flex items-center justify-center gap-3 hover:shadow-sm transition-shadow text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-5 w-5" /> Write a letter to yourself
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl p-6 space-y-4">
          <Textarea
            placeholder="Dear me... 💌"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] border-none bg-secondary/30 rounded-xl p-4 resize-none focus-visible:ring-primary/30 leading-relaxed"
          />
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Seal until a date? (optional)</label>
              <input
                type="date"
                value={unlockDate}
                min={today}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="bg-secondary/30 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Share with partner? 💕</span>
              <Switch checked={shared} onCheckedChange={setShared} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveLetter} disabled={!content.trim() || saving} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40">
              {saving ? "Saving…" : "Save letter 💌"}
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
          <p className="text-muted-foreground">No letters yet — your future self is waiting with open arms 🌸</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...letters].reverse().map((letter) => {
            const unlocked = isUnlocked(letter);
            return (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-3xl p-5 ${unlocked ? "bg-card" : "bg-secondary/30"}`}
              >
                {unlocked ? (
                  <div className="space-y-3">
                    {editingId === letter.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px] border-none bg-secondary/30 rounded-xl p-3 text-sm resize-none focus-visible:ring-primary/30"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(letter.id)} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-secondary/40 text-muted-foreground hover:bg-secondary/60">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Written on {new Date(letter.createdAt).toLocaleDateString()}
                          </span>
                          {letter.shared && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">💕 Shared</span>}
                          {letter.sealed && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">🔒 Sealed</span>}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{letter.content}</p>
                      </>
                    )}

                    {/* Action buttons */}
                    {editingId !== letter.id && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => startEdit(letter.id, letter.content)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary/40 text-muted-foreground hover:bg-secondary/60 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => toggleSeal(letter.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary/40 text-muted-foreground hover:bg-secondary/60 transition-colors"
                        >
                          {letter.sealed ? <><Unlock className="h-3 w-3" /> Unseal</> : <><Lock className="h-3 w-3" /> Seal</>}
                        </button>
                        <button
                          onClick={() => toggleShare(letter.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary/40 text-muted-foreground hover:bg-secondary/60 transition-colors"
                        >
                          {letter.shared ? "🔒 Make private" : "💕 Share"}
                        </button>
                        <button
                          onClick={() => deleteLetter(letter.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Let go
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium">Sealed letter</p>
                        <p className="text-xs">Opens on {new Date(letter.unlockDate).toLocaleDateString()} 🌙</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSeal(letter.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-secondary/40 text-muted-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Unlock className="h-3 w-3" /> Unseal
                    </button>
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
