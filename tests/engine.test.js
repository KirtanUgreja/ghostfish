const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { parseBestmove, parseInfo } = require('../extension/engine-util.js');

test('parseBestmove plain move with ponder', () => {
  assert.deepStrictEqual(parseBestmove('bestmove e2e4 ponder e7e5'), { from: 'e2', to: 'e4' });
});

test('parseBestmove drops promotion suffix', () => {
  assert.deepStrictEqual(parseBestmove('bestmove e7e8q'), { from: 'e7', to: 'e8' });
});

test('parseBestmove (none) -> null', () => {
  assert.strictEqual(parseBestmove('bestmove (none)'), null);
});

test('parseInfo reads depth and centipawn score', () => {
  assert.deepStrictEqual(parseInfo('info depth 12 seldepth 18 multipv 1 score cp 34 nodes 9000 pv e2e4 e7e5'), { depth: 12, cp: 34 });
  assert.deepStrictEqual(parseInfo('info depth 9 score cp -120 nodes 1'), { depth: 9, cp: -120 });
});

test('parseInfo reads mate scores', () => {
  assert.deepStrictEqual(parseInfo('info depth 20 score mate 3 nodes 5'), { depth: 20, mate: 3 });
  assert.deepStrictEqual(parseInfo('info depth 20 score mate -2 nodes 5'), { depth: 20, mate: -2 });
});

test('parseInfo ignores bounds and non-score lines', () => {
  assert.strictEqual(parseInfo('info depth 12 score cp 34 lowerbound nodes 1'), null);
  assert.strictEqual(parseInfo('info depth 12 score cp 34 upperbound nodes 1'), null);
  assert.strictEqual(parseInfo('info string NNUE evaluation using nn.bin'), null);
  assert.strictEqual(parseInfo('bestmove e2e4'), null);
});

test('shipped engine returns a legal first move from the start position', async () => {
  const enginePath = path.join(__dirname, '../extension/engine/stockfish-19-lite-single.js');
  const line = await new Promise((resolve, reject) => {
    const sf = require('stockfish')(enginePath, (l) => {
      if (/^bestmove /.test(l)) { sf.terminate(); resolve(l); }
    });
    setTimeout(() => reject(new Error('engine timeout')), 20000);
    sf.processCommand('uci');
    sf.processCommand('position startpos');
    sf.processCommand('go movetime 300');
  });
  const legal = new Set('a2a3 a2a4 b2b3 b2b4 c2c3 c2c4 d2d3 d2d4 e2e3 e2e4 f2f3 f2f4 g2g3 g2g4 h2h3 h2h4 b1a3 b1c3 g1f3 g1h3'.split(' '));
  assert.ok(legal.has(line.split(' ')[1]), line);
});
