# Requirements

## Core Features:

- Read and monitor WordPress debug.log file
  - Display only new entries since app startup
  - Handle large files by showing only most recent entries
  - No filtering or search capabilities in initial version
  - Support emptying/clearing the debug.log file
  - Auto-scroll to latest log entries
  - Highlight timestamps in log entries
  - Alternating row colors for better readability
- System tray integration with notifications
  - All log entries trigger notifications with first line preview
  - Clicking notification opens main window
  - Custom bug icon in system tray and notifications
  - Hide to tray when window is closed
  - No user-configurable notification preferences
- Main window to display log entries
  - Real-time updates as new entries appear
  - Ability to clear log file contents
  - Responsive layout with proper overflow handling
  - Quit application functionality with cleanup
- WordPress installation detection/selection
  - Support one WordPress installation at a time
  - Manual folder selection
  - Validate selected directory is a WordPress installation
  - Check and configure WP_DEBUG settings in wp-config.php
  - Ensure proper debug configuration (WP_DEBUG_DISPLAY and WP_DEBUG_LOG)
  - Backup and restore original debug settings on quit
  - Install custom mu-plugin for enhanced debugging
  - Cleanup mu-plugin on quit
- Cross-platform support
  - macOS support with proper window management
  - Windows support with installer/uninstaller
  - Linux support

## Technical Stack:

- Electron for desktop app framework
- React for UI
- Tailwind CSS for styling with responsive design
- File system monitoring for log changes
- Sharp for image processing
- Chokidar for file watching
