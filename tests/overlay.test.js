const test = require('node:test');
const assert = require('node:assert');
const { center, path } = require('../extension/content/overlay.js');

test('center: white at bottom, e2 -> x 4.5, y 6.5 (board is an 8x8 viewBox)', () => {
  assert.deepStrictEqual(center('e2', 'w'), { x: 4.5, y: 6.5 });
  assert.deepStrictEqual(center('a8', 'w'), { x: 0.5, y: 0.5 });
});

test('center: black at bottom flips both axes', () => {
  assert.deepStrictEqual(center('e2', 'b'), { x: 3.5, y: 1.5 });
  assert.deepStrictEqual(center('a8', 'b'), { x: 7.5, y: 7.5 });
});

test('path: straight arrow for non-knight moves', () => {
  assert.deepStrictEqual(path('a1', 'a8', 'w'), [center('a1', 'w'), center('a8', 'w')]);
  assert.deepStrictEqual(path('c1', 'h6', 'w'), [center('c1', 'w'), center('h6', 'w')]);
});

test('path: knight gets an L, long leg first (g1-f3 goes up two, then left one)', () => {
  assert.deepStrictEqual(path('g1', 'f3', 'w'), [{ x: 6.5, y: 7.5 }, { x: 6.5, y: 5.5 }, { x: 5.5, y: 5.5 }]);
});

test('path: knight sideways-long case and flipped board (b1-d2)', () => {
  assert.deepStrictEqual(path('b1', 'd2', 'w'), [{ x: 1.5, y: 7.5 }, { x: 3.5, y: 7.5 }, { x: 3.5, y: 6.5 }]);
  assert.deepStrictEqual(path('g1', 'f3', 'b'), [{ x: 1.5, y: 0.5 }, { x: 1.5, y: 2.5 }, { x: 2.5, y: 2.5 }]);
});
