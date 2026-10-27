// Builds minimal DOM fixtures shaped like what was observed on live lichess.org / chess.com pages.
const { JSDOM } = require('jsdom');

const START = {
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
  a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
  a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
};
const ROLE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const SQ = 68; // lichess square size in px used by the fixture

function lichessDoc({ pieces, flipped = false, lastMove = [] }) {
  const pos = (sq) => {
    const f = sq.charCodeAt(0) - 97, r = +sq[1];
    const col = flipped ? 7 - f : f, row = flipped ? r - 1 : 8 - r;
    return `transform: translate(${col * SQ}px, ${row * SQ}px);`;
  };
  const ps = Object.entries(pieces).filter(([, p]) => p).map(([sq, p]) =>
    `<piece class="${p === p.toUpperCase() ? 'white' : 'black'} ${ROLE[p.toLowerCase()]}" style="${pos(sq)}"></piece>`).join('');
  const hl = lastMove.map((sq) => `<square class="last-move" style="${pos(sq)}"></square>`).join('');
  const dom = new JSDOM(`<div class="main-board"><div class="cg-wrap cgv1 orientation-${flipped ? 'black' : 'white'}"><cg-container><cg-board>${hl}${ps}</cg-board></cg-container></div></div>`, { url: 'https://lichess.org/analysis', runScripts: 'outside-only' });
  dom.window.document.querySelector('cg-board').getBoundingClientRect = () => ({ width: SQ * 8, height: SQ * 8, top: 0, left: 0 });
  return dom.window.document;
}

function chesscomDoc({ pieces, flipped = false, lastMove = [] }) {
  const num = (sq) => `${sq.charCodeAt(0) - 96}${sq[1]}`;
  const ps = Object.entries(pieces).filter(([, p]) => p).map(([sq, p]) =>
    `<div class="piece ${p === p.toUpperCase() ? 'w' : 'b'}${p.toLowerCase()} square-${num(sq)}" data-sq="${sq}"></div>`).join('');
  const hl = lastMove.map((sq) => `<div class="highlight square-${num(sq)}"></div>`).join('');
  const dom = new JSDOM(`<wc-chess-board class="board">${hl}${ps}</wc-chess-board>`);
  const doc = dom.window.document;
  for (const el of doc.querySelectorAll('.piece')) {
    const r = +el.dataset.sq[1];
    const top = (flipped ? r - 1 : 8 - r) * 66;
    el.getBoundingClientRect = () => ({ top, left: 0, width: 66, height: 66 });
  }
  return doc;
}

module.exports = { START, lichessDoc, chesscomDoc };
