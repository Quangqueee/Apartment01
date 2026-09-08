import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1C1917"/>
  <g transform="translate(116 108) scale(11.67)" fill="none" stroke="#CDA533" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L2 7V21H22V7L12 2Z"/>
    <path d="M12 12L2 7"/>
    <path d="M12 12L22 7"/>
    <path d="M12 12V21"/>
    <path d="M16 17H8V14H16V17Z"/>
  </g>
</svg>`;

const targets = [
  { file: path.join(root, "public/icons/icon-192.png"), size: 192 },
  { file: path.join(root, "public/icons/icon-512.png"), size: 512 },
  { file: path.join(root, "public/apple-touch-icon.png"), size: 180 },
  { file: path.join(root, "src/app/apple-icon.png"), size: 180 },
  { file: path.join(root, "src/app/icon.png"), size: 192 },
];

await fs.promises.mkdir(path.join(root, "public/icons"), { recursive: true });

for (const target of targets) {
  await sharp(Buffer.from(svg)).resize(target.size, target.size).png().toFile(target.file);
  console.log("wrote", path.relative(root, target.file));
}
