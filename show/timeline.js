// Turns episode.json + voice/voice.json into absolute times: when each beat starts, when its voice plays, when the shot cuts.
const fs = require('fs'), path = require('path');
module.exports = function timeline(epDir) {
  const ep = JSON.parse(fs.readFileSync(path.join(epDir, 'episode.json'), 'utf8'));
  const voice = JSON.parse(fs.readFileSync(path.join(epDir, 'voice', 'voice.json'), 'utf8'));
  let t = 0, time = 'night', weather = 'clear';
  const beats = ep.beats.map((b, i) => {
    const key = String(i).padStart(2, '0'), v = voice[key];
    const pre = b.pre ?? (b.card || b.dur ? 0 : 0.28);
    const start = t; // the shot starts here
    const vo = v ? +(t + pre).toFixed(3) : null; // the line starts after a small pause
    const len = v ? v.len : 0;
    const end = v ? t + pre + len + (b.post ?? 0) : t + b.dur;
    if (b.time) time = b.time;
    if (b.weather) weather = b.weather;
    t = end;
    return { ...b, i, key, start: +start.toFixed(3), vo, len, end: +end.toFixed(3), time, weather, env: v ? v.env : null, text: b.show || b.say || null };
  });
  return { id: ep.id, title: ep.title, brand: ep.brand, cast: ep.cast || 'dabba', cover: ep.cover, musicStop: ep.musicStop, beats, DUR: +(t + 0.6).toFixed(2) };
};
