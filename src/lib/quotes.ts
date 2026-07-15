// Short, wholesome quotes — gentle, kind, human (deliberately not
// work/productivity flavored). The pick rotates twice a day.
const QUOTES: string[] = [
  "You are exactly where you need to be.",
  "Be kind to yourself — you're doing better than you think.",
  "Breathe. This moment is enough.",
  "You don't have to earn rest.",
  "Softness is a kind of strength.",
  "Let today be gentle.",
  "You've survived every hard day so far — 100% track record.",
  "Growing slowly is still growing.",
  "Talk to yourself like someone you love.",
  "The sun doesn't rush, and it still rises.",
  "You are allowed to take up space.",
  "Some days the bravest thing is simply beginning again.",
  "Drink some water. Stretch. You're a whole ecosystem.",
  "Little joys count double.",
  "Your pace is a good pace.",
  "It's okay to be a rough draft today.",
  "Look how far you've come, quietly.",
  "Peace is a direction, not a destination.",
  "You can start over as many times as you need.",
  "Even the moon has phases — so can you.",
  "Warmth given away always finds its way back.",
  "Nothing blooms all year, and that's fine.",
  "Today, let 'good enough' be wonderful.",
  "You are someone's reason to smile.",
];

export function quoteForNow(now: Date = new Date()): string {
  // Local day number, so it flips at local midnight and local noon.
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  const dayNumber = Math.floor(localMs / 86_400_000);
  const halfDay = now.getHours() < 12 ? 0 : 1;
  const idx = ((dayNumber * 2 + halfDay) % QUOTES.length + QUOTES.length) % QUOTES.length;
  return QUOTES[idx];
}
