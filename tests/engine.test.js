const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { parseBestmove } = require('../extension/engine-util.js');

test('parseBestmove plain move with ponder', () => {
  assert.deepStrictEqual(parseBestmove('bestmove e2e4 ponder e7e5'), { from: 'e2', to: 'e4' });
});

test('parseBestmove drops promotion suffix', () => {
  assert.deepStrictEqual(parseBestmove('bestmove e7e8q'), { from: 'e7', to: 'e8' });
});

test('parseBestmove (none) -> null', () => {
  assert.strictEqual(parseBestmove('bestmove (none)'), null);
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
