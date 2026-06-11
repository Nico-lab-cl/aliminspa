const sharp = require('sharp');
const path = require('path');

const srcLogo = path.join(__dirname, 'public/images/home_redesign/logo.png.webp');
const destIcon = path.join(__dirname, 'src/app/icon.png');

sharp(srcLogo)
  .resize(512, 512, { 
      fit: 'contain', 
      background: { r: 0, g: 0, b: 0, alpha: 0 } 
   })
  .png()
  .toFile(destIcon)
  .then(() => {
    console.log('Icon successfully generated at src/app/icon.png');
  })
  .catch(console.error);
