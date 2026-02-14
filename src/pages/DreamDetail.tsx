import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDreams, genId, TARGET_STATE_LABELS, type TargetState, type Mood } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

const MOODS: Mood[] = ["😊", "😌", "🌸", "💭", "🌙", "✨", "💪", "🥺", "😴", "🌈"];
const STATES: TargetState[] = ["starting", "in-progress", "feels-good", "resting"];

export default function DreamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dreams, setDreams] = useDreams();
  const dream = dreams.find((d) => d.id === id);
  const [newTarget, setNewTarget] = useState("");

  if (!dream) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">This dream seems to have floated away 🌙</p>
        <Link to="/dreams" className="text-primary text-sm mt-4 inline-block hover:underline">← Back to dreams</Link>
      </div>
    );
  }

  const update = (patch: Partial<typeof dream>) => {
    setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)));
  };

  const addTarget = () => {
    if (!newTarget.trim()) return;
    update({ targets: [...dream.targets, { id: genId(), dreamId: dream.id, text: newTarget, state: "starting", shared: false }] });
    setNewTarget("");
  };

  const updateTarget = (targetId: string, patch: any) => {
    update({ targets: dream.targets.map((t) => (t.id === targetId ? { ...t, ...patch } : t)) });
  };

  const removeTarget = (targetId: string) => {
    update({ targets: dream.targets.filter((t) => t.id !== targetId) });
  };

  const deleteDream = () => {
    setDreams((prev) => prev.filter((d) => d.id !== id));
    navigate("/dreams");
  };

  return (
    <div className="space-y-6">
      <Link to="/dreams" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> My Dreams
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{dream.mood}</span>
          <input
            type="text"
            value={dream.title}
            onChange={(e) => update({ title: e.target.value })}
            className="text-2xl font-display font-bold bg-transparent border-none focus:outline-none flex-1 text-foreground"
          />
        </div>

        {/* Mood picker */}
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => update({ mood: m })}
              className={`text-lg p-1.5 rounded-lg transition-all ${dream.mood === m ? "bg-primary/20 scale-110" : "hover:bg-secondary/50"}`}
            >
              {m}
            </button>
          ))}
        </div>

        <Textarea
          value={dream.content}
          onChange={(e) => update({ content: e.target.value })}
          className="min-h-[180px] border-none bg-card/50 rounded-2xl p-5 text-base resize-none focus-visible:ring-primary/30"
        />

        <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3">
          <span className="text-sm text-muted-foreground">Share this dream?</span>
          <Switch checked={dream.shared} onCheckedChange={(v) => update({ shared: v })} />
        </div>
      </motion.div>

      {/* Gentle targets */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">Gentle Steps 🌱</h2>

        {dream.targets.map((target) => {
          const info = TARGET_STATE_LABELS[target.state];
          return (
            <motion.div key={target.id} layout className="bg-card rounded-xl p-4 space-y-3">
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
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        target.state === s ? "bg-primary/20 text-primary font-medium" : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {si.emoji} {si.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground italic">{info.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Share this step?</span>
                <Switch checked={target.shared} onCheckedChange={(v) => updateTarget(target.id, { shared: v })} className="scale-75" />
              </div>
            </motion.div>
          );
        })}

        {/* Add target */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a gentle step..."
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTarget()}
            className="flex-1 bg-card rounded-xl px-4 py-3 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={addTarget} className="p-3 bg-primary/20 rounded-xl hover:bg-primary/30 transition-colors text-primary">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete */}
      <button onClick={deleteDream} className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-8">
        Let go of this dream
      </button>
    </div>
  );
}
