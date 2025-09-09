# POC Automator

A powerful Chrome extension that automatically extracts contact information from "Founders & Key People" and "Senior Management" tables on company profile pages.

## Browser Compatibility

[132]

### Browser Market Share Support
- **Chrome**: ~65% market share - Fully Supported
- **Edge**: ~4% market share - Fully Supported  
- **Firefox**: ~3% market share - Supported
- **Safari**: ~19% market share - Coming soon

**Total Coverage**: ~72% of desktop browser market

## Quick Downloads
- **Chrome**: [Download Chrome Extension](https://github.com/naytyk/POCAutomator/releases/latest/download/POCAutomator-Chrome.zip)
- **Edge**: [Download Edge Extension](https://github.com/naytyk/POCAutomator/releases/latest/download/POCAutomator-Edge.zip)
- **Firefox**: [Download Firefox Add-on](https://github.com/naytyk/POCAutomator/releases/latest/download/POCAutomator-Firefox.zip)

## Features

- Smart Detection: Automatically finds contact tables on company profile pages
- Multi-Field Extraction: Extracts POC roles, names, and email addresses
- CSV Export: Download extracted data as CSV files
- Permission Handling: Automatic popup and permission management
- Professional UI: Clean, modern interface with real-time status updates
- Cross-Browser: Works on Chrome, Edge, and Firefox
- Fast Processing: Efficient extraction with progress indicators

## Quick Start

1. **Install** the extension for your browser
2. **Navigate** to any company profile page with contact tables
3. **Click** the POC Automator icon in your browser toolbar
4. **Extract** contact data with one click
5. **Download** results as CSV or view in formatted table

## Development

### Build from Source

Clone repository

git clone https://github.com/naytyk/POCAutomator.git
cd POCAutomator
Build all browser versions

chmod +x scripts/build-all.sh
./scripts/build-all.sh


### Browser-Specific Builds

Build for Chromium-based browsers (Chrome & Edge)

./scripts/build-chromium.sh
Build for Firefox

./scripts/build-firefox.sh