// UCI line parsers.
// parseBestmove: "bestmove" line. Returns {from, to}, or null for "(none)" / non-bestmove lines.
// Promotion suffix (e7e8q) is dropped: the arrow only needs the squares.
(function (root) {
  function parseBestmove(line) {
    const m = /^bestmove\s+([a-h][1-8])([a-h][1-8])/.exec(line);
    return m ? { from: m[1], to: m[2] } : null;
  }
  // parseInfo: score + depth from an "info" line, from the side to move's view. Null for bounds / other lines.
  function parseInfo(line) {
    const d = /\bdepth (\d+)/.exec(line);
    const cp = /\bscore cp (-?\d+)/.exec(line);
    const mate = /\bscore mate (-?\d+)/.exec(line);
    if (!d || (!cp && !mate) || /\b(lowerbound|upperbound)\b/.test(line)) return null;
    return mate ? { depth: +d[1], mate: +mate[1] } : { depth: +d[1], cp: +cp[1] };
  }

  const api = { parseBestmove, parseInfo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EngineUtil = api;
})(typeof self !== 'undefined' ? self : this);
