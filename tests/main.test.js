const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { START, lichessDoc } = require('./fixtures.js');

const src = (f) => fs.readFileSync(path.join(__dirname, '../extension/content', f), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const windows = [];
test.after(() => windows.forEach((w) => w.close())); // stops each page's polling timer
const FEN_AFTER_E4_E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 1';

// Loads the real content scripts into a jsdom lichess page, after 1.e4 e5 (white = user to move).
function boot(reply, { flipped = false } = {}) {
  const pieces = { ...START };
  delete pieces.e2; delete pieces.e7;
  pieces.e4 = 'P'; pieces.e5 = 'p';
  const doc = lichessDoc({ pieces, flipped, lastMove: ['e7', 'e5'] });
  const win = doc.defaultView;
  windows.push(win);
  const calls = [];
  const statuses = [];
  win.chrome = {
    runtime: { sendMessage: async (m) => { calls.push(m.fen); return reply(calls.length); } },
    storage: { local: { get: async () => ({ enabled: true }), set: async (o) => { if (o.status) statuses.push(o.status); } }, onChanged: { addListener() {} } },
  };
  for (const f of ['fen.js', 'readers/lichess.js', 'overlay.js', 'main.js']) win.eval(src(f));
  return { doc, win, calls, statuses };
}

const arrows = (doc) => doc.querySelectorAll('[data-chess-arrow]').length;
// Moves the a2 pawn to a3 (changes the position without touching the last-move highlight).
function bumpBoard(doc) {
  const a2 = [...doc.querySelectorAll('piece')].find((p) => /translate\(0px, 408px\)/.test(p.getAttribute('style')));
  a2.setAttribute('style', 'transform: translate(0px, 340px);');
}

test('draws one arrow on the user turn and does not erase it or loop on its own DOM change', async () => {
  const { doc, calls, statuses } = boot(() => ({ ok: true, from: 'g1', to: 'f3' }));
  await sleep(500);
  assert.deepStrictEqual(calls, [FEN_AFTER_E4_E5]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(statuses.at(-1))), {
    state: 'move',
    text: 'Your move: Knight g1 → f3',
    move: { piece: 'Knight', from: 'g1', to: 'f3', note: '' },
  });
  assert.strictEqual(arrows(doc), 1);
  await sleep(500);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(arrows(doc), 1);
});

test('board change clears the arrow and triggers a fresh analysis', async () => {
  const { doc, calls } = boot(() => ({ ok: true, from: 'g1', to: 'f3' }));
  await sleep(500);
  bumpBoard(doc);
  await sleep(20);
  assert.strictEqual(arrows(doc), 0);
  await sleep(500);
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(arrows(doc), 1);
});

test('a result that arrives after the board changed is discarded', async () => {
  const { doc, calls } = boot(async () => { await sleep(300); return { ok: true, from: 'g1', to: 'f3' }; });
  await sleep(200); // first request in flight
  bumpBoard(doc);
  await sleep(250); // first reply has now arrived, second request still pending
  assert.strictEqual(arrows(doc), 0);
  await sleep(600);
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(arrows(doc), 1);
});

test('no arrow when the engine says there is no move, or on failure', async () => {
  for (const reply of [{ ok: true, none: true }, { ok: false }]) {
    const { doc, calls } = boot(() => reply);
    await sleep(400);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(arrows(doc), 0);
  }
});

test('opponent to move (black at bottom after 1.e4 e5) -> no analysis', async () => {
  const { doc, calls } = boot(() => ({ ok: true, from: 'g1', to: 'f3' }), { flipped: true });
  await sleep(400);
  assert.strictEqual(calls.length, 0);
  assert.strictEqual(arrows(doc), 0);
});

test('status says when it is the opponent\'s turn', async () => {
  const { statuses } = boot(() => ({ ok: true, from: 'g1', to: 'f3' }), { flipped: true });
  await sleep(400);
  assert.strictEqual(statuses.at(-1).state, 'wait');
});
