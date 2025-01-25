const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs').promises;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;
let watcher = null;

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
};

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select WordPress Installation Directory',
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
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
    await fs.access(debugLogPath).catch(async () => {
      await fs.writeFile(debugLogPath, '');
    });

    watcher = chokidar.watch(debugLogPath, {
      persistent: true,
      usePolling: true,
      ignoreInitial: true
    });

    watcher.on('change', async () => {
      try {
        const content = await fs.readFile(debugLogPath, 'utf8');
        mainWindow.webContents.send('debug-log-updated', content);
      } catch (error) {
        console.error('Error reading debug.log:', error);
      }
    });

    // Read initial content
    const initialContent = await fs.readFile(debugLogPath, 'utf8');
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
    await fs.writeFile(debugLogPath, '');
    return true;
  } catch (error) {
    console.error('Error clearing debug.log:', error);
    throw error;
  }
});

app.whenReady().then(() => {
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
