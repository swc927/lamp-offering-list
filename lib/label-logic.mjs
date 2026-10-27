export const LAMP_NUMBER = /^M\d{4}$/i;

const deceasedPrefix = /^(故|已故|仙逝|往生)\s*/u;
const deceasedTerms = /(众生|歷代|历代|祖宗|祖先|冤亲债主|sentient beings|all sentient beings)/iu;

export function classifyName(name) {
  const normalized = String(name || "").replace(/\s+/gu, " ").trim();
  const prefix = normalized.match(deceasedPrefix);
  return { name: prefix ? normalized.slice(prefix[0].length).trim() : normalized, deceased: Boolean(prefix || deceasedTerms.test(normalized)) };
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
    if (!LAMP_NUMBER.test(row.number || "")) { issues.push({ line: row.line, message: `Invalid lamp number “${row.number || "blank"}”. Use M0001 format.` }); continue; }
    if (!row.name) { issues.push({ line: row.line, message: `${row.number} has no display name.` }); continue; }
    if (seen.has(row.number)) { issues.push({ line: row.line, message: `${row.number} is duplicated (first seen on line ${seen.get(row.number)}).` }); continue; }
    seen.set(row.number, row.line);
    const classified = classifyName(row.name);
    if (!classified.name) { issues.push({ line: row.line, message: `${row.number} has no name after its deceased prefix.` }); continue; }
    valid.push({ ...row, ...classified });
  }
  return { valid, issues };
}

export function splitDisplayName(name, deceased = false) {
  if (!deceased && name.includes("@")) {
    const [first, ...rest] = name.split("@");
    return [first.trim(), `@${rest.join("@").trim()}`];
  }
  if (/[^\u0000-\u00ff]/u.test(name) && name.length > 5) {
    const midpoint = Math.ceil(name.length / 2);
    return [name.slice(0, midpoint).trim(), name.slice(midpoint).trim()];
  }
  const words = name.split(/\s+/u);
  if (words.length >= 3 && name.replace(/\s+/gu, "").length > 16) {
    const midpoint = Math.ceil(words.length / 2);
    return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
  }
  return [name];
}
