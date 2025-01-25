const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');

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

async function handleSelectDirectory() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    const directory = result.filePaths[0];
    
    // Validate it's a WordPress directory
    if (await isWordPressDirectory(directory)) {
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
  ipcMain.handle('selectDirectory', handleSelectDirectory);
  ipcMain.handle('watchDebugLog', handleWatchDebugLog);
  ipcMain.handle('clearDebugLog', handleClearDebugLog);
  ipcMain.handle('checkDebugSettings', async (event, directory) => {
    return await checkDebugSettings(directory);
  });
  ipcMain.handle('updateDebugSettings', async (event, directory) => {
    return await updateDebugSettings(directory);
  });
}
