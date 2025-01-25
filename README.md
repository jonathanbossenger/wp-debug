# WP Debug

A desktop application for monitoring WordPress debug logs in real-time. Built with Electron and React.

## Features

- Real-time monitoring of WordPress debug.log files
- Automatic detection and validation of WordPress installations
- Automatic configuration of WordPress debug settings
- Clean, modern UI with real-time updates
- System tray integration with notifications
- Cross-platform support (macOS, Windows, Linux)

## Technical Stack

- Electron - Desktop application framework
- React - UI framework
- Tailwind CSS - Styling and responsive design
- Chokidar - File system monitoring

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A local WordPress installation for testing

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wp-debug.git
cd wp-debug
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will:
- Start webpack in watch mode for the renderer process
- Launch Electron in development mode
- Enable hot reloading for React components

## Building Executables

The project uses Electron Forge for building platform-specific executables.

### Build for all platforms:
```bash
npm run make
```

This will create executables in the `out/make` directory for:
- macOS (.dmg)
- Windows (.exe)
- Linux (.deb, .rpm)

### Platform-specific builds:

For macOS:
```bash
npm run make -- --platform=darwin
```

For Windows:
```bash
npm run make -- --platform=win32
```

For Linux:
```bash
npm run make -- --platform=linux
```

## Usage

1. Launch the application
2. Select your WordPress installation directory
3. The app will automatically:
   - Validate the WordPress installation
   - Configure debug settings in wp-config.php if needed
   - Start monitoring the debug.log file
4. New debug log entries will appear in real-time with timestamp highlighting
5. Use the system tray icon for quick access and notifications

## Development Scripts

- `npm start` - Start the application
- `npm run dev` - Start the application in development mode
- `npm run build` - Build the renderer process
- `npm run package` - Package the application without creating installers
- `npm run make` - Create platform-specific distributables

## License

GPL-2.0-or-later 
