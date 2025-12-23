# Quick Icon Conversion Instructions

Since ImageMagick/Inkscape may not be installed, here are quick ways to generate the required files:

## Option 1: Online Tools (Easiest)

### Generate favicon.ico
1. Go to https://realfavicongenerator.net/
2. Upload `favicon.svg`
3. Download the generated `favicon.ico`
4. Place it in `docs/static/img/`

### Generate Social Card PNG
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `env-doctor-social.svg`
3. Set size: 1200x630
4. Download and save as `env-doctor-social.png`

### Generate Apple Touch Icon
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon-192.svg`
3. Set size: 180x180
4. Download and save as `apple-touch-icon.png`

## Option 2: Using Node.js (if you have sharp)

```bash
npm install -g sharp-cli
sharp -i favicon.svg -o favicon-32.png -w 32 -h 32
sharp -i favicon.svg -o favicon-16.png -w 16 -h 16
# Then use online tool to combine into favicon.ico
```

## Option 3: Install ImageMagick

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Then run
./scripts/generate-icons.sh
```

## Required Files Checklist

- [ ] `favicon.ico` (16x16, 32x32)
- [ ] `env-doctor-social.png` (1200x630)
- [ ] `apple-touch-icon.png` (180x180) - Optional but recommended
