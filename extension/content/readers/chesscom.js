// Reads the board on chess.com. Selectors observed on live pages:
//   wc-chess-board > .piece.<w|b><pnbrqk>.square-<file 1-8><rank 1-8> and .highlight.square-XY (last move)
// Square classes are absolute (independent of orientation), so orientation is derived from
// where pieces are actually drawn on screen rather than from a class name.
(function (root) {
  function sqName(cls) {
    const m = /square-([1-8])([1-8])/.exec(cls);
    return m ? 'abcdefgh'[m[1] - 1] + m[2] : null;
  }

  function read(doc) {
    const board = doc.querySelector('wc-chess-board, chess-board');
    if (!board) return null;

    const pieces = {};
    const els = {};
    for (const el of board.querySelectorAll('.piece')) {
      const m = /\b([wb])([pnbrqk])\b/.exec(el.className);
      const sq = sqName(el.className);
      if (!m || !sq) continue;
      pieces[sq] = m[1] === 'w' ? m[2].toUpperCase() : m[2];
      els[sq] = el;
    }

    // Flipped if a higher-rank piece is drawn lower on screen than a lower-rank one.
    const squares = Object.keys(els);
    const a = squares[0];
    const b = squares.find((s) => s[1] !== a[1]);
    if (!a || !b) return null;
    const higher = +a[1] > +b[1] ? a : b;
    const lower = higher === a ? b : a;
    const flipped = els[higher].getBoundingClientRect().top > els[lower].getBoundingClientRect().top;

    const marks = [...board.querySelectorAll('.highlight')].map((el) => sqName(el.className)).filter(Boolean);
    let lastMove = null;
    if (marks.length === 2) {
      const to = pieces[marks[0]] || !pieces[marks[1]] ? marks[0] : marks[1];
      lastMove = { from: to === marks[0] ? marks[1] : marks[0], to };
    }

    return { pieces, lastMove, bottomColor: flipped ? 'b' : 'w', boardEl: board, mountEl: board };
  }

  const api = { read };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChesscomReader = api;
})(typeof self !== 'undefined' ? self : this);
