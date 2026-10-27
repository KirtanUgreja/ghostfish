const test = require('node:test');
const assert = require('node:assert');
const { buildFen } = require('../extension/content/fen.js');

const START = {
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
  a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
  a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
};

test('start position, no last move, white at bottom', () => {
  const r = buildFen({ pieces: START, lastMove: null, bottomColor: 'w' });
  assert.strictEqual(r.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.strictEqual(r.sideToMove, 'w');
});

test('no last move (game start) -> white to move even when black is at bottom', () => {
  const r = buildFen({ pieces: START, lastMove: null, bottomColor: 'b' });
  assert.strictEqual(r.sideToMove, 'w');
});

test('after 1.e4: black to move, en passant e3', () => {
  const pieces = { ...START };
  delete pieces.e2;
  pieces.e4 = 'P';
  const r = buildFen({ pieces, lastMove: { from: 'e2', to: 'e4' }, bottomColor: 'w' });
  assert.strictEqual(r.fen, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
});

test('after 1.e4 e5: white to move, en passant e6', () => {
  const pieces = { ...START };
  delete pieces.e2; delete pieces.e7;
  pieces.e4 = 'P'; pieces.e5 = 'p';
  const r = buildFen({ pieces, lastMove: { from: 'e7', to: 'e5' }, bottomColor: 'w' });
  assert.strictEqual(r.fen, 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 1');
});

test('castling letters dropped when king or rook off home square', () => {
  const pieces = { ...START };
  delete pieces.e1; pieces.e3 = 'K'; // white king off home square: no K/Q
  delete pieces.h8; pieces.h6 = 'r'; // black h-rook off: no k
  const r = buildFen({ pieces, lastMove: { from: 'h8', to: 'h6' }, bottomColor: 'w' });
  assert.strictEqual(r.fen.split(' ')[2], 'q');
});

test('non-pawn two-square move gives no en passant', () => {
  const pieces = { ...START };
  delete pieces.a1; pieces.a3 = 'R';
  const r = buildFen({ pieces, lastMove: { from: 'a1', to: 'a3' }, bottomColor: 'w' });
  assert.strictEqual(r.fen.split(' ')[3], '-');
});

test('last move to a white piece -> black to move; to a black piece -> white to move', () => {
  const w = buildFen({ pieces: { ...START, g1: undefined, f3: 'N' }, lastMove: { from: 'g1', to: 'f3' }, bottomColor: 'b' });
  assert.strictEqual(w.sideToMove, 'b');
  const b = buildFen({ pieces: { ...START, g8: undefined, f6: 'n' }, lastMove: { from: 'g8', to: 'f6' }, bottomColor: 'w' });
  assert.strictEqual(b.sideToMove, 'w');
});
