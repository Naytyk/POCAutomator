#!/bin/bash
echo "🔨 Building POC Automator for Firefox..."

# Create build directory
mkdir -p dist/firefox

# Copy common files
cp -r src/common/* dist/firefox/
cp src/firefox/manifest.json dist/firefox/
cp -r src/icons/* dist/firefox/

# Create ZIP file
cd dist/firefox
zip -r ../POCAutomator-Firefox.zip . -x "*.DS_Store"

cd ../..
echo "✅ Firefox build complete!"
echo "   - POCAutomator-Firefox.zip (for Firefox Add-ons)"
