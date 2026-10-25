export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

export function pickOne<T>(items: readonly T[], exclude?: (item: T) => boolean): T | undefined {
  const pool = exclude ? items.filter((item) => !exclude(item)) : items;
  const from = pool.length > 0 ? pool : items;
  return from[Math.floor(Math.random() * from.length)];
}

/** Round-robin merge: [a1, b1, c1, a2, b2, ...]. Keeps the mix varied when sources differ in size. */
export function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const item = list[i];
      if (item !== undefined) out.push(item);
    }
  }
  return out;
}

export function uuid(): string {
  return crypto.randomUUID();
}
