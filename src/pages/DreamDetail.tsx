import { useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDreamsAPI } from "@/lib/store-api";
import { dreamsAPI, mapMoodToDB, mapTargetStateToDB, mapTargetStateFromDB } from "@/lib/api";
import { TARGET_STATE_LABELS, type TargetState, type Mood } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const MOODS: Mood[] = ["😊", "😌", "🌸", "💭", "🌙", "✨", "💪", "🥺", "😴", "🌈"];
const STATES: TargetState[] = ["starting", "in-progress", "feels-good", "resting"];

const genTempId = () => `temp-${Math.random().toString(36).slice(2, 10)}`;

export default function DreamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dreams, setDreams] = useDreamsAPI();

  // ── ALL hooks must be declared before any early return ──────────────────
  const [newTarget, setNewTarget] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Toast dedup: same message within 5 s is suppressed
  const lastToastRef = useRef<{ msg: string; at: number }>({ msg: "", at: 0 });

  const showError = useCallback((msg: string) => {
    const now = Date.now();
    if (lastToastRef.current.msg === msg && now - lastToastRef.current.at < 5000) return;
    lastToastRef.current = { msg, at: now };
    toast.error(msg);
  }, []);

  const update = useCallback(
    (patch: Partial<{ title: string; content: string; mood: Mood; shared: boolean; targets: any[] }>) => {
      const now = new Date().toISOString();
      setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now } : d)));

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const apiPatch: Record<string, any> = {};
          if ("title" in patch) apiPatch.title = patch.title;
          if ("content" in patch) apiPatch.content = patch.content;
          if ("mood" in patch) apiPatch.mood = mapMoodToDB(patch.mood as string);
          if ("shared" in patch) apiPatch.shared = patch.shared;
          if ("targets" in patch) {
            apiPatch.targets = (patch.targets || []).map((t) => ({
              id: t.id.startsWith("temp-") ? undefined : t.id,
              text: t.text,
              state: mapTargetStateToDB(t.state),
              shared: t.shared,
            }));
          }
          const { dream: updated } = await dreamsAPI.update(id!, apiPatch);
          if (updated?.targets) {
            setDreams((prev) =>
              prev.map((d) =>
                d.id === id
                  ? {
                    ...d,
                    targets: updated.targets.map((t: any) => ({
                      id: t.id,
                      dreamId: t.dreamId,
                      text: t.text,
                      state: mapTargetStateFromDB(t.state),
                      shared: t.shared,
                    })),
                  }
                  : d
              )
            );
          }
        } catch (error: any) {
          const msg = error?.message?.includes("Access denied")
            ? "Access denied — please refresh 🌙"
            : "Couldn't save changes 🌙";
          showError(msg);
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [id, setDreams, showError]
  );
  // ────────────────────────────────────────────────────────────────────────

  // Early return AFTER all hooks
  const dream = dreams.find((d) => d.id === id);
  if (!dream) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground text-lg">This dream seems to have floated away 🌙</p>
        <Link to="/dreams" className="text-primary text-sm hover:underline">← Back to dreams</Link>
      </div>
    );
  }

  const addTarget = () => {
    if (!newTarget.trim()) return;
    update({
      targets: [
        ...dream.targets,
        { id: genTempId(), dreamId: dream.id, text: newTarget, state: "starting", shared: true },
      ],
    });
    setNewTarget("");
  };

  const updateTarget = (targetId: string, patch: any) =>
    update({ targets: dream.targets.map((t) => (t.id === targetId ? { ...t, ...patch } : t)) });

  const removeTarget = (targetId: string) =>
    update({ targets: dream.targets.filter((t) => t.id !== targetId) });

  const deleteDream = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await dreamsAPI.delete(id);
      setDreams((prev) => prev.filter((d) => d.id !== id));
      toast.success("Dream released 🌙");
      navigate("/dreams");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete dream");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dreams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> My Dreams
        </Link>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </span>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{dream.mood}</span>
          <input
            type="text"
            value={dream.title}
            onChange={(e) => update({ title: e.target.value })}
            className="text-2xl font-display font-light bg-transparent border-none focus:outline-none flex-1 text-foreground"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => update({ mood: m })}
              className={`text-lg p-1.5 rounded-xl transition-all ${dream.mood === m ? "bg-primary/20 scale-110" : "hover:bg-secondary/50"}`}
            >
              {m}
            </button>
          ))}
        </div>

        <Textarea
          value={dream.content}
          onChange={(e) => update({ content: e.target.value })}
          className="min-h-[180px] border-none bg-card/50 rounded-2xl p-5 text-base resize-none focus-visible:ring-primary/30 leading-relaxed"
        />

        <div className="flex items-center justify-between bg-card rounded-2xl px-4 py-3">
          <span className="text-sm text-muted-foreground">Share this dream? 💕</span>
          <Switch checked={dream.shared} onCheckedChange={(v) => update({ shared: v })} />
        </div>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-lg font-display font-light text-foreground">Gentle Steps 🌱</h2>

        {dream.targets.map((target) => {
          const info = TARGET_STATE_LABELS[target.state];
          return (
            <motion.div key={target.id} layout className="bg-card rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground flex-1">{target.text}</p>
                <button onClick={() => removeTarget(target.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATES.map((s) => {
                  const si = TARGET_STATE_LABELS[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateTarget(target.id, { state: s })}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${target.state === s ? "bg-primary/20 text-primary font-medium" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"}`}
                    >
                      {si.emoji} {si.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground italic">{info.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Share this step? 💕</span>
                <Switch checked={target.shared} onCheckedChange={(v) => updateTarget(target.id, { shared: v })} className="scale-75" />
              </div>
            </motion.div>
          );
        })}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a gentle step..."
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTarget()}
            className="flex-1 bg-card rounded-2xl px-4 py-3 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={addTarget} className="p-3 bg-primary/20 rounded-2xl hover:bg-primary/30 transition-colors text-primary">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={deleteDream}
        disabled={deleting}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {deleting ? <><Loader2 className="h-3 w-3 animate-spin" /> Letting go…</> : "Gently let go of this dream"}
      </button>
    </div>
  );
}
