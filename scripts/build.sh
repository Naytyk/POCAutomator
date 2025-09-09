#!/bin/bash

echo "Building POC Automator..."

# Create dist directory
mkdir -p dist

# Copy source files
cp src/* dist/

# Update version in manifest if we have a version tag
if [[ $GITHUB_REF == refs/tags/v* ]]; then
    VERSION=${GITHUB_REF#refs/tags/v}
    echo "Setting version to $VERSION"
    sed -i "s/\"version\": \"1.0.0\"/\"version\": \"$VERSION\"/" dist/manifest.json
fi

echo "POC Automator build complete!"
