const { app, BrowserWindow, ipcMain, dialog, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;
let watcher = null;
let tray = null;

// Function to check if directory is a WordPress installation
const isWordPressDirectory = async (directory) => {
  try {
    const configPath = path.join(directory, 'wp-config.php');
    await fs.promises.access(configPath);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to enable WP_DEBUG configuration
const enableWPDebug = async (wpDirectory) => {
  try {
    const configPath = path.join(wpDirectory, 'wp-config.php');
    let configContent = await fs.promises.readFile(configPath, 'utf8');
    
    // Handle each constant separately
    const constants = [
      { name: 'WP_DEBUG', value: 'true' },
      { name: 'WP_DEBUG_DISPLAY', value: 'false' },
      { name: 'WP_DEBUG_LOG', value: 'true' }
    ];

    for (const { name, value } of constants) {
      const regex = new RegExp(`define\\s*\\(\\s*['"]${name}['"]\\s*,\\s*(.+?)\\s*\\);`, 'g');
      const exists = regex.test(configContent);
      
      if (exists) {
        // Update existing constant
        configContent = configContent.replace(
          new RegExp(`define\\s*\\(\\s*['"]${name}['"]\\s*,\\s*(.+?)\\s*\\);`, 'g'),
          `define( '${name}', ${value} );`
        );
      } else {
        // Add new constant before "That's all" comment or at the end
        const newConstant = `define( '${name}', ${value} );`;
        const insertPosition = configContent.indexOf("/* That's all");
        if (insertPosition !== -1) {
          configContent = configContent.slice(0, insertPosition) + 
            newConstant + '\n' + 
            configContent.slice(insertPosition);
        } else {
          configContent = configContent + '\n' + newConstant;
        }
      }
    }
    
    await fs.promises.writeFile(configPath, configContent, 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating wp-config.php:', error);
    throw error;
  }
};

const createTray = () => {
  // Create a template image for the tray icon
  const trayIcon = nativeImage.createEmpty();
  // Create a simple 16x16 icon with a single color
  const size = 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      trayIcon.addRepresentation({
        width: size,
        height: size,
        buffer: Buffer.alloc(size * size * 4, 0xFF),
        scaleFactor: 1.0
      });
    }
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('WP Debug');
  
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
};

const showNotification = (message) => {
  // Always show notification for new debug entries, regardless of window focus
  const notification = new Notification({
    title: 'WP Debug Log Entry',
    body: message.substring(0, 100) + (message.length > 100 ? '...' : ''), // Truncate long messages
    silent: false,
    timeoutType: 'default'
  });
  
  notification.show();
  notification.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
};

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select WordPress Installation Directory',
  });
  
  if (!result.canceled) {
    const directory = result.filePaths[0];
    // Verify it's a WordPress directory
    if (await isWordPressDirectory(directory)) {
      // Enable WP_DEBUG configuration
      await enableWPDebug(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress installation');
    }
  }
  return null;
});

// Start watching debug.log file
ipcMain.handle('watch-debug-log', async (event, wpDirectory) => {
  const debugLogPath = path.join(wpDirectory, 'wp-content', 'debug.log');
  
  // Stop existing watcher if any
  if (watcher) {
    await watcher.close();
  }

  try {
    // Create empty debug.log if it doesn't exist
    await fs.promises.access(debugLogPath).catch(async () => {
      await fs.promises.writeFile(debugLogPath, '');
    });

    watcher = chokidar.watch(debugLogPath, {
      persistent: true,
      usePolling: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      try {
        const content = await fs.promises.readFile(debugLogPath, 'utf8');
        mainWindow.webContents.send('debug-log-updated', content);
        
        // Show notification for new log entries
        const entries = content.split(/(?=\[)/);
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && lastEntry.trim()) {
          showNotification(lastEntry.trim());
        }
      } catch (error) {
        console.error('Error reading debug.log:', error);
      }
    });

    // Read initial content
    const initialContent = await fs.promises.readFile(debugLogPath, 'utf8');
    return initialContent;
  } catch (error) {
    console.error('Error setting up debug.log watch:', error);
    throw error;
  }
});

// Handle clearing debug.log
ipcMain.handle('clear-debug-log', async (event, wpDirectory) => {
  const debugLogPath = path.join(wpDirectory, 'wp-content', 'debug.log');
  try {
    await fs.promises.writeFile(debugLogPath, '');
    return true;
  } catch (error) {
    console.error('Error clearing debug.log:', error);
    throw error;
  }
});

// Handle quitting the app
ipcMain.handle('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

app.whenReady().then(() => {
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 
