#!/bin/bash
# Script to generate PNG and ICO files from SVG icons
# Requires: ImageMagick (convert) or Inkscape

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_IMG_DIR="$PROJECT_ROOT/docs/static/img"

cd "$DOCS_IMG_DIR"

echo "Generating icons from SVG files..."

# Check for ImageMagick
if command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    
    # Generate favicon.ico from favicon.svg
    if [ -f "favicon.svg" ]; then
        echo "  Generating favicon.ico..."
        convert -background none favicon.svg -resize 32x32 favicon-32.png
        convert -background none favicon.svg -resize 16x16 favicon-16.png
        convert favicon-16.png favicon-32.png favicon.ico
        rm favicon-16.png favicon-32.png
    fi
    
    # Generate PNG versions of social card
    if [ -f "env-doctor-social.svg" ]; then
        echo "  Generating env-doctor-social.png (1200x630)..."
        convert -background none env-doctor-social.svg -resize 1200x630 env-doctor-social.png
    fi
    
    # Generate PNG versions of icons
    for size in 16 32 192 512; do
        if [ -f "icon-${size}.svg" ]; then
            echo "  Generating icon-${size}.png..."
            convert -background none "icon-${size}.svg" -resize "${size}x${size}" "icon-${size}.png"
        fi
    done
    
    # Generate apple-touch-icon
    if [ -f "icon-192.svg" ]; then
        echo "  Generating apple-touch-icon.png (180x180)..."
        convert -background none icon-192.svg -resize 180x180 apple-touch-icon.png
    fi

# Check for Inkscape
elif command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    
    # Generate favicon.ico (requires multiple sizes)
    if [ -f "favicon.svg" ]; then
        echo "  Generating favicon.ico..."
        inkscape -w 16 -h 16 favicon.svg -o favicon-16.png
        inkscape -w 32 -h 32 favicon.svg -o favicon-32.png
        # Note: ICO creation from PNG requires ImageMagick or online tool
        echo "    Note: Convert favicon-16.png and favicon-32.png to favicon.ico manually"
    fi
    
    # Generate social card PNG
    if [ -f "env-doctor-social.svg" ]; then
        echo "  Generating env-doctor-social.png (1200x630)..."
        inkscape -w 1200 -h 630 env-doctor-social.svg -o env-doctor-social.png
    fi
    
    # Generate PNG versions
    for size in 16 32 192 512; do
        if [ -f "icon-${size}.svg" ]; then
            echo "  Generating icon-${size}.png..."
            inkscape -w "$size" -h "$size" "icon-${size}.svg" -o "icon-${size}.png"
        fi
    done
    
    # Generate apple-touch-icon
    if [ -f "icon-192.svg" ]; then
        echo "  Generating apple-touch-icon.png (180x180)..."
        inkscape -w 180 -h 180 icon-192.svg -o apple-touch-icon.png
    fi

else
    echo "Error: Neither ImageMagick nor Inkscape found."
    echo ""
    echo "Install one of the following:"
    echo "  - ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
    echo "  - Inkscape: brew install inkscape (macOS) or apt-get install inkscape (Linux)"
    echo ""
    echo "Alternatively, use an online converter:"
    echo "  - SVG to PNG: https://cloudconvert.com/svg-to-png"
    echo "  - PNG to ICO: https://convertio.co/png-ico/"
    echo ""
    echo "Required files:"
    echo "  - favicon.ico (16x16, 32x32)"
    echo "  - env-doctor-social.png (1200x630)"
    echo "  - apple-touch-icon.png (180x180)"
    exit 1
fi

echo ""
echo "✓ Icons generated successfully!"

