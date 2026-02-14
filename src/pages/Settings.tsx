import { motion } from "framer-motion";
import { useSettings } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useSettings();

  const update = (patch: Partial<typeof settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary mb-1">Your Space, Your Rules ⚙️</h1>
        <p className="text-sm text-muted-foreground">Everything here is in your control.</p>
      </motion.div>

      {/* Sharing */}
      <div className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Sharing</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Global sharing</p>
            <p className="text-xs text-muted-foreground">Allow partner to see shared items</p>
          </div>
          <Switch checked={settings.globalSharing} onCheckedChange={(v) => update({ globalSharing: v })} />
        </div>
      </div>

      {/* Self-care categories */}
      <div className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Self-Care Categories</h2>
        {[
          { key: "showWater" as const, label: "💧 Water Intake" },
          { key: "showSkincare" as const, label: "🧴 Skincare" },
          { key: "showRest" as const, label: "😴 Rest & Sleep" },
          { key: "showPeriod" as const, label: "🌺 Period Awareness" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <p className="text-sm text-foreground">{label}</p>
            <Switch checked={settings[key]} onCheckedChange={(v) => update({ [key]: v })} />
          </div>
        ))}
      </div>

      {/* Emergency hide */}
      <div className="bg-destructive/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h2 className="font-display font-semibold text-foreground">Emergency</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Instantly hide everything behind a neutral screen. You can toggle this back anytime.
        </p>
        <button
          onClick={() => update({ hideEverything: !settings.hideEverything })}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
            settings.hideEverything
              ? "bg-accent text-accent-foreground"
              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
          }`}
        >
          {settings.hideEverything ? "Show Everything Again 🌸" : "Hide Everything 🚨"}
        </button>
      </div>
    </div>
  );
}
