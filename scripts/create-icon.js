const Jimp = require('jimp');
const path = require('path');

const size = 32;
const outputPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');

// Create a new image
new Jimp(size, size, '#2563EB', async (err, image) => {
  if (err) throw err;

  // Create white rectangles for the "log lines" effect
  const white = Jimp.cssColorToHex('#FFFFFF');
  
  // Draw three white rectangles
  for (let i = 0; i < 3; i++) {
    const y = 8 + (i * 6);
    for (let x = 8; x < 24; x++) {
      for (let h = 0; h < 4; h++) {
        image.setPixelColor(white, x, y + h);
      }
    }
  }

  // Save the image
  await image.writeAsync(outputPath);
  console.log('Icon created successfully');
}); 
