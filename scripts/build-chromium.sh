#!/bin/bash
echo "🔨 Building POC Automator for Chromium-based browsers (Chrome & Edge)..."

# Create build directory
mkdir -p dist/chromium

# Copy common files
cp -r src/common/* dist/chromium/
cp src/chromium/manifest.json dist/chromium/
cp -r src/icons/* dist/chromium/

# Create ZIP files
cd dist/chromium
zip -r ../POCAutomator-Chrome.zip . -x "*.DS_Store"
cp ../POCAutomator-Chrome.zip ../POCAutomator-Edge.zip

cd ../..
echo "✅ Chromium builds complete!"
echo "   - POCAutomator-Chrome.zip (for Chrome Web Store)"
echo "   - POCAutomator-Edge.zip (for Microsoft Edge Add-ons)"
