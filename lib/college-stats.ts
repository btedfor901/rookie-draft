const CFBD_BASE = "https://api.collegefootballdata.com";

export interface CollegeStatLine {
  passYds?: number;
  passTD?: number;
  passInt?: number;
  passAtt?: number;
  passCmp?: number;
  passPct?: number;
  rushYds?: number;
  rushTD?: number;
  rushAtt?: number;
  rec?: number;
  recYds?: number;
  recTD?: number;
}

interface CfbdStatRow {
  player: string;
  team: string;
  category: string;
  statType: string;
  stat: number;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv)$/i, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

async function fetchCategory(year: number, category: string, apiKey: string): Promise<CfbdStatRow[]> {
  const url = `${CFBD_BASE}/stats/player/season?year=${year}&category=${category}&seasonType=regular`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 86400 }, // cache 24hrs — stats don't change after season ends
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCollegeStats(year: number): Promise<Map<string, CollegeStatLine>> {
  const apiKey = process.env.CFBD_API_KEY;
  if (!apiKey) return new Map();

  const [passing, rushing, receiving] = await Promise.all([
    fetchCategory(year, "passing", apiKey),
    fetchCategory(year, "rushing", apiKey),
    fetchCategory(year, "receiving", apiKey),
  ]);

  const map = new Map<string, CollegeStatLine>();

  function upsert(name: string, update: Partial<CollegeStatLine>) {
    const key = normalizeName(name);
    const existing = map.get(key) ?? {};
    map.set(key, { ...existing, ...update });
  }

  // Pivot flat rows into player stat objects — coerce stat to number since API may return strings
  for (const row of passing) {
    const n = row.player;
    const v = Number(row.stat);
    if (row.statType === "YDS")  upsert(n, { passYds: v });
    if (row.statType === "TD")   upsert(n, { passTD: v });
    if (row.statType === "INT")  upsert(n, { passInt: v });
    if (row.statType === "ATT")  upsert(n, { passAtt: v });
    if (row.statType === "COMP") upsert(n, { passCmp: v });
    if (row.statType === "PCT")  upsert(n, { passPct: v });
  }
  for (const row of rushing) {
    const n = row.player;
    const v = Number(row.stat);
    if (row.statType === "YDS") upsert(n, { rushYds: v });
    if (row.statType === "TD")  upsert(n, { rushTD: v });
    if (row.statType === "CAR") upsert(n, { rushAtt: v });
  }
  for (const row of receiving) {
    const n = row.player;
    const v = Number(row.stat);
    if (row.statType === "REC") upsert(n, { rec: v });
    if (row.statType === "YDS") upsert(n, { recYds: v });
    if (row.statType === "TD")  upsert(n, { recTD: v });
  }

  return map;
}

// Look up stats by player's full name, tolerating Jr./Sr./suffix differences
export function lookupStats(
  name: string,
  statsMap: Map<string, CollegeStatLine>
): CollegeStatLine | null {
  const key = normalizeName(name);
  return statsMap.get(key) ?? null;
}

export function formatStatLine(pos: string, s: CollegeStatLine): string {
  const fmt = (n?: number) => (n ?? 0).toLocaleString();
  if (pos === "QB") {
    const parts: string[] = [];
    if (s.passYds) parts.push(`${fmt(s.passYds)} YDS`);
    if (s.passTD)  parts.push(`${s.passTD} TD`);
    if (s.passInt !== undefined) parts.push(`${s.passInt} INT`);
    if (s.passPct) parts.push(`${s.passPct.toFixed(1)}%`);
    return parts.join(" · ");
  }
  if (pos === "RB") {
    const rush: string[] = [];
    const recParts: string[] = [];
    if (s.rushYds) rush.push(`${fmt(s.rushYds)} YDS`);
    if (s.rushTD)  rush.push(`${s.rushTD} TD`);
    if (s.rec)     recParts.push(`${s.rec} REC`);
    if (s.recYds)  recParts.push(`${fmt(s.recYds)} YDS`);
    const combined = [...rush, ...recParts];
    return combined.join(" · ");
  }
  if (pos === "WR" || pos === "TE") {
    const parts: string[] = [];
    if (s.rec)    parts.push(`${s.rec} REC`);
    if (s.recYds) parts.push(`${fmt(s.recYds)} YDS`);
    if (s.recTD)  parts.push(`${s.recTD} TD`);
    return parts.join(" · ");
  }
  return "";
}
