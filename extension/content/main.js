// Glue: watch the board, and on the user's turn ask the engine for a move and draw it.
(function () {
  const DEBOUNCE_MS = 150;
  const POLL_MS = 1000; // re-find the board after SPA navigation / re-render

  const reader = location.hostname.endsWith('lichess.org') ? LichessReader : ChesscomReader;

  let enabled = false;
  let observer = null;
  let observedBoard = null;
  let timer = null;
  let pollTimer = null;
  let currentFen = null; // FEN of the in-flight request; null once the board changes

  function invalidate() {
    currentFen = null;
    Overlay.clear();
    clearTimeout(timer);
    timer = setTimeout(run, DEBOUNCE_MS);
  }

  const log = (...a) => console.log('[chess-arrow]', ...a);
  const NAMES = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

  // Shown in the extension popup. state: move | wait | think | idle | over | error
  function setStatus(state, text, pos, move, evalInfo) {
    const board = pos && { pieces: pos.pieces, bottom: pos.bottomColor };
    chrome.storage.local.set({ status: { state, text, move, board, eval: evalInfo } }).catch(() => {});
  }

  function describe(pos, from, to) {
    const piece = NAMES[pos.pieces[from].toLowerCase()];
    const note = pos.pieces[to] ? 'captures'
      : piece === 'King' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2 ? 'castles' : '';
    return { piece, from, to, note };
  }

  async function run() {
    if (!enabled) return;
    const pos = reader.read(document);
    if (!pos) { setStatus('idle', 'No board found'); return log('no board / unreadable'); }
    const { fen, sideToMove } = ChessFen.buildFen(pos);
    if (sideToMove !== pos.bottomColor) setStatus('wait', 'Waiting for opponent', pos);
    if (sideToMove !== pos.bottomColor) return log('not your turn', { sideToMove, bottom: pos.bottomColor, lastMove: pos.lastMove });
    log('analysing', fen);
    setStatus('think', 'Thinking…', pos);

    currentFen = fen;
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'analyze', fen });
    } catch (e) {
      setStatus('error', 'Engine unreachable: reload the page');
      return log('sendMessage failed', e.message); // extension reloaded or worker asleep; next board change retries
    }
    log('engine reply', res);
    if (!enabled || currentFen !== fen || !res || res.stale) return;
    if (!res.ok) return setStatus('error', 'Engine error', pos);
    if (res.none) return setStatus('over', 'No legal move (game over?)', pos);
    const move = describe(pos, res.from, res.to);
    setStatus('move', `Your move: ${move.piece} ${move.from} → ${move.to}`, pos, move, res.eval);
    Overlay.draw(pos.mountEl, res.from, res.to, pos.bottomColor);
  }

  function onMutations(records) {
    // Ignore changes caused by our own arrow, or we would erase it as soon as it is drawn.
    const foreign = records.some((r) => {
      if (Overlay.isOwn(r.target)) return false;
      if (r.type !== 'childList') return true;
      return !(r.addedNodes.length + r.removedNodes.length > 0 &&
        [...r.addedNodes, ...r.removedNodes].every((n) => Overlay.isOwn(n)));
    });
    if (foreign) invalidate();
  }

  function attach() {
    const pos = reader.read(document);
    const board = pos && pos.boardEl;
    if (board === observedBoard) return;
    if (observer) observer.disconnect();
    observedBoard = board;
    if (!board) return;
    observer = new MutationObserver(onMutations);
    observer.observe(board, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
    invalidate();
  }

  function start() {
    enabled = true;
    attach();
    pollTimer = setInterval(attach, POLL_MS);
  }

  function stop() {
    enabled = false;
    clearInterval(pollTimer);
    clearTimeout(timer);
    if (observer) observer.disconnect();
    observer = observedBoard = null;
    currentFen = null;
    Overlay.clear();
  }

  function apply(value) {
    if (value && !enabled) start();
    else if (!value && enabled) stop();
  }

  chrome.storage.local.get('enabled').then(({ enabled: v }) => apply(!!v));
  chrome.storage.onChanged.addListener((changes) => { if (changes.enabled) apply(!!changes.enabled.newValue); });
})();
