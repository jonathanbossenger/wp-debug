# Requirements

## Core Features:

- Read and monitor WordPress debug.log file
  - Display only new entries since app startup
  - Handle large files by showing only most recent entries
  - No filtering or search capabilities in initial version
  - Support emptying/clearing the debug.log file
- System tray integration with notifications
  - All log entries trigger notifications
  - Clicking notification opens main window
  - No user-configurable notification preferences
- Main window to display log entries
  - Real-time updates as new entries appear
  - Ability to clear log file contents
- WordPress installation detection/selection
  - Support one WordPress installation at a time
  - Manual folder selection
  - No WordPress installation validation required
- Cross-platform support

## Technical Stack:

- Electron for desktop app framework
- React for UI
- Simple styling solution (we can use Tailwind CSS as it's easy to use)
- File system monitoring for log changes
