// Pure FEN builder. Works as a browser global (ChessFen) and as a Node module.
(function (root) {
  const FILES = 'abcdefgh';

  function buildFen({ pieces, lastMove, bottomColor }) {
    const rows = [];
    for (let rank = 8; rank >= 1; rank--) {
      let row = '';
      let empty = 0;
      for (const f of FILES) {
        const p = pieces[f + rank];
        if (p) {
          if (empty) { row += empty; empty = 0; }
          row += p;
        } else {
          empty++;
        }
      }
      if (empty) row += empty;
      rows.push(row);
    }

    // Side to move: opposite of whoever just moved. No last move = game start.
    let sideToMove = 'w';
    if (lastMove) {
      const mover = pieces[lastMove.to];
      if (mover) sideToMove = mover === mover.toUpperCase() ? 'b' : 'w';
    }

    // Castling: heuristic only. Granted if king and rook sit on home squares.
    // Wrong if a king/rook moved away and came back; can't be known from the DOM.
    let castling = '';
    if (pieces.e1 === 'K' && pieces.h1 === 'R') castling += 'K';
    if (pieces.e1 === 'K' && pieces.a1 === 'R') castling += 'Q';
    if (pieces.e8 === 'k' && pieces.h8 === 'r') castling += 'k';
    if (pieces.e8 === 'k' && pieces.a8 === 'r') castling += 'q';
    if (!castling) castling = '-';

    // En passant: only after a pawn two-square push.
    let ep = '-';
    if (lastMove && (pieces[lastMove.to] === 'P' || pieces[lastMove.to] === 'p')) {
      const r1 = +lastMove.from[1];
      const r2 = +lastMove.to[1];
      if (lastMove.from[0] === lastMove.to[0] && Math.abs(r1 - r2) === 2) {
        ep = lastMove.from[0] + (r1 + r2) / 2;
      }
    }

    return { fen: `${rows.join('/')} ${sideToMove} ${castling} ${ep} 0 1`, sideToMove };
  }

  const api = { buildFen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChessFen = api;
})(typeof self !== 'undefined' ? self : this);
