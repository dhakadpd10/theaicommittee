// Checks an episode.json against the show's rules (brand/show.md) before it is voiced and rendered.
// Returns a list of problems in plain words; an empty list means it can be made.
const WHO = ['meera', 'codex', 'claude', 'gemini', 'twin'];
const SHOTS = ['wide', 'meera', 'meera-hold', 'committee', 'codex', 'claude', 'gemini', 'codex-push', 'claude-push', 'gemini-push', 'laptop'];
const MOODS = { meera: ['calm', 'shock', 'flat', 'tired'], codex: ['normal', 'happy', 'think', 'worried'], claude: ['normal', 'happy', 'think', 'worried', 'small'], gemini: ['normal', 'happy', 'worried'], twin: ['smug', 'happy'] };
const SFX = ['send', 'type', 'wipe', 'thunder'];
// which shots show which speaker
const SHOWS = { meera: ['wide', 'meera', 'meera-hold'], codex: ['codex', 'codex-push', 'committee'], claude: ['claude', 'claude-push', 'committee'], gemini: ['gemini', 'gemini-push', 'committee'], twin: ['gemini', 'gemini-push', 'committee'] };

function validateEpisode(e) {
  const p = [];
  if (!e || typeof e !== 'object') return ['not an object'];
  if (e.cast !== 'committee') p.push('cast must be "committee"');
  if (!e.title || e.title.split(/\s+/).length > 5) p.push('title must be 1 to 5 words');
  if (!Array.isArray(e.beats) || e.beats.length < 6 || e.beats.length > 14) return [...p, 'beats must be a list of 6 to 14 beats'];
  const spoken = e.beats.filter((b) => b.say);
  if (spoken.length < 5) p.push('needs at least 5 spoken lines');
  if (e.beats[0].who !== 'meera' || !/^hey committee,/i.test(e.beats[0].say || '')) p.push('beat 0 must be Meera saying "Hey committee, ..."');
  const speakers = new Set(spoken.map((b) => b.who).filter((w) => w !== 'meera' && w !== 'twin'));
  if (speakers.size < 2) p.push('at least two of codex, claude and gemini must speak');
  let words = 0;
  e.beats.forEach((b, i) => {
    const at = `beat ${i}`;
    if (b.card !== undefined) { if (typeof b.card !== 'string' || b.card.length > 30 || b.card !== b.card.toLowerCase()) p.push(`${at}: card text must be short and lower case`); if (!(b.dur >= 1.2 && b.dur <= 3)) p.push(`${at}: a card needs dur 1.2 to 3`); return; }
    if (!SHOTS.includes(b.shot)) p.push(`${at}: shot must be one of ${SHOTS.join(', ')}`);
    if (b.say !== undefined) {
      if (!WHO.includes(b.who)) p.push(`${at}: who must be one of ${WHO.join(', ')}`);
      else {
        if (!MOODS[b.who].includes(b.mood)) p.push(`${at}: mood for ${b.who} must be one of ${MOODS[b.who].join(', ')}`);
        if (!SHOWS[b.who].includes(b.shot)) p.push(`${at}: ${b.who} is speaking, so the shot must be one of ${SHOWS[b.who].join(', ')}`);
      }
      const w = b.say.trim().split(/\s+/).length; words += w;
      if (w > 18) p.push(`${at}: the line is ${w} words, keep it under 18`);
      if (/\d/.test(b.say)) p.push(`${at}: write numbers as words in "say" (digits go in "show")`);
      if (/[#@%&*_~<>{}[\]|\\/]|[\u{1F300}-\u{1FAFF}]|—/u.test(b.say)) p.push(`${at}: "say" must be plain words (no symbols, emoji or dashes)`);
      if (b.pre !== undefined && !(b.pre >= 0 && b.pre <= 1.5)) p.push(`${at}: pre must be 0 to 1.5`);
      if (b.show !== undefined && (typeof b.show !== 'string' || b.show.length > 140)) p.push(`${at}: show must be a short string`);
    } else {
      if (b.who) p.push(`${at}: has "who" but no "say"`);
      if (!(b.dur >= 0.8 && b.dur <= 3.5)) p.push(`${at}: a silent beat needs dur 0.8 to 3.5`);
    }
    if (b.shot === 'laptop' && !e.beats.slice(0, i + 1).some((x) => x.screen)) p.push(`${at}: a laptop shot needs a "screen" on this or an earlier beat`);
    if (b.screen && !['calendar', 'text'].includes(b.screen.page)) p.push(`${at}: screen.page must be "calendar" or "text"`);
    for (const fx of b.sfx || []) if (!SFX.includes(fx)) p.push(`${at}: sfx must be from ${SFX.join(', ')}`);
    if (b.time && !['night', 'morning'].includes(b.time)) p.push(`${at}: time must be night or morning`);
    if (b.weather && b.weather !== 'rain') p.push(`${at}: weather can only be "rain"`);
  });
  if (words < 45 || words > 120) p.push(`the episode has ${words} spoken words; aim for 55 to 100 (25 to 35 seconds)`);
  if (!Number.isInteger(e.cover) || !e.beats[e.cover]?.say) p.push('cover must be the index of a spoken beat');
  if (e.musicStop !== undefined && (!Number.isInteger(e.musicStop) || !e.beats[e.musicStop]?.say)) p.push('musicStop must be the index of a spoken beat');
  const last = e.beats[e.beats.length - 1];
  if ((last.say && !(last.post >= 1.2)) || (!last.say && !/meera-hold|committee/.test(last.shot || ''))) p.push('end quietly: a silent meera-hold (or committee) beat of about 2.4 s, or a last line with post 1.2 or more');
  p.push(...validateCaption(e.caption || ''));
  return p;
}

function validateCaption(c) {
  const p = [];
  if (!c.trim()) return ['caption is missing'];
  if (c.length > 600) p.push('caption is too long (keep it under 600 characters)');
  if (/—|–/.test(c)) p.push('caption must not use em or en dashes');
  const tags = c.match(/#\w+/g) || [];
  if (tags.length < 3 || tags.length > 6) p.push('caption needs 3 to 6 hashtags');
  if (/^[A-Z]/.test(c.trim())) p.push('the first caption line starts lower case');
  if (!/\?/.test(c)) p.push('caption needs one question for the comments');
  if (/follow for more|comment below|link in bio/i.test(c)) p.push('caption must not beg (no "follow for more", "comment below", "link in bio")');
  return p;
}

module.exports = { validateEpisode, validateCaption, WHO, SHOTS, MOODS };
