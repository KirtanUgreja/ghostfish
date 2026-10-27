const GLYPHS = { Pawn: '♟', Knight: '♞', Bishop: '♝', Rook: '♜', Queen: '♛', King: '♚' };
const $ = (id) => document.getElementById(id);

function render({ enabled, status }) {
  $('toggle').checked = !!enabled;
  $('switch-label').textContent = enabled ? 'On' : 'Off';

  const state = !enabled ? 'off' : status ? status.state : 'idle';
  $('card').dataset.state = state;
  $('move').hidden = state !== 'move';
  $('text').textContent = !enabled ? 'Switched off' : status ? status.text : 'Open a game on chess.com or lichess';

  if (state === 'move') {
    const m = status.move;
    $('glyph').textContent = GLYPHS[m.piece];
    $('piece').textContent = m.piece;
    $('from').textContent = m.from;
    $('to').textContent = m.to;
    $('note').textContent = m.note;
  }
}

const load = async () => render(await chrome.storage.local.get(['enabled', 'status']));

$('toggle').addEventListener('change', (e) => chrome.storage.local.set({ enabled: e.target.checked }));
chrome.storage.onChanged.addListener(load);
load();
