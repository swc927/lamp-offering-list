export const LAMP_NUMBER = /^M\d{4}(?:[A-Z])?$/i;

const deceasedPrefix = /^(故|已故|仙逝|往生)\s*/u;
const deceasedTerms = /(众生|歷代|历代|祖宗|祖先|冤亲债主|deceased|sentient beings|all sentient beings)/iu;

export function classifyName(name) {
  const normalized = String(name || "").replace(/\s+/gu, " ").trim();
  const prefix = normalized.match(deceasedPrefix);
  return { name: prefix ? normalized.slice(prefix[0].length).trim() : normalized, deceased: Boolean(prefix || deceasedTerms.test(normalized)) };
}

export function normalizeDisplayName(name) {
  return String(name || "")
    .replace(/\bPTE\s+LTD\b/giu, "Pte Ltd")
    .replace(/\bSDN\s+BHD\b/giu, "Sdn Bhd")
    .replace(/\(\s*SM\s*\)/giu, "(SM)")
    .replace(/\s+/gu, " ")
    .trim();
}

export function parsePastedText(text) {
  return String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).map((raw, index) => {
    const line = raw.trim();
    if (!line) return null;
    const match = line.match(/^(\S+)\s+(.+)$/u);
    if (!match) return { line: index + 1, raw: line, error: "Expected a lamp number followed by a name." };
    return { line: index + 1, number: match[1].toUpperCase(), name: match[2].trim() };
  }).filter(Boolean);
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(columns => columns.some(value => value.trim())).map((columns, index) => ({ line: index + 1, number: String(columns[0] || "").trim().toUpperCase(), name: columns.slice(1).join(",").trim() }));
}

export function validateRows(rows) {
  const valid = [], issues = [], seen = new Map();
  for (const row of rows) {
    if (row.error) { issues.push({ line: row.line, message: row.error }); continue; }
    if (!LAMP_NUMBER.test(row.number || "")) { issues.push({ line: row.line, message: `Invalid lamp number “${row.number || "blank"}”. Use M0001 or M0001A format.` }); continue; }
    if (!row.name) { issues.push({ line: row.line, message: `${row.number} has no display name.` }); continue; }
    const displayName = normalizeDisplayName(row.name);
    const earlier = seen.get(row.number);
    if (earlier && earlier.name !== displayName) { issues.push({ line: row.line, message: `${row.number} conflicts with the different name on line ${earlier.line}.` }); continue; }
    if (!earlier) seen.set(row.number, { line: row.line, name: displayName });
    const classified = classifyName(displayName);
    if (!classified.name) { issues.push({ line: row.line, message: `${row.number} has no name after its deceased prefix.` }); continue; }
    valid.push({ ...row, ...classified });
  }
  return { valid, issues };
}

export function splitDisplayName(name, deceased = false) {
  const companyName = /\b(?:Pte Ltd|Sdn Bhd|Ltd|LLP|LLC|Inc|Corp|Corporation|Company|Co)\b/iu.test(name);
  if (!deceased && name.includes("@")) {
    const [first, ...rest] = name.split("@");
    return [first.trim(), `@${rest.join("@").trim()}`];
  }
  const commaParts = name.split(/\s*,\s*/u).filter(Boolean);
  if (commaParts.length === 2) return commaParts;
  const family = name.match(/^(.+?)\s+(&\s*Family)$/iu);
  if (family) return [family[1].trim(), "& Family"];
  const unborn = name.match(/^(Unborn\s+Child\s+Of)\s+(.+)$/iu);
  if (unborn) return [unborn[1].trim(), unborn[2].trim()];
  const parenthetical = name.match(/^(.+?)\s+(\([^()]+\))$/u);
  if (parenthetical) return [parenthetical[1].trim(), parenthetical[2].trim()];
  if (/[^\u0000-\u00ff]/u.test(name) && name.length > 5) {
    const midpoint = Math.ceil(name.length / 2);
    return [name.slice(0, midpoint).trim(), name.slice(midpoint).trim()];
  }
  const words = name.split(/\s+/u);
  if (companyName) return [name];
  if (words.length >= 3 && name.length > 16) {
    if (words.length === 4) {
      const asianSurnames = new Set(["ang", "chan", "chang", "cheong", "chew", "chin", "chong", "choo", "chua", "foo", "gan", "goh", "ho", "koh", "lee", "lim", "low", "ng", "ong", "pang", "phua", "quah", "seow", "sim", "tan", "tang", "tay", "teo", "toh", "vo", "wong", "wu", "yap", "yeo"]);
      const firstThree = words.slice(0, 3).join(" ");
      const lastLooksLikeEnglishName = words[3].length >= 6 && firstThree.length <= 16;
      if (asianSurnames.has(words[1].toLowerCase())) return [words[0], words.slice(1).join(" ")];
      return lastLooksLikeEnglishName
        ? [firstThree, words[3]]
        : [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
    }
    let bestIndex = 1;
    let bestDifference = Number.POSITIVE_INFINITY;
    for (let index = 1; index < words.length; index += 1) {
      const difference = Math.abs(words.slice(0, index).join(" ").length - words.slice(index).join(" ").length);
      if (difference < bestDifference) { bestDifference = difference; bestIndex = index; }
    }
    return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
  }
  return [name];
}
