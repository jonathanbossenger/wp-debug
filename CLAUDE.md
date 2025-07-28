# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WP Debug is an Electron-based desktop application for monitoring WordPress debug logs in real-time. The app provides a React frontend with real-time file monitoring capabilities, system tray integration, and automatic WordPress configuration management.

## Architecture

**Main Process** (`main/index.js`):
- Electron main process handling file system operations, tray management, and WordPress configuration
- Manages chokidar file watcher for real-time log monitoring
- Handles IPC communication with renderer process
- Manages WordPress wp-config.php modifications and mu-plugin installation/cleanup

**Renderer Process** (`renderer/`):
- React frontend built with Tailwind CSS
- Entry point: `renderer/src/index.js` → `renderer/src/App.js`
- Components in `renderer/src/components/`
- Webpack builds to `renderer/index.js`

**Build System**:
- Webpack for renderer process bundling with Babel for React/ES6
- Electron Forge for packaging and distribution
- PostCSS with Tailwind CSS for styling
- Icon generation scripts in `scripts/`

## Development Commands

```bash
# Start development with hot reload
npm run dev

# Build renderer for production
npm run build

# Start application directly
npm start

# Package application without installers
npm run package

# Create platform-specific distributables
npm run make

# Platform-specific builds
npm run make -- --platform=darwin   # macOS
npm run make -- --platform=win32    # Windows
npm run make -- --platform=linux    # Linux

# Icon generation
npm run generate-icons    # App icons
npm run generate-tray     # Tray icons
npm run generate-all      # Both
```

## Key Components

**Main Process (`main/index.js`)**:
- `isWordPressDirectory()` - Validates WordPress installations
- `enableWPDebug()` / `cleanupWPDebug()` - Manages wp-config.php modifications
- `createMuPlugin()` / `removeMuPlugin()` - Handles wp_debug() helper function
- Chokidar watcher for real-time log monitoring
- System tray with notifications

**React App (`renderer/src/App.js`)**:
- Directory selection and validation
- Real-time log display with expand/collapse
- Recent directories management via electron-store
- IPC communication with main process

## WordPress Integration

The app automatically:
1. Validates WordPress installations by checking for wp-config.php
2. Backs up and modifies wp-config.php to enable debug logging
3. Installs a mu-plugin with `wp_debug()` helper function
4. Monitors wp-content/debug.log for changes
5. Restores original configuration on exit

## File Structure

- `main/` - Electron main process
- `renderer/` - React frontend (built by webpack)
- `assets/` - Icons and images
- `scripts/` - Build utilities for icon generation
- `out/` - Built executables and packages

## Dependencies

**Runtime**: electron, react, react-dom, chokidar, electron-store, tailwindcss
**Build**: webpack, babel, electron-forge, sharp (for icons), postcss

## Notes

- No test framework is configured
- Uses GPL-2.0-or-later license
- Cross-platform support (macOS, Windows, Linux)
- System tray integration with notifications
- File watching requires local WordPress installations (no Docker support)