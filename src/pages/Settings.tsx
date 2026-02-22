import { motion } from "framer-motion";
import { type CurrentNeed } from "@/lib/store";
import { useSettingsAPI, useRoleAPI } from "@/lib/store-api";
import { Switch } from "@/components/ui/switch";
import { Shield, LogOut, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHideMode } from "@/lib/hideMode";
import { toast } from "@/components/ui/sonner";
import { settingsAPI } from "@/lib/api";
import { useState } from "react";

const NEEDS: { value: CurrentNeed; label: string; emoji: string }[] = [
  { value: "rest", label: "Rest", emoji: "😴" },
  { value: "motivation", label: "Motivation", emoji: "✨" },
  { value: "space", label: "Space", emoji: "🌊" },
  { value: "support", label: "Support", emoji: "💗" },
  { value: "silence", label: "Silence", emoji: "🤫" },
  { value: "gentle-reminders", label: "Gentle reminders", emoji: "🌿" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useSettingsAPI();
  const [, setRole] = useRoleAPI();
  const navigate = useNavigate();
  const { hideMode, enterHideMode, exitHideMode } = useHideMode();
  const [activating, setActivating] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const update = (patch: Partial<typeof settings>) => setSettings((prev) => ({ ...prev, ...patch }));
  const updateIdentity = (patch: Partial<typeof settings.identity>) =>
    update({ identity: { ...settings.identity, ...patch } });

  const handleActivateNotifications = async () => {
    const { name, phone, partnerName, partnerPhone } = settings.identity;

    if (!phone?.trim()) {
      toast.error("Please enter your phone number first 💛");
      return;
    }

    setActivating(true);
    try {
      // Step 1: save name + partner name + phones to DB so notification messages use real names
      await settingsAPI.update({
        identity: {
          name: name || "",
          phone: phone || "",
          partnerName: partnerName || "",
          partnerPhone: partnerPhone || "",
        },
      });

      // Step 2: flip notificationsEnabled flag and link partner
      await settingsAPI.activateNotifications({
        userPhone: phone || "",
        partnerPhone: partnerPhone || "",
        userName: name || "",
        partnerName: partnerName || "",
      });

      toast.success(`Notifications activated for ${name || "you"} 💚`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to activate notifications");
    } finally {
      setActivating(false);
    }
  };

  const handleSaveName = async () => {
    const { name, partnerName } = settings.identity;
    setSavingName(true);
    setNameSaved(false);
    try {
      await settingsAPI.update({
        identity: {
          name: name || "",
          phone: settings.identity.phone || "",
          partnerName: partnerName || "",
          partnerPhone: settings.identity.partnerPhone || "",
        },
      });
      setNameSaved(true);
      toast.success(`Saved! I'll call you "${name || "lovely"}" in all notifications 💕`);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save name 🌙");
    } finally {
      setSavingName(false);
    }
  };

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
            <label className="text-sm text-muted-foreground block mb-1">Partner&apos;s nickname (optional)</label>
            <input
              type="text"
              placeholder="What do you call them?"
              value={settings.identity.partnerName}
              onChange={(e) => updateIdentity({ partnerName: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveName}
          disabled={savingName}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {savingName ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : nameSaved ? (
            <><Check className="h-3.5 w-3.5" /> Saved 💕</>
          ) : (
            "Save name for notifications 💌"
          )}
        </button>
      </div>

      {/* Phone numbers for WhatsApp notifications */}
      <div className="bg-card rounded-3xl p-5 space-y-4">
        <h2 className="font-display text-lg font-light text-foreground">📲 WhatsApp Notifications</h2>
        <p className="text-xs text-muted-foreground">
          Add phone numbers with country code (e.g. +91 98765 43210). Both of you will get gentle reminders and
          updates.
        </p>
        <p className="text-xs text-emerald-500">
          Notifications are active 💚 — once you save your numbers, gentle WhatsApp reminders will arrive automatically.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Your phone number</label>
            <input
              type="tel"
              placeholder="+91 82919 12131"
              value={settings.identity.phone}
              onChange={(e) => updateIdentity({ phone: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You’ll get: water reminders, self-care time, daily motivation, period care.
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Partner’s phone number</label>
            <input
              type="tel"
              placeholder="+91 72080 42263"
              value={settings.identity.partnerPhone}
              onChange={(e) => updateIdentity({ partnerPhone: e.target.value })}
              className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              They’ll get: when you share dreams, thoughts, letters, mood; when you complete a self-care task.
            </p>
          </div>
          <button
            type="button"
            onClick={handleActivateNotifications}
            disabled={activating}
            className="w-full mt-2 px-4 py-3 rounded-xl bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {activating ? "Activating…" : "Activate WhatsApp Notifications 💚"}
          </button>
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm transition-all ${settings.currentNeed === need.value
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
                className={`px-4 py-2 rounded-full text-sm transition-all ${settings.waterReminderFrequency === h
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
          onClick={() => (hideMode ? exitHideMode() : enterHideMode())}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${hideMode
            ? "bg-accent text-accent-foreground"
            : "bg-destructive/20 text-destructive hover:bg-destructive/30"
            }`}
        >
          {hideMode ? "Show Everything Again 🌸" : "Hide Everything 🚨"}
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
