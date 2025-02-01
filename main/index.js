const { app, BrowserWindow, ipcMain, dialog, Tray, nativeImage, Notification, Menu, shell } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

let mainWindow = null;
let watcher = null;
let tray = null;
let isCleaningUp = false;
let store = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize electron store
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      recentDirectories: []
    }
  });
};

// Function to add a directory to recent list
const addToRecentDirectories = (directory) => {
  if (!store) return [];
  const recentDirectories = store.get('recentDirectories', []);
  // Remove the directory if it already exists (to avoid duplicates)
  const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
  // Add the new directory to the start of the array
  filteredDirectories.unshift(directory);
  // Keep only the last 5 directories
  const updatedDirectories = filteredDirectories.slice(0, 5);
  store.set('recentDirectories', updatedDirectories);
  return updatedDirectories;
};

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
    
    // Store original debug settings in electron store
    const originalSettings = {
      directory: wpDirectory,
      WP_DEBUG: null,
      WP_DEBUG_DISPLAY: null,
      WP_DEBUG_LOG: null
    };

    // Extract original values using regex
    const constants = [
      { name: 'WP_DEBUG', value: 'true' },
      { name: 'WP_DEBUG_DISPLAY', value: 'false' },
      { name: 'WP_DEBUG_LOG', value: 'true' }
    ];

    for (const { name } of constants) {
      const regex = new RegExp(`define\\s*\\(\\s*['"]${name}['"]\\s*,\\s*(.+?)\\s*\\);`);
      const match = configContent.match(regex);
      if (match) {
        originalSettings[name] = match[1].trim();
      }
    }

    // Store in electron store
    store.set('originalDebugSettings', originalSettings);

    // Now update the constants
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

// Function to create mu-plugins directory and debug plugin
const createMuPlugin = async (wpDirectory) => {
  try {
    // Create mu-plugins directory if it doesn't exist
    const muPluginsDir = path.join(wpDirectory, 'wp-content', 'mu-plugins');
    await fs.promises.mkdir(muPluginsDir, { recursive: true });

    // Check if plugin already exists
    const pluginPath = path.join(muPluginsDir, 'wp-debug-helper.php');
    try {
      await fs.promises.access(pluginPath);
      // File exists, no need to create it
      return true;
    } catch (error) {
      // File doesn't exist, create it
      const pluginContent = `<?php
/**
 * Plugin Name: WP Debug Helper
 * Description: Custom debugging function for WordPress
 * Version: 1.0
 * Author: WP Debug App
 */

if (!function_exists('wp_debug')) {
    function wp_debug($var, $die = false) {
        // get the backtrace
        $backtrace = debug_backtrace();
        // get the file and line number
        $file = $backtrace[0]['file'];
        $line = $backtrace[0]['line'];
        // output the debug info
        $var_dump = print_r($var, true);
        error_log( "WP Debug called from $file on line $line:\\n" . $var_dump );
        if ($die) {
            die('WP Debug ended execution.');
        }
    }
}`;

      await fs.promises.writeFile(pluginPath, pluginContent);
      return true;
    }
  } catch (error) {
    console.error('Error creating mu-plugin:', error);
    throw error;
  }
};

const createTray = async () => {
  // Use the pre-generated PNG icon
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray-icon.png'));
  
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
  // Get the first line of the message
  const firstLine = message.split('\n')[0].trim();
  
  // Always show notification for new debug entries, regardless of window focus
  const notification = new Notification({
    title: 'WP Debug Log Entry',
    body: firstLine,
    silent: false,
    timeoutType: 'default',
    icon: path.join(__dirname, '..', 'assets', 'icons', 'mac', '128x128.png') // Use platform-specific icon
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
    title: 'WP Debug',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close event
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && !isCleaningUp) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
};

const createMenu = () => {
  const template = [
    {
      label: 'WP Debug',
      submenu: [
        {
          label: 'About WP Debug',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 300,
              height: 340,
              title: 'About WP Debug',
              resizable: false,
              minimizable: false,
              maximizable: false,
              fullscreenable: false,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js'),
              }
            });

            aboutWindow.loadFile(path.join(__dirname, '..', 'renderer', 'about.html'));
            
            // Open dev tools immediately in development mode
            if (process.env.NODE_ENV === 'development') {
              aboutWindow.webContents.openDevTools({ mode: 'detach' });
            }

            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { 
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: async () => {
            if (!isCleaningUp) {
              isCleaningUp = true;
              await cleanup();
              app.isQuitting = true;
              app.quit();
            }
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
      // Create mu-plugin
      await createMuPlugin(directory);
      // Add to recent directories
      addToRecentDirectories(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress installation');
    }
  }
  return null;
});

// Get recent directories
ipcMain.handle('get-recent-directories', async () => {
  if (!store) return [];
  return store.get('recentDirectories', []);
});

// Handle selecting a recent directory
ipcMain.handle('select-recent-directory', async (event, directory) => {
  // Verify it's still a WordPress directory
  if (await isWordPressDirectory(directory)) {
    // Enable WP_DEBUG configuration
    await enableWPDebug(directory);
    // Create mu-plugin
    await createMuPlugin(directory);
    // Move this directory to the top of recent list
    addToRecentDirectories(directory);
    return directory;
  } else {
    // Remove invalid directory from recent list
    if (store) {
      const recentDirectories = store.get('recentDirectories', []);
      const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
      store.set('recentDirectories', filteredDirectories);
    }
    throw new Error('Selected directory is no longer a valid WordPress installation');
  }
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
ipcMain.handle('quit-app', async () => {
  if (!isCleaningUp) {
    isCleaningUp = true;
    await cleanup();
    app.isQuitting = true;
    app.quit();
  }
});

// Function to restore original WP_DEBUG settings and clean up mu-plugin
const cleanup = async () => {
  try {
    if (watcher) {
      await watcher.close();
      watcher = null;
    }

    const originalSettings = store.get('originalDebugSettings');
    console.log('Retrieved original settings:', originalSettings); // Debug log

    if (originalSettings && originalSettings.directory) {
      const configPath = path.join(originalSettings.directory, 'wp-config.php');
      let configContent = await fs.promises.readFile(configPath, 'utf8');

      console.log('Restoring debug settings:', originalSettings);

      for (const name of ['WP_DEBUG', 'WP_DEBUG_DISPLAY', 'WP_DEBUG_LOG']) {
        const originalValue = originalSettings[name];
        const regex = new RegExp(`\\s*define\\s*\\(\\s*['"]${name}['"]\\s*,\\s*(.+?)\\s*\\);\\n?`, 'g');
        
        if (originalValue !== null) {
          configContent = configContent.replace(
            regex,
            `\ndefine( '${name}', ${originalValue} );\n`  // Add newlines before and after
          );
        } else {
          configContent = configContent.replace(regex, '\n');  // Add newline when removing
        }
      }

      // Remove any multiple consecutive newlines that might have been created
      configContent = configContent.replace(/\n{3,}/g, '\n\n');

      await fs.promises.writeFile(configPath, configContent, 'utf8');
      console.log('Debug settings restored');
      
      // Clear stored settings
      store.delete('originalDebugSettings');
    } else {
      console.log('No original settings found to restore'); // Debug log
    }

    // Remove mu-plugin if it exists
    if (originalSettings && originalSettings.directory) {
      const muPluginsDir = path.join(originalSettings.directory, 'wp-content', 'mu-plugins');
      const pluginPath = path.join(muPluginsDir, 'wp-debug-helper.php');

      try {
        // Check if plugin exists
        await fs.promises.access(pluginPath);
        // Delete the plugin
        await fs.promises.unlink(pluginPath);

        // Check if mu-plugins directory is empty
        const files = await fs.promises.readdir(muPluginsDir);
        if (files.length === 0) {
          // Remove the empty directory
          await fs.promises.rmdir(muPluginsDir);
        }
      } catch (error) {
        // Ignore errors if file/directory doesn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

app.whenReady().then(async () => {
  await initStore();
  createMenu();
  await createTray();
  createWindow();

  // Handle dock icon clicks
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle macOS dock menu
  if (process.platform === 'darwin' && app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'Show Window',
        click() {
          if (mainWindow === null) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }
});

// Handle before-quit event
app.on('before-quit', async (event) => {
  if (!isCleaningUp && !app.isQuitting) {
    event.preventDefault();
    app.isQuitting = true;
    await cleanup();
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin' && !isCleaningUp) {
    isCleaningUp = true;
    await cleanup();
    app.quit();
  }
}); 
