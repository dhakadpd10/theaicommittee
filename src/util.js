// Shared helpers: paths, config, JSON files, time in the page's timezone, logging.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const P = (...p) => path.join(ROOT, ...p);
const readJSON = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { if (fallback !== undefined) return fallback; throw new Error(`cannot read ${f}`); } };
const writeJSON = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n'); };
const readText = (f, fallback = '') => { try { return fs.readFileSync(f, 'utf8'); } catch { return fallback; } };
const config = () => readJSON(P('config/agent.json'));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// "2026-10-19" + "19:30" in the page's timezone -> Date
function slotDate(day, time, offset = config().timezone_offset) { return new Date(`${day}T${time}:00${offset}`); }
// today's date (YYYY-MM-DD) in the page's timezone
function localDay(d = new Date(), offset = config().timezone_offset) {
  const [h, m] = offset.slice(1).split(':').map(Number), sign = offset[0] === '-' ? -1 : 1;
  return new Date(d.getTime() + sign * (h * 60 + m) * 60000).toISOString().slice(0, 10);
}
const addDays = (day, n) => new Date(new Date(`${day}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
// ISO week label like 2026-W43 for a YYYY-MM-DD
function isoWeek(day) {
  const d = new Date(`${day}T00:00:00Z`); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow + 3);
  const y = d.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4)); const wk = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${y}-W${String(wk).padStart(2, '0')}`;
}
// public URL of a file under content/ once the site is deployed (GitHub Pages)
const publicUrl = (rel) => `${config().site_url.replace(/\/$/, '')}/${rel.replace(/\\/g, '/').replace(/^content\//, 'media/')}`;
const python = () => (process.platform === 'win32' ? ['py', ['-X', 'utf8']] : ['python3', []]);

module.exports = { ROOT, P, readJSON, writeJSON, readText, config, log, slotDate, localDay, addDays, isoWeek, publicUrl, python };
