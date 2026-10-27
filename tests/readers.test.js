const test = require('node:test');
const assert = require('node:assert');
const { START, lichessDoc, chesscomDoc } = require('./fixtures.js');
const Lichess = require('../extension/content/readers/lichess.js');
const Chesscom = require('../extension/content/readers/chesscom.js');

const readers = [
  ['lichess', Lichess, lichessDoc],
  ['chess.com', Chesscom, chesscomDoc],
];

for (const [name, reader, mk] of readers) {
  test(`${name}: start position read matches`, () => {
    const r = reader.read(mk({ pieces: START }));
    assert.deepStrictEqual(r.pieces, START);
    assert.strictEqual(r.bottomColor, 'w');
    assert.strictEqual(r.lastMove, null);
  });

  test(`${name}: flipped board -> bottomColor b, same squares`, () => {
    const r = reader.read(mk({ pieces: START, flipped: true }));
    assert.deepStrictEqual(r.pieces, START);
    assert.strictEqual(r.bottomColor, 'b');
  });

  test(`${name}: last move picks the occupied square as destination (either order)`, () => {
    const pieces = { ...START }; delete pieces.e2; pieces.e4 = 'P';
    for (const order of [['e2', 'e4'], ['e4', 'e2']]) {
      const r = reader.read(mk({ pieces, lastMove: order }));
      assert.deepStrictEqual(r.lastMove, { from: 'e2', to: 'e4' });
    }
  });

  test(`${name}: no board -> null`, () => {
    const { JSDOM } = require('jsdom');
    assert.strictEqual(reader.read(new JSDOM('<div></div>').window.document), null);
  });
}
