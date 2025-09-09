#!/bin/bash
echo "🚀 Building POC Automator for all supported browsers..."

# Clean previous builds
rm -rf dist/*

# Build for all browsers
./scripts/build-chromium.sh
echo ""
./scripts/build-firefox.sh

echo ""
echo "🎉 All builds completed successfully!"
echo ""
echo "📦 Generated files:"
echo "   - dist/POCAutomator-Chrome.zip"
echo "   - dist/POCAutomator-Edge.zip"  
echo "   - dist/POCAutomator-Firefox.zip"
echo ""
echo "Ready for distribution! 🚀"
