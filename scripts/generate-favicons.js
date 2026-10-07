const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const svgPath = path.join(__dirname, '../public/masjid-icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Generate PNGs of different sizes
  const sizes = [16, 32, 48, 64, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    pngBuffers[size] = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
  }

  // Save apple touch icon (180x180) and PWA icons
  fs.writeFileSync(path.join(__dirname, '../app/apple-icon.png'), pngBuffers[180]);
  fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), pngBuffers[192]);
  fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), pngBuffers[512]);

  // Copy SVG icon for modern browsers (crisp vector tab icon)
  fs.writeFileSync(path.join(__dirname, '../app/icon.svg'), svgBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/favicon.svg'), svgBuffer);

  // 2. Generate multi-resolution .ico file containing 16x16, 32x32, 48x48 PNGs
  const icoSizes = [16, 32, 48];
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type: 1 for Icon
  icoHeader.writeUInt16LE(icoSizes.length, 4); // Number of images

  let offset = 6 + (16 * icoSizes.length);
  const entryBuffers = [];
  const imageBuffers = [];

  for (const size of icoSizes) {
    const imgBuf = pngBuffers[size];
    imageBuffers.push(imgBuf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // Width
    entry.writeUInt8(size, 1); // Height
    entry.writeUInt8(0, 2);    // Color palette
    entry.writeUInt8(0, 3);    // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6);// Bits per pixel
    entry.writeUInt32LE(imgBuf.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12);       // Image data offset
    entryBuffers.push(entry);

    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...entryBuffers, ...imageBuffers]);

  // Overwrite app/favicon.ico and public/favicon.ico
  fs.writeFileSync(path.join(__dirname, '../app/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);

  console.log('Successfully generated all mosque favicons and icons!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
