const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#9333EA" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background rounded card with shadow -->
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#bgGrad)" filter="url(#shadow)" />
  
  <!-- Subtle inner border -->
  <rect x="34" y="34" width="444" height="444" rx="94" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.25" />

  <!-- Picture Frame / Image Landscape -->
  <g transform="translate(96, 96)">
    <!-- Sun / Moon -->
    <circle cx="230" cy="80" r="32" fill="#FDE047" opacity="0.95" />
    
    <!-- Mountains -->
    <path d="M 30 240 L 130 110 L 210 210 L 240 180 L 290 240 Z" fill="#E0E7FF" opacity="0.9" />
    <path d="M 120 240 L 190 145 L 260 240 Z" fill="#C7D2FE" opacity="0.75" />
    
    <!-- Outer Image Border -->
    <rect x="10" y="20" width="300" height="230" rx="24" fill="none" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- Compression / Lightning Badge in corner -->
  <g transform="translate(310, 310)">
    <circle cx="70" cy="70" r="70" fill="url(#badgeGrad)" stroke="#FFFFFF" stroke-width="8" filter="url(#shadow)" />
    <!-- Lightning bolt / Sparkle -->
    <path d="M 75 35 L 50 75 L 70 75 L 65 105 L 92 65 L 72 65 Z" fill="#FFFFFF" />
  </g>
</svg>
`;

function createIcoBuffer(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height (0 means 256)
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // Bit count
    entry.writeUInt32LE(buf.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    entries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function run() {
  const assetsDir = path.resolve(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svgIcon);

  // High-res preview PNG
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(assetsDir, 'icon.png'));

  // Resolutions for standard Windows ICO
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  for (const s of sizes) {
    const b = await sharp(svgBuffer).resize(s, s).png().toBuffer();
    pngBuffers.push(b);
  }

  const icoBuffer = createIcoBuffer(pngBuffers, sizes);
  fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
  console.log(`Generated icon.png and icon.ico successfully in ${assetsDir}`);
}

run().catch(console.error);
