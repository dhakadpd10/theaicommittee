// The agent's brain. Two ways to reach Claude, picked automatically:
//  1. CLAUDE_CODE_OAUTH_TOKEN (a Claude Pro/Max/Team subscription, made with `claude setup-token`):
//     runs Claude Code in print mode. Usage counts against the subscription, no API bill.
//  2. ANTHROPIC_API_KEY: the Anthropic SDK, streaming, adaptive thinking, server-side fallbacks.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { config } = require('./util');

// a token copied from a wrapped terminal line can pick up spaces or line breaks; tokens never contain whitespace
const oauthToken = () => (process.env.CLAUDE_CODE_OAUTH_TOKEN || '').replace(/\s+/g, '');
/** Describe the token's shape without revealing it. */
const tokenShape = () => { const t = oauthToken(); return t ? `${t.slice(0, 13)}… ${t.length} characters${/^sk-ant-oat\d\d-/.test(t) ? '' : ' (expected to start with sk-ant-oat01-)'}` : 'none'; };
// CLAUDE_LOCAL=1: use the Claude Code already signed in on this computer (for running the agent at home)
const useClaudeCode = () => !process.env.ANTHROPIC_API_KEY && !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.CLAUDE_LOCAL);
const hasClaude = () => !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.CLAUDE_LOCAL);

// ---------- 1. Claude Code (subscription) ----------
function claudeCode({ system, prompt, effort, model, web }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'committee-')); // empty folder: nothing for file tools to touch
  const sysFile = path.join(dir, 'system.md'); fs.writeFileSync(sysFile, system || 'You are a helpful assistant.');
  const args = ['-p', '--output-format', 'json', '--no-session-persistence', '--model', model, '--system-prompt-file', sysFile, '--tools', web ? 'WebSearch' : ''];
  if (web) args.push('--allowedTools', 'WebSearch');
  if (effort) args.push('--effort', effort);
  return new Promise((resolve, reject) => {
    const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: oauthToken() };
    if (!env.CLAUDE_CODE_OAUTH_TOKEN) delete env.CLAUDE_CODE_OAUTH_TOKEN;
    for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']) if (!env[k]) delete env[k]; // an empty key would win over the subscription token
    const p = spawn('claude', args, { cwd: dir, shell: process.platform === 'win32', env });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => reject(new Error(`could not start Claude Code (install with: npm i -g @anthropic-ai/claude-code): ${e.message}`)));
    p.on('close', () => {
      fs.rmSync(dir, { recursive: true, force: true });
      let r; try { r = JSON.parse(out.trim().split('\n').filter(Boolean).pop()); } catch { return reject(new Error(`Claude Code gave no result: ${(err || out).slice(-400)}`)); }
      if (r.is_error || r.subtype !== 'success') return reject(new Error(`Claude Code: ${r.result || r.terminal_reason || r.subtype || 'error'}`));
      resolve(r.result || '');
    });
    p.stdin.end(prompt);
  });
}

// ---------- 2. Anthropic API ----------
let client;
async function viaApi({ system, messages, effort, model, maxTokens, tools }) {
  const Anthropic = require('@anthropic-ai/sdk').default;
  client ||= new Anthropic();
  const stream = client.beta.messages.stream({
    model, max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    thinking: { type: 'adaptive' }, output_config: { effort },
    system, messages, ...(tools ? { tools } : {}),
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error(`Claude declined: ${message.stop_details?.category || 'no category'}`);
  if (message.stop_reason === 'max_tokens') throw new Error('Claude ran out of output tokens; raise maxTokens');
  return message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

/** ask({ system, prompt, effort, model, web }) -> text. `web: true` lets Claude search the web. */
async function ask({ system, prompt, effort, model, maxTokens = 32000, web = false }) {
  const cfg = config();
  model = model || cfg.models.writer; effort = effort || cfg.models.writer_effort;
  if (!hasClaude()) throw new Error('no Claude connection: set CLAUDE_CODE_OAUTH_TOKEN (subscription) or ANTHROPIC_API_KEY');
  if (useClaudeCode()) return claudeCode({ system, prompt, effort, model, web });
  return viaApi({ system, messages: [{ role: 'user', content: prompt }], effort, model, maxTokens, tools: web ? [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }] : undefined });
}

/** Pull the first JSON object or array out of a reply (inside ```json fences or bare). */
function parseJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(Math.min(...['{', '['].map((c) => (text.indexOf(c) < 0 ? Infinity : text.indexOf(c)))));
  return JSON.parse(raw.trim());
}

/** Ask for JSON, validate it, and on failure show Claude its answer and the problems, then try again. */
async function askJSON({ system, prompt, validate, effort, model, retries = 2, maxTokens }) {
  let current = prompt;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const text = await ask({ system, prompt: current, effort, model, maxTokens });
    let value, errors;
    try { value = parseJSON(text); errors = validate ? validate(value) : []; } catch (e) { errors = [`not valid JSON: ${e.message}`]; }
    if (!errors.length) return value;
    current = `${prompt}\n\nYour previous answer was:\n${text}\n\nIt has these problems:\n- ${errors.join('\n- ')}\nReturn the full corrected JSON only.`;
  }
  throw new Error('Claude could not produce valid JSON after retries');
}

module.exports = { ask, askJSON, parseJSON, hasClaude, useClaudeCode, tokenShape };
