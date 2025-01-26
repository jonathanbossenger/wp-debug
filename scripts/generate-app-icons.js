const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const PNG2Icons = require('png2icons');

const sizes = {
  mac: [
    { size: 16, name: '16x16.png' },
    { size: 32, name: '32x32.png' },
    { size: 64, name: '64x64.png' },
    { size: 128, name: '128x128.png' },
    { size: 256, name: '256x256.png' },
    { size: 512, name: '512x512.png' },
    { size: 1024, name: '1024x1024.png' }
  ],
  win: [16, 24, 32, 48, 64, 128, 256],
  linux: [16, 32, 48, 64, 128, 256, 512]
};

const generateIcons = async () => {
  const sourceImage = path.join(__dirname, '..', 'assets', 'wp-debug.svg');
  const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
  const macIconsDir = path.join(iconsDir, 'mac');
  const winIconsDir = path.join(iconsDir, 'win');
  const linuxIconsDir = path.join(iconsDir, 'linux');

  // Ensure icons directories exist
  [iconsDir, macIconsDir, winIconsDir, linuxIconsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate 1024x1024 PNG for base icon
  const pngBuffer = await sharp(sourceImage)
    .resize(1024, 1024)
    .png()
    .toBuffer();

  // Save the base PNG
  fs.writeFileSync(path.join(iconsDir, 'icon.png'), pngBuffer);

  // Generate ICNS file for macOS
  const icnsBuffer = PNG2Icons.createICNS(pngBuffer, PNG2Icons.BILINEAR, 0);
  if (icnsBuffer) {
    fs.writeFileSync(path.join(iconsDir, 'icon.icns'), icnsBuffer);
  }

  // Generate ICO file for Windows
  const icoBuffer = PNG2Icons.createICO(pngBuffer, PNG2Icons.BILINEAR, 0, false);
  if (icoBuffer) {
    fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
  }

  // Generate mac icons for other purposes
  for (const { size, name } of sizes.mac) {
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(macIconsDir, name));
  }

  // Generate windows icons
  for (const size of sizes.win) {
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(winIconsDir, `${size}x${size}.png`));
  }

  // Generate linux icons
  for (const size of sizes.linux) {
    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(path.join(linuxIconsDir, `${size}x${size}.png`));
  }

  console.log('App icons generated successfully');
};

generateIcons().catch(console.error); 
