const test = require('node:test');
const assert = require('node:assert');
const { center } = require('../extension/content/overlay.js');

test('center: white at bottom, e2 -> x 4.5, y 6.5 (board is an 8x8 viewBox)', () => {
  assert.deepStrictEqual(center('e2', 'w'), { x: 4.5, y: 6.5 });
  assert.deepStrictEqual(center('a8', 'w'), { x: 0.5, y: 0.5 });
});

test('center: black at bottom flips both axes', () => {
  assert.deepStrictEqual(center('e2', 'b'), { x: 3.5, y: 1.5 });
  assert.deepStrictEqual(center('a8', 'b'), { x: 7.5, y: 7.5 });
});
