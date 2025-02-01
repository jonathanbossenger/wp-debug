const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');
const Store = require('electron-store');

// Initialize electron store
const store = new Store();

// Function to validate WordPress directory
async function isWordPressDirectory(directory) {
  try {
    const configPath = path.join(directory, 'wp-config.php');
    await fs.access(configPath);
    return true;
  } catch (error) {
    return false;
  }
}

// Add function to manage recent directories
function addToRecentDirectories(directory) {
  const recentDirs = store.get('recentDirectories', []);
  console.log('Current recent dirs:', recentDirs); // Debug log
  const updatedDirs = recentDirs.filter(dir => dir !== directory);
  updatedDirs.unshift(directory);
  const finalDirs = updatedDirs.slice(0, 5);
  store.set('recentDirectories', finalDirs);
  console.log('Updated recent dirs:', finalDirs); // Debug log
}

// Add new IPC handlers
ipcMain.handle('get-recent-directories', () => {
  const dirs = store.get('recentDirectories', []);
  console.log('Returning recent directories:', dirs); // Debug log
  return dirs;
});

ipcMain.handle('select-recent-directory', async (event, directory) => {
  console.log('Validating directory:', directory); // Debug log
  if (await isWordPressDirectory(directory)) {
    addToRecentDirectories(directory);
    return directory;
  }
  throw new Error('Selected directory is no longer a valid WordPress installation');
});

// Update existing handler to store directory
async function handleSelectDirectory() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    const directory = result.filePaths[0];
    
    if (await isWordPressDirectory(directory)) {
      addToRecentDirectories(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress installation');
    }
  }
  return null;
}

// Function to read wp-config.php and check debug settings
async function checkDebugSettings(wpDirectory) {
  try {
    const configPath = path.join(wpDirectory, 'wp-config.php');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Check if WP_DEBUG is set to false
    const debugMatch = configContent.match(/define\(\s*['"]WP_DEBUG['"]\s*,\s*false\s*\)/);
    return !!debugMatch;
  } catch (error) {
    console.error('Error reading wp-config.php:', error);
    throw error;
  }
}

// Function to update debug settings in wp-config.php
async function updateDebugSettings(wpDirectory) {
  try {
    const configPath = path.join(wpDirectory, 'wp-config.php');
    let configContent = await fs.readFile(configPath, 'utf8');
    
    // Replace or add debug settings
    const debugSettings = `
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'WP_DEBUG_LOG', true );`;

    // Check if WP_DEBUG is already defined
    if (configContent.match(/define\(\s*['"]WP_DEBUG['"]/)) {
      // Replace existing WP_DEBUG definition and add other settings if they don't exist
      configContent = configContent.replace(
        /define\(\s*['"]WP_DEBUG['"],\s*false\s*\);/,
        debugSettings
      );
    } else {
      // Add settings before the "/* That's all" comment
      configContent = configContent.replace(
        /\/\* That's all/,
        `${debugSettings}\n\n/* That's all`
      );
    }
    
    await fs.writeFile(configPath, configContent, 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating wp-config.php:', error);
    throw error;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Set up IPC handlers
  ipcMain.handle('select-directory', handleSelectDirectory);
  ipcMain.handle('watch-debug-log', handleWatchDebugLog);
  ipcMain.handle('clear-debug-log', handleClearDebugLog);
  ipcMain.handle('get-recent-directories', () => {
    const dirs = store.get('recentDirectories', []);
    console.log('Returning recent directories:', dirs); // Debug log
    return dirs;
  });
  ipcMain.handle('select-recent-directory', async (event, directory) => {
    console.log('Validating directory:', directory); // Debug log
    if (await isWordPressDirectory(directory)) {
      addToRecentDirectories(directory);
      return directory;
    }
    throw new Error('Selected directory is no longer a valid WordPress installation');
  });
  ipcMain.handle('checkDebugSettings', async (event, directory) => {
    return await checkDebugSettings(directory);
  });
  ipcMain.handle('updateDebugSettings', async (event, directory) => {
    return await updateDebugSettings(directory);
  });
}
