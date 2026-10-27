// Draws one arrow as an SVG (viewBox 0 0 8 8) stretched over the board.
(function (root) {
  const NS = 'http://www.w3.org/2000/svg';
  const MARK = 'data-chess-arrow';
  const SIGNAL = '#ff5a1f';

  // Centre of a square in the 8x8 viewBox, given which colour is at the bottom.
  function center(sq, bottomColor) {
    const f = sq.charCodeAt(0) - 97;
    const r = +sq[1];
    return bottomColor === 'b' ? { x: 7 - f + 0.5, y: r - 1 + 0.5 } : { x: f + 0.5, y: 8 - r + 0.5 };
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
    const a = center(from, bottomColor);
    const b = center(to, bottomColor);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const headLen = 0.5, headHalf = 0.3;
    const base = { x: b.x - ux * headLen, y: b.y - uy * headLen };

    const svg = el('svg', {
      [MARK]: '1', viewBox: '0 0 8 8', preserveAspectRatio: 'none',
      style: 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:100;',
    });
    const p = (x, y) => x + ',' + y;
    const head = [p(b.x, b.y), p(base.x - uy * headHalf, base.y + ux * headHalf), p(base.x + uy * headHalf, base.y - ux * headHalf)].join(' ');
    const g = el('g', { opacity: 0 });
    g.appendChild(el('animate', { attributeName: 'opacity', from: 0, to: 1, dur: '0.18s', fill: 'freeze' }));
    // dark halo first, then the signal-coloured arrow on top
    g.appendChild(el('line', { x1: a.x, y1: a.y, x2: base.x, y2: base.y, stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.24, 'stroke-linecap': 'round' }));
    g.appendChild(el('polygon', { points: head, fill: 'rgba(0,0,0,.35)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.08, 'stroke-linejoin': 'round' }));
    g.appendChild(el('line', { x1: a.x, y1: a.y, x2: base.x, y2: base.y, stroke: SIGNAL, 'stroke-width': 0.16, 'stroke-linecap': 'round' }));
    g.appendChild(el('polygon', { points: head, fill: SIGNAL }));
    g.appendChild(el('circle', { cx: a.x, cy: a.y, r: 0.1, fill: '#fff' }));
    svg.appendChild(g);
    mountEl.appendChild(svg);
  }

  const api = { center, draw, clear, isOwn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Overlay = api;
})(typeof self !== 'undefined' ? self : this);
