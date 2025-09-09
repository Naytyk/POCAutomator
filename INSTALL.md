# POC Automator - Installation Guide

## Method 1: Download from GitHub Releases (Recommended)

1. Go to the [Releases page](https://github.com/naytyk/POCAutomator/releases)
2. Download the latest `POCAutomator-vX.X.X.zip` file
3. Extract the ZIP file to a folder on your computer
4. Open Chrome and go to `chrome://extensions/`
5. Enable **Developer mode** (toggle in top right)
6. Click **Load unpacked**
7. Select the extracted folder
8. The POC Automator extension will appear in your Chrome toolbar

## Method 2: Clone Repository

git clone https://github.com/naytyk/POCAutomator.git
cd POCAutomator

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `src/` folder from the cloned repository

## Usage

1. Navigate to a company profile page with contact tables
2. Click the POC Automator icon in your Chrome toolbar
3. Click "Extract POC Data" button
4. If prompted, allow popup permissions
5. View extracted data in the new tab that opens
6. Download as CSV if needed

## Updating

### From GitHub Releases:
- Download the new version and replace the old folder
- Click the refresh icon in `chrome://extensions/`

### From Repository:
git pull origin main

Then refresh the extension in `chrome://extensions/`

## Troubleshooting

- **Popup Blocked**: Enable popups for the website in Chrome settings
- **No Data Found**: Ensure you're on a page with the correct table structure
- **Permission Denied**: Click "Allow" when the extension requests permissions

## Features

- ✅ Automatic POC data extraction from company profiles
- ✅ Supports "Founders & Key People" and "Senior Management" tables
- ✅ CSV export functionality
- ✅ Automatic popup permission handling
- ✅ Clean, professional results display

