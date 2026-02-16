import { motion } from "framer-motion";
import { useSettings, useRole, type CurrentNeed } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NEEDS: { value: CurrentNeed; label: string; emoji: string }[] = [
  { value: "rest", label: "Rest", emoji: "😴" },
  { value: "motivation", label: "Motivation", emoji: "✨" },
  { value: "space", label: "Space", emoji: "🌊" },
  { value: "support", label: "Support", emoji: "💗" },
  { value: "silence", label: "Silence", emoji: "🤫" },
  { value: "gentle-reminders", label: "Gentle reminders", emoji: "🌿" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const [, setRole] = useRole();
  const navigate = useNavigate();

  const update = (patch: Partial<typeof settings>) => setSettings((prev) => ({ ...prev, ...patch }));
  const updateIdentity = (patch: Partial<typeof settings.identity>) =>
    update({ identity: { ...settings.identity, ...patch } });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-light text-primary mb-1">Your Space, Your Rules ⚙️</h1>
        <p className="text-sm text-muted-foreground">Everything here is lovingly in your control.</p>
      </motion.div>

      {/* Identity */}
      <div className="bg-card rounded-3xl p-5 space-y-4">
        <h2 className="font-display text-lg font-light text-foreground">Who You Are 🌸</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">What should I call you?</label>
            <input
              type="text"
              placeholder="Your name or nickname..."
              value={settings.identity.name}
              onChange={(e) => updateIdentity({ name: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Your phone number (optional)</label>
            <input
              type="tel"
              placeholder="Just for you..."
              value={settings.identity.phone}
              onChange={(e) => updateIdentity({ phone: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Partner's nickname (optional)</label>
            <input
              type="text"
              placeholder="What do you call them?"
              value={settings.identity.partnerName}
              onChange={(e) => updateIdentity({ partnerName: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Right now need */}
      <div className="bg-card rounded-3xl p-5 space-y-4">
        <h2 className="font-display text-lg font-light text-foreground">Right now, what do you need? 💛</h2>
        <p className="text-xs text-muted-foreground">This gently adjusts how the website feels for you.</p>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((need) => (
            <button
              key={need.value}
              onClick={() => update({ currentNeed: need.value })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm transition-all ${
                settings.currentNeed === need.value
                  ? "bg-primary/20 text-primary scale-105"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <span>{need.emoji}</span> {need.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sharing */}
      <div className="bg-card rounded-3xl p-5 space-y-4">
        <h2 className="font-display text-lg font-light text-foreground">Sharing</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Global sharing</p>
            <p className="text-xs text-muted-foreground">Let your partner see shared items</p>
          </div>
          <Switch checked={settings.globalSharing} onCheckedChange={(v) => update({ globalSharing: v })} />
        </div>
      </div>

      {/* Self-care categories */}
      <div className="bg-card rounded-3xl p-5 space-y-4">
        <h2 className="font-display text-lg font-light text-foreground">Self-Care Categories</h2>
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

      {/* Water reminder frequency */}
      {settings.showWater && (
        <div className="bg-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-light text-foreground">💧 Water Reminder</h2>
          <p className="text-xs text-muted-foreground">How often would you like a gentle nudge?</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                onClick={() => update({ waterReminderFrequency: h })}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  settings.waterReminderFrequency === h
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                Every {h}h
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Period awareness */}
      {settings.showPeriod && (
        <div className="bg-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display text-lg font-light text-foreground">🌺 Period Tracking</h2>
          <p className="text-xs text-muted-foreground">This is completely private and never shared.</p>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Last period start date</label>
            <input
              type="date"
              value={settings.periodStartDate}
              onChange={(e) => update({ periodStartDate: e.target.value })}
              className="bg-secondary/30 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Emergency hide */}
      <div className="bg-destructive/10 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-lg font-light text-foreground">Emergency</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Instantly hide everything behind a neutral screen. You can always come back.
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

      {/* Switch role */}
      <button
        onClick={() => navigate("/role")}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
      >
        <LogOut className="h-4 w-4" /> Switch to role selection
      </button>
    </div>
  );
}
