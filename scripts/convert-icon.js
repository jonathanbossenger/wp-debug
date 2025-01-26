const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'assets', 'tray-icon.svg');
const outputPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');

sharp(inputPath)
  .resize(32, 32)
  .png()
  .toFile(outputPath)
  .then(() => console.log('Icon converted successfully'))
  .catch(err => console.error('Error converting icon:', err)); 
