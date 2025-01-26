const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const generateTrayIcon = async () => {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '..', 'assets', 'bug-solid.svg'));
  const pngBuffer = await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toBuffer();

  // Save the PNG buffer to a file
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'tray-icon.png'), pngBuffer);
  console.log('Tray icon generated successfully');
};

generateTrayIcon().catch(console.error); 
