const BADGE_ON = '#2e7d32';
const BADGE_ERR = '#c62828';

async function isEnabled() {
  const { enabled } = await chrome.storage.local.get('enabled');
  return !!enabled;
}

async function syncBadge() {
  const on = await isEnabled();
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_ON });
  await chrome.action.setBadgeText({ text: on ? 'ON' : '' });
}

async function toggle() {
  await chrome.storage.local.set({ enabled: !(await isEnabled()) });
}

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['WORKERS'],
    justification: 'Run the Stockfish engine worker',
  });
}

chrome.commands.onCommand.addListener((cmd) => { if (cmd === 'toggle') toggle(); });
chrome.storage.onChanged.addListener((changes) => { if (changes.enabled) syncBadge(); });
chrome.runtime.onInstalled.addListener(syncBadge);
chrome.runtime.onStartup.addListener(syncBadge);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'analyze' || msg.target === 'offscreen') return;
  (async () => {
    try {
      await ensureOffscreen();
      const res = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'analyze', fen: msg.fen });
      if (!res || !res.ok) throw new Error('engine failure');
      sendResponse(res);
    } catch (e) {
      await chrome.action.setBadgeBackgroundColor({ color: BADGE_ERR });
      await chrome.action.setBadgeText({ text: '!' });
      sendResponse({ ok: false });
    }
  })();
  return true;
});
