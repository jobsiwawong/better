// Short quotes — a mix of gentle motivation and lighthearted fun. The pick
// rotates twice a day (once in the morning, once from noon).
const QUOTES: string[] = [
  "Small steps still move you forward.",
  "You don't have to do it all today — just the next thing.",
  "Progress over perfection, always.",
  "Done is better than perfect.",
  "Big things are just small things, stacked.",
  "Your future self is cheering you on.",
  "Focus is saying no to a hundred good ideas.",
  "A calm mind writes the best to-do list.",
  "One clear priority beats ten vague ones.",
  "Momentum loves a tiny first step.",
  "Be the calm in your own chaos.",
  "Today is a fresh page — go make a mark.",
  "Coffee first, conquer second.",
  "You're allowed to be a work in progress and a masterpiece at once.",
  "The secret to getting ahead is getting started.",
  "Slow is smooth, and smooth is fast.",
  "Tackle the frog before it grows.",
  "Rest is productive too.",
  "Great work is a series of small, brave choices.",
  "Make it happen, then make it look easy.",
  "Every expert was once a beginner with a messy desk.",
  "Discipline is choosing what you want most over what you want now.",
  "Little by little, a little becomes a lot.",
  "You've handled every hard day so far — 100% track record.",
];

export function quoteForNow(now: Date = new Date()): string {
  // Local day number, so it flips at local midnight and local noon.
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  const dayNumber = Math.floor(localMs / 86_400_000);
  const halfDay = now.getHours() < 12 ? 0 : 1;
  const idx = ((dayNumber * 2 + halfDay) % QUOTES.length + QUOTES.length) % QUOTES.length;
  return QUOTES[idx];
}
