// Parses a UCI "bestmove" line. Returns {from, to}, or null for "(none)" / non-bestmove lines.
// Promotion suffix (e7e8q) is dropped: the arrow only needs the squares.
(function (root) {
  function parseBestmove(line) {
    const m = /^bestmove\s+([a-h][1-8])([a-h][1-8])/.exec(line);
    return m ? { from: m[1], to: m[2] } : null;
  }
  const api = { parseBestmove };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EngineUtil = api;
})(typeof self !== 'undefined' ? self : this);
