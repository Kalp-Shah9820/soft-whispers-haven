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
];

export function getDailyMessage(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
}

export function getWaterReminderMessage(name?: string): string {
  const greetings = [
    `💧 Time for a gentle sip of water, ${name || "love"} 🌸`,
    `💧 Your body is asking for hydration, sweetheart 💛`,
    `💧 A little water break? You deserve it 🌿`,
    `💧 Hydration reminder with love 💧`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getSkincareReminderMessage(isMorning: boolean, name?: string): string {
  if (isMorning) {
    return `☀️ Good morning, ${name || "love"}! Time for your morning skincare routine 🌸`;
  }
  return `🌙 Evening skincare time, ${name || "darling"} — let's take care of you 💛`;
}

export function getPeriodCareMessage(name?: string): string {
  const messages = [
    `🌺 Gentle reminder: Your cycle might be starting soon. Be extra kind to yourself, ${name || "love"} 💗`,
    `🌺 A few days before your expected cycle — take it easy, sweetheart 🌸`,
    `🌺 Self-care reminder: Your body might need extra gentleness soon 💛`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getEmotionalCheckinMessage(need: string, name?: string): string {
  const messages: Record<string, string> = {
    REST: `😴 You mentioned needing rest — how are you feeling now, ${name || "love"}? 💛`,
    MOTIVATION: `✨ Checking in — do you need a little motivation boost today? 🌸`,
    SUPPORT: `💗 How are you doing? I'm here if you need support 🤍`,
    SPACE: `🌊 Sending you space and peace, ${name || "darling"} 🕊️`,
  };
  return messages[need] || `💛 Just checking in with you, ${name || "love"} 🌸`;
}
