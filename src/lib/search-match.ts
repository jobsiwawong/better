export interface Snippet {
  before: string;
  match: string;
  after: string;
}

// Split a search query into individual lowercased terms.
export function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// True when every term appears somewhere in the combined haystack.
export function matchesAllTerms(haystack: string, terms: string[]): boolean {
  const lower = haystack.toLowerCase();
  return terms.every((t) => lower.includes(t));
}

// Build a snippet of `body` around the first matching term, for context.
// Returns null when no term is found in the body.
export function bodySnippet(
  body: string,
  terms: string[],
  radius = 32
): Snippet | null {
  if (!body) return null;
  const lower = body.toLowerCase();

  let hitIndex = -1;
  let hitTerm = "";
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i >= 0 && (hitIndex === -1 || i < hitIndex)) {
      hitIndex = i;
      hitTerm = term;
    }
  }
  if (hitIndex === -1) return null;

  const start = Math.max(0, hitIndex - radius);
  const end = Math.min(body.length, hitIndex + hitTerm.length + radius);

  return {
    before: (start > 0 ? "…" : "") + body.slice(start, hitIndex),
    match: body.slice(hitIndex, hitIndex + hitTerm.length),
    after: body.slice(hitIndex + hitTerm.length, end) + (end < body.length ? "…" : ""),
  };
}
