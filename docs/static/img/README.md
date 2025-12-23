# Icon and Image Assets

This directory contains all visual assets for the env-doctor documentation site.

## Files

### Core Icons

- **logo.svg** - Main logo (120x120) - Used in navbar and branding
- **favicon.svg** - Favicon source (32x32) - Convert to favicon.ico
- **favicon.ico** - Browser favicon (16x16, 32x32) - Generated from favicon.svg

### Social Media

- **env-doctor-social.svg** - Social card source (1200x630)
- **env-doctor-social.png** - Social card for Open Graph/Twitter (1200x630) - Generated from SVG

### App Icons

- **icon-16.svg** - 16x16 icon
- **icon-32.svg** - 32x32 icon  
- **icon-192.svg** - 192x192 icon (PWA)
- **icon-512.svg** - 512x512 icon (PWA)
- **apple-touch-icon.png** - 180x180 for iOS (generated from icon-192.svg)

## Generating PNG/ICO Files

Run the generation script:

```bash
./scripts/generate-icons.sh
```

This requires either:
- **ImageMagick**: `brew install imagemagick` or `apt-get install imagemagick`
- **Inkscape**: `brew install inkscape` or `apt-get install inkscape`

### Manual Conversion

If you don't have these tools, use online converters:

1. **SVG to PNG**: https://cloudconvert.com/svg-to-png
   - Convert `env-doctor-social.svg` → `env-doctor-social.png` (1200x630)
   - Convert `icon-192.svg` → `apple-touch-icon.png` (180x180)

2. **PNG to ICO**: https://convertio.co/png-ico/
   - Create `favicon.ico` with sizes 16x16 and 32x32

## Design Guidelines

### Colors
- Primary: `#10b981` (emerald-500)
- Dark: `#059669` (emerald-600)
- Light: `#34d399` (emerald-400)

### Logo Elements
- Stethoscope (medical theme)
- `.env` text hint (environment variables)
- Green gradient background

### Social Card
- 1200x630 pixels (Open Graph standard)
- Includes logo, title, tagline, and terminal preview
- Green gradient background

