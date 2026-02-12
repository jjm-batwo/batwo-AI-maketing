/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');

async function generateImages() {
  try {
    // OG Image (1200x630)
    const ogSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#2563EB"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle">
          바투 AI 마케팅
        </text>
      </svg>
    `;

    await sharp(Buffer.from(ogSvg))
      .png()
      .toFile(path.join(__dirname, '../public/og-image.png'));

    console.log('✅ OG image created: public/og-image.png');

    // Logo (500x500)
    const logoSvg = `
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" fill="#2563EB"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="96"
          font-weight="bold"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle">
          바투
        </text>
      </svg>
    `;

    await sharp(Buffer.from(logoSvg))
      .png()
      .toFile(path.join(__dirname, '../public/logo.png'));

    console.log('✅ Logo created: public/logo.png');

  } catch (error) {
    console.error('❌ Error generating images:', error);
    process.exit(1);
  }
}

generateImages();
