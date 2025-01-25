const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;
let watcher = null;

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
  app.quit();
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
