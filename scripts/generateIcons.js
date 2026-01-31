const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// SVG poop icon (hand-drawn style that works reliably)
const createPoopSvg = (size) => {
  const scale = size / 100;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9C8575"/>
      <stop offset="100%" style="stop-color:#5D4037"/>
    </linearGradient>
    <linearGradient id="poopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8B6914"/>
      <stop offset="100%" style="stop-color:#5C4012"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="100" height="100" fill="url(#bgGrad)" rx="22" ry="22"/>
  <!-- Poop body -->
  <ellipse cx="50" cy="72" rx="28" ry="18" fill="url(#poopGrad)"/>
  <ellipse cx="50" cy="55" rx="22" ry="14" fill="url(#poopGrad)"/>
  <ellipse cx="50" cy="42" rx="16" ry="10" fill="url(#poopGrad)"/>
  <!-- Poop swirl top -->
  <path d="M50 25 Q58 28 56 35 Q54 40 50 38 Q46 36 48 32 Q49 28 50 25" fill="url(#poopGrad)"/>
  <!-- Eyes -->
  <ellipse cx="42" cy="52" rx="4" ry="5" fill="white"/>
  <ellipse cx="58" cy="52" rx="4" ry="5" fill="white"/>
  <circle cx="43" cy="53" r="2" fill="#333"/>
  <circle cx="59" cy="53" r="2" fill="#333"/>
  <!-- Smile -->
  <path d="M42 65 Q50 72 58 65" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Cheek blush -->
  <ellipse cx="36" cy="62" rx="4" ry="2.5" fill="#D4A574" opacity="0.5"/>
  <ellipse cx="64" cy="62" rx="4" ry="2.5" fill="#D4A574" opacity="0.5"/>
</svg>`;
};

// Simpler favicon version
const createFaviconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9C8575"/>
      <stop offset="100%" style="stop-color:#5D4037"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bgGrad)"/>
  <ellipse cx="50" cy="70" rx="30" ry="20" fill="#6B4423"/>
  <ellipse cx="50" cy="52" rx="24" ry="16" fill="#6B4423"/>
  <ellipse cx="50" cy="38" rx="18" ry="12" fill="#6B4423"/>
  <ellipse cx="50" cy="28" rx="10" ry="8" fill="#6B4423"/>
  <circle cx="42" cy="50" r="4" fill="white"/>
  <circle cx="58" cy="50" r="4" fill="white"/>
  <circle cx="43" cy="51" r="2" fill="#333"/>
  <circle cx="59" cy="51" r="2" fill="#333"/>
</svg>`;

async function generateIcons() {
  console.log('Generating Call of Doody icons...\n');

  try {
    // Main app icon (1024x1024)
    await sharp(Buffer.from(createPoopSvg(1024)))
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('  icon.png (1024x1024)');

    // Favicon (48x48)
    await sharp(Buffer.from(createFaviconSvg(48)))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('  favicon.png (48x48)');

    // Adaptive icon for Android (1024x1024)
    await sharp(Buffer.from(createPoopSvg(1024)))
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('  adaptive-icon.png (1024x1024)');

    // Splash icon
    await sharp(Buffer.from(createPoopSvg(1024)))
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('  splash-icon.png (1024x1024)');

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
