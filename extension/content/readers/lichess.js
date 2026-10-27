// Reads the main board on lichess.org (chessground). Selectors observed on live pages:
//   cg-wrap.orientation-white|black > cg-container > cg-board > piece.<white|black>.<role> + square.last-move
// Squares are positioned with inline "transform: translate(Xpx, Ypx)" from the board's top-left.
(function (root) {
  const ROLES = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' };

  function squareOf(el, size, flipped) {
    const m = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.getAttribute('style') || '');
    if (!m) return null;
    const col = Math.round(+m[1] / size);
    const row = Math.round(+m[2] / size);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const file = flipped ? 7 - col : col;
    const rank = flipped ? row + 1 : 8 - row;
    return 'abcdefgh'[file] + rank;
  }

  function read(doc) {
    const board = doc.querySelector('.main-board cg-board') || doc.querySelector('cg-board');
    if (!board) return null;
    const size = board.getBoundingClientRect().width / 8;
    if (!size) return null;
    const wrap = board.closest('.cg-wrap');
    const flipped = !!wrap && wrap.classList.contains('orientation-black');

    const pieces = {};
    for (const el of board.querySelectorAll('piece')) {
      if (el.classList.contains('ghost') || el.classList.contains('dragging') || el.classList.contains('fading')) continue;
      const role = [...el.classList].map((c) => ROLES[c]).find(Boolean);
      const sq = squareOf(el, size, flipped);
      if (!role || !sq) continue;
      pieces[sq] = el.classList.contains('white') ? role.toUpperCase() : role;
    }

    // Highlight order isn't reliable: the occupied square is where the piece landed.
    const marks = [...board.querySelectorAll('square.last-move')].map((el) => squareOf(el, size, flipped)).filter(Boolean);
    let lastMove = null;
    if (marks.length === 2) {
      const to = pieces[marks[0]] || !pieces[marks[1]] ? marks[0] : marks[1];
      lastMove = { from: to === marks[0] ? marks[1] : marks[0], to };
    }

    return { pieces, lastMove, bottomColor: flipped ? 'b' : 'w', boardEl: board, mountEl: board.parentElement };
  }

  const api = { read };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LichessReader = api;
})(typeof self !== 'undefined' ? self : this);
