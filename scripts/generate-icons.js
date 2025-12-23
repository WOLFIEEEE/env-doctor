#!/usr/bin/env node
/**
 * Generate PNG and ICO files from SVG icons
 * 
 * This script uses sharp (if available) or provides instructions for manual conversion.
 * Install sharp: npm install -g sharp-cli
 */

const fs = require('fs');
const path = require('path');

const DOCS_IMG_DIR = path.join(__dirname, '..', 'docs', 'static', 'img');

async function checkSharp() {
  try {
    require.resolve('sharp');
    return require('sharp');
  } catch {
    return null;
  }
}

async function generateIcons() {
  const sharp = await checkSharp();
  
  if (!sharp) {
    console.log('⚠️  Sharp not found. Install it with: npm install -g sharp-cli');
    console.log('\n📝 Manual conversion instructions:');
    console.log('   1. favicon.ico: Use https://realfavicongenerator.net/');
    console.log('   2. env-doctor-social.png: Use https://cloudconvert.com/svg-to-png (1200x630)');
    console.log('   3. apple-touch-icon.png: Use https://cloudconvert.com/svg-to-png (180x180)');
    console.log('\n   Or install sharp: npm install -g sharp-cli');
    return;
  }

  console.log('✓ Sharp found. Generating icons...\n');

  try {
    // Generate favicon sizes
    if (fs.existsSync(path.join(DOCS_IMG_DIR, 'favicon.svg'))) {
      console.log('  Generating favicon sizes...');
      const faviconSvg = sharp(path.join(DOCS_IMG_DIR, 'favicon.svg'));
      
      await faviconSvg
        .resize(16, 16)
        .png()
        .toFile(path.join(DOCS_IMG_DIR, 'favicon-16.png'));
      
      await faviconSvg
        .resize(32, 32)
        .png()
        .toFile(path.join(DOCS_IMG_DIR, 'favicon-32.png'));
      
      console.log('    ✓ Generated favicon-16.png and favicon-32.png');
      console.log('    ⚠️  Note: Combine these into favicon.ico using an online tool');
    }

    // Generate social card
    if (fs.existsSync(path.join(DOCS_IMG_DIR, 'env-doctor-social.svg'))) {
      console.log('  Generating env-doctor-social.png (1200x630)...');
      await sharp(path.join(DOCS_IMG_DIR, 'env-doctor-social.svg'))
        .resize(1200, 630)
        .png()
        .toFile(path.join(DOCS_IMG_DIR, 'env-doctor-social.png'));
      console.log('    ✓ Generated env-doctor-social.png');
    }

    // Generate apple touch icon
    if (fs.existsSync(path.join(DOCS_IMG_DIR, 'icon-192.svg'))) {
      console.log('  Generating apple-touch-icon.png (180x180)...');
      await sharp(path.join(DOCS_IMG_DIR, 'icon-192.svg'))
        .resize(180, 180)
        .png()
        .toFile(path.join(DOCS_IMG_DIR, 'apple-touch-icon.png'));
      console.log('    ✓ Generated apple-touch-icon.png');
    }

    // Generate icon PNGs
    for (const size of [16, 32, 192, 512]) {
      const svgPath = path.join(DOCS_IMG_DIR, `icon-${size}.svg`);
      if (fs.existsSync(svgPath)) {
        console.log(`  Generating icon-${size}.png...`);
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(path.join(DOCS_IMG_DIR, `icon-${size}.png`));
        console.log(`    ✓ Generated icon-${size}.png`);
      }
    }

    console.log('\n✅ Icon generation complete!');
    console.log('\n⚠️  Remaining step: Create favicon.ico from favicon-16.png and favicon-32.png');
    console.log('   Use: https://realfavicongenerator.net/ or https://convertio.co/png-ico/');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

