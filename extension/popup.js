const $ = (id) => document.getElementById(id);
const FILES = 'abcdefgh';
const IDLE_TEXT = 'Open a game on chess.com or lichess';

function pieceSrc(p) {
  return `icons/pieces/${p === p.toUpperCase() ? 'w' : 'b'}${p.toUpperCase()}.svg`;
}

// Mini board: the last position the content script saw, oriented like the real board.
function drawBoard(board, move) {
  const el = $('board');
  const flipped = !!board && board.bottom === 'b';
  const cells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const f = flipped ? 7 - col : col;
      const r = flipped ? row + 1 : 8 - row;
      const sq = FILES[f] + r;
      const cell = document.createElement('div');
      cell.className = 'sq ' + ((f + r) % 2 ? 'dark' : 'light');
      if (move && sq === move.from) cell.classList.add('from');
      if (move && sq === move.to) cell.classList.add('to');
      const p = board && board.pieces[sq];
      if (p) {
        const img = document.createElement('img');
        img.src = pieceSrc(p);
        img.alt = '';
        cell.appendChild(img);
      }
      if (col === 0) cell.insertAdjacentHTML('beforeend', `<b class="rk">${r}</b>`);
      if (row === 7) cell.insertAdjacentHTML('beforeend', `<b class="fl">${FILES[f]}</b>`);
      cells.push(cell);
    }
  }
  el.replaceChildren(...cells);
  if (move) Overlay.draw(el, move.from, move.to, flipped ? 'b' : 'w');
}

// Engine score is from the side to move, which is you: positive = good for you.
function fmtEval(e) {
  if (e.mate != null) return (e.mate < 0 ? '−#' : '#') + Math.abs(e.mate);
  const v = e.cp / 100;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
}

function winChance(e) {
  if (e.mate != null) return e.mate > 0 ? 1 : 0;
  return 1 / (1 + Math.exp(-0.00368208 * e.cp));
}

function render({ enabled, status }) {
  $('toggle').checked = !!enabled;
  $('pill').textContent = enabled ? 'Live' : 'Off';
  $('pill').dataset.on = !!enabled;

  const state = !enabled ? 'off' : status ? status.state : 'idle';
  const move = state === 'move' ? status.move : null;
  const board = enabled && status ? status.board : null;

  $('stage').dataset.state = state;
  $('readout').dataset.state = state;
  drawBoard(board, move);

  $('veil').textContent = !enabled ? 'Switched off' : IDLE_TEXT;
  $('text').textContent = !enabled ? 'Flip the switch to start' : status ? status.text : IDLE_TEXT;

  const ev = move && status.eval;
  $('bar-fill').style.height = ev ? Math.round(winChance(ev) * 100) + '%' : '50%';

  $('move').hidden = !move;
  if (move) {
    $('piece-img').src = `icons/pieces/${board.bottom}${move.piece === 'Knight' ? 'N' : move.piece[0]}.svg`;
    $('piece').textContent = move.piece;
    $('from').textContent = move.from;
    $('to').textContent = move.to;
    $('note').hidden = !move.note;
    $('note').textContent = move.note;
    $('eval-num').textContent = ev ? fmtEval(ev) : '–';
    $('eval-depth').textContent = !ev ? '' : ev.mate != null ? 'forced mate' : 'depth ' + ev.depth;
  }
}

const load = async () => render(await chrome.storage.local.get(['enabled', 'status']));

$('toggle').addEventListener('change', (e) => chrome.storage.local.set({ enabled: e.target.checked }));
chrome.storage.onChanged.addListener(load);
load();
