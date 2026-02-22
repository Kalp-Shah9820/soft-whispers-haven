// ---------------------------------------------------------------------------
// Motivational messages — 30 unique entries so daily rotation feels fresh
// ---------------------------------------------------------------------------
export const MOTIVATIONAL_MESSAGES = [
  "You are enough, just as you are 🌸",
  "Today is a lovely day to be gentle with yourself 💛",
  "Your dreams matter — even the quiet ones 🌙",
  "Take your time, darling. There's no rush here 🍃",
  "You're doing so much better than you think ✨",
  "Rest is not giving up — it's giving back to yourself 🌿",
  "Every small step counts, even standing still 💜",
  "You deserve all the softness today 🌷",
  "It's okay to not be okay. You're safe here 💕",
  "Breathe gently. You belong in this moment 🌊",
  "Your feelings are valid, every single one 🦋",
  "Be proud of how far you've come, love 🌈",
  "You carry more strength than you know 🌻",
  "Let today be gentle with you 🕊️",
  "The world is brighter with you in it 💗",
  "You are worthy of care, especially from yourself 🌺",
  "Small acts of self-love add up beautifully 🍀",
  "Your sensitivity is a gift, not a burden 💎",
  "Today, let's celebrate that you showed up 🎀",
  "Be the kindness you so freely give others 🤍",
  "You're allowed to take up space 🌙",
  "Healing looks different every day — and that's okay 🌱",
  "Some days just surviving is the win 🦅",
  "Your pace is perfect exactly as it is 🐚",
  "You don't have to have it all figured out 🌤️",
  "Rest, reset, and return softer 🕯️",
  "Feeling everything this deeply is a kind of courage 💜",
  "Every breath you take is an act of self-care 🌬️",
  "You are loved more than words can say 💓",
  "Today is yours — use it gently 🌷",
];

/**
 * Returns a consistent daily message (same message all day, changes at midnight).
 * Deterministic: uses day-of-year so it's reproducible and testable.
 */
export function getDailyMessage(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
}

// ---------------------------------------------------------------------------
// Water reminder — randomised each send, uses user's first name
// ---------------------------------------------------------------------------
export function getWaterReminderMessage(name?: string): string {
  const n = name || "love";
  const options = [
    `💧 Hey ${n}, time to drink some water 🌸`,
    `💧 A little water break? You deserve it, ${n} 🌿`,
    `💧 Hydration reminder with love, ${n} 💧`,
    `💧 Your body is asking for a sip, sweetheart 💛`,
    `💧 Don't forget to hydrate, ${n} — you matter 🌊`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}

// ---------------------------------------------------------------------------
// Skincare reminders
// ---------------------------------------------------------------------------
export function getSkincareReminderMessage(isMorning: boolean, name?: string): string {
  const n = name || "love";
  if (isMorning) {
    return `☀️ Morning skincare time, ${n} — let's start the day beautifully 🌸`;
  }
  return `🌙 Evening skincare time — let's take care of you, ${n} 💛`;
}

// ---------------------------------------------------------------------------
// Period care — 4 rotating variants so 4 sends/day feel different
// ---------------------------------------------------------------------------
const PERIOD_MESSAGES = [
  (n: string) => `💗 Your cycle may be approaching, ${n}. Take it easy today 🌸`,
  (n: string) => `🌺 Extra gentleness today — your body is doing something beautiful, ${n} 💛`,
  (n: string) => `💗 Warm drink? Heating pad? You deserve comfort right now, ${n} 🍀`,
  (n: string) => `🌸 Be soft with yourself today, ${n}. Your body is working hard 💜`,
];

export function getPeriodCareMessage(name?: string, sendCount = 0): string {
  const n = name || "love";
  return PERIOD_MESSAGES[sendCount % PERIOD_MESSAGES.length](n);
}

// ---------------------------------------------------------------------------
// Emotional check-in — 3 variants per need so 3 sends/day feel distinct
// ---------------------------------------------------------------------------
const CHECKIN_MESSAGES: Record<string, ((n: string) => string)[]> = {
  REST: [
    (n) => `😴 How are you feeling now, ${n}? You mentioned needing rest 💛`,
    (n) => `😴 Just checking in — are you getting the rest you need, ${n}? 🌙`,
    (n) => `😴 Gentle nudge: have you rested at all today, ${n}? 🤍`,
  ],
  MOTIVATION: [
    (n) => `✨ Checking in — do you need a little motivation today, ${n}? 🌸`,
    (n) => `✨ You've got this, ${n} — want to log how you're feeling? 💜`,
    (n) => `✨ A small reminder that you're doing great, ${n} 🌈`,
  ],
  SUPPORT: [
    (n) => `💗 How are you doing, ${n}? I'm here if you need support 🤍`,
    (n) => `💗 Thinking of you, ${n} — how's your heart today? 🌺`,
    (n) => `💗 You don't have to carry everything alone, ${n} 💛`,
  ],
  SPACE: [
    (n) => `🌊 Sending you space and peace, ${n} 🕊️`,
    (n) => `🌊 Just a gentle presence — no pressure, ${n} 🍃`,
    (n) => `🌊 The world can wait. How are you, ${n}? 💙`,
  ],
};

export function getEmotionalCheckinMessage(need: string, name?: string, sendCount = 0): string {
  const n = name || "love";
  const variants = CHECKIN_MESSAGES[need];
  if (!variants) return `💛 Just checking in with you, ${n} 🌸`;
  return variants[sendCount % variants.length](n);
}

// ---------------------------------------------------------------------------
// Partner event notifications
// ---------------------------------------------------------------------------
export function partnerMsg(event: "mood" | "dream" | "thought" | "letter" | "selfcare" | "need", name: string): string {
  const n = name || "Your partner";
  switch (event) {
    case "mood": return `💛 ${n} logged her mood today.`;
    case "dream": return `🌙 ${n} shared a dream with you.`;
    case "thought": return `💭 ${n} shared a thought with you.`;
    case "letter": return `💌 You received a letter from ${n}.`;
    case "selfcare": return `🌿 ${n} completed a self-care step.`;
    case "need": return `❤️ ${n} updated what she needs right now.`;
  }
}
