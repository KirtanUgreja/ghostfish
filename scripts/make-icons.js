// Renders extension/icons/icon.svg to the PNG sizes Chrome wants. Run: npm run icons
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const dir = path.join(__dirname, '../extension/icons');
const svg = fs.readFileSync(path.join(dir, 'icon.svg'));
for (const size of [16, 32, 48, 128]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png);
}
