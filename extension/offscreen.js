// Hosts the Stockfish worker. Latest request wins; older ones resolve as stale.
const MOVETIME_MS = 1000;

const worker = new Worker('engine/stockfish-19-lite-single.js');
let running = null;
let queued = null;
let lastEval = null; // latest depth/score of the running search

worker.postMessage('uci');
worker.postMessage('isready');

function pump() {
  if (running || !queued) return;
  running = queued;
  queued = null;
  lastEval = null;
  worker.postMessage('position fen ' + running.fen);
  worker.postMessage('go movetime ' + MOVETIME_MS);
}

worker.onmessage = (ev) => {
  const line = typeof ev.data === 'string' ? ev.data : '';
  if (line.startsWith('info')) lastEval = EngineUtil.parseInfo(line) || lastEval;
  if (!line.startsWith('bestmove')) return;
  const done = running;
  running = null;
  if (!done) return;
  if (queued) done.resolve({ ok: true, stale: true });
  else {
    const mv = EngineUtil.parseBestmove(line);
    done.resolve(mv ? { ok: true, ...mv, eval: lastEval } : { ok: true, none: true });
  }
  pump();
};

worker.onerror = () => {
  for (const r of [running, queued]) if (r) r.resolve({ ok: false });
  running = queued = null;
};

function analyze(fen) {
  return new Promise((resolve) => {
    if (queued) queued.resolve({ ok: true, stale: true });
    queued = { fen, resolve };
    if (running) worker.postMessage('stop');
    else pump();
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'offscreen' || msg.type !== 'analyze') return;
  analyze(msg.fen).then(sendResponse);
  return true;
});
