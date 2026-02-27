export function now() {
  return Date.now();
}

export function countSentences(text: string) {
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) return 0;
  // Split by Chinese punctuation or English punctuation or newlines
  const parts = cleaned
    .split(/[.。！？!?]\s*|\n+/)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length;
}

export function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const englishWords = trimmed.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  const cjkChars = trimmed.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  // heuristic: 2 CJK chars ≈ 1 "word"
  return englishWords + Math.ceil(cjkChars / 2);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * In-place Fisher–Yates shuffle returning a new shuffled array.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function getOrCreatePostAOrder(): number[] {
  const key = "postA_order_v2";
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "number")) return parsed;
    } catch {}
  }
  const order = shuffle([0, 2, 3, 1]); // PQ(0), IA(2), PAu(3), BAA(1)
  sessionStorage.setItem(key, JSON.stringify(order));
  return order;
}

