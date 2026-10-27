// Draws one arrow as an SVG (viewBox 0 0 8 8) stretched over the board.
(function (root) {
  const NS = 'http://www.w3.org/2000/svg';
  const MARK = 'data-chess-arrow';
  const SIGNAL = '#ff5a1f';
  const SOFT = 0.62; // translucent, so it reads on any board without shouting

  // Centre of a square in the 8x8 viewBox, given which colour is at the bottom.
  function center(sq, bottomColor) {
    const f = sq.charCodeAt(0) - 97;
    const r = +sq[1];
    return bottomColor === 'b' ? { x: 7 - f + 0.5, y: r - 1 + 0.5 } : { x: f + 0.5, y: 8 - r + 0.5 };
  }

  // Points the arrow follows: straight for most pieces, an L (long leg first) for knights.
  function path(from, to, bottomColor) {
    const a = center(from, bottomColor);
    const b = center(to, bottomColor);
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
    if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return [a, b];
    return [a, dx > dy ? { x: b.x, y: a.y } : { x: a.x, y: b.y }, b];
  }

  function el(name, attrs) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function isOwn(node) {
    const e = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!(e && e.closest && e.closest('[' + MARK + ']'));
  }

  function clear() {
    for (const s of document.querySelectorAll('[' + MARK + ']')) s.remove();
  }

  function draw(mountEl, from, to, bottomColor) {
    clear();
    const pts = path(from, to, bottomColor);
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const len = Math.hypot(end.x - prev.x, end.y - prev.y);
    const ux = (end.x - prev.x) / len, uy = (end.y - prev.y) / len;
    const headLen = 0.5, headHalf = 0.3;
    const base = { x: end.x - ux * headLen, y: end.y - uy * headLen };
    const p = (x, y) => x + ',' + y;

    const svg = el('svg', {
      [MARK]: '1', viewBox: '0 0 8 8', preserveAspectRatio: 'none',
      style: 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:100;',
    });
    // One translucent group so the joint and head don't double up in colour.
    const g = el('g', { opacity: 0 });
    g.appendChild(el('animate', { attributeName: 'opacity', from: 0, to: SOFT, dur: '0.18s', fill: 'freeze' }));
    const line = [...pts.slice(0, -1), base].map((q) => p(q.x, q.y)).join(' ');
    g.appendChild(el('polyline', { points: line, fill: 'none', stroke: SIGNAL, 'stroke-width': 0.17, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    g.appendChild(el('polygon', {
      fill: SIGNAL,
      points: [p(end.x, end.y), p(base.x - uy * headHalf, base.y + ux * headHalf), p(base.x + uy * headHalf, base.y - ux * headHalf)].join(' '),
    }));
    svg.appendChild(g);
    mountEl.appendChild(svg);
  }

  const api = { center, path, draw, clear, isOwn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Overlay = api;
})(typeof self !== 'undefined' ? self : this);
