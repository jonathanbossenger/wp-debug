import React, { useState, useEffect } from 'react';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    // Set up debug log update listener
    if (window.electronAPI) {
      window.electronAPI.onDebugLogUpdated((content) => {
        setLogContent(content);
      });
    }
  }, []);

  useEffect(() => {
    // Start watching debug.log when directory is selected
    if (selectedDirectory) {
      setIsWatching(true);
      window.electronAPI.watchDebugLog(selectedDirectory)
        .then(content => {
          setLogContent(content);
        })
        .catch(error => {
          console.error('Error watching debug.log:', error);
          setIsWatching(false);
        });
    }
  }, [selectedDirectory]);

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setSelectedDirectory(directory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
    setIsSelecting(false);
  };

  const handleClearLog = async () => {
    if (selectedDirectory) {
      try {
        await window.electronAPI.clearDebugLog(selectedDirectory);
        setLogContent('');
      } catch (error) {
        console.error('Error clearing debug.log:', error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
          <div className="p-6 flex-none">
            <h1 className="text-3xl font-bold text-gray-800">WP Debug</h1>
          </div>
          
          {selectedDirectory ? (
            <div className="flex-1 flex flex-col p-6 pt-0 overflow-hidden">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 flex-none">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 mb-2">WordPress Directory</p>
                    <p className="bg-white px-4 py-2.5 rounded-md border border-gray-200 font-mono text-sm text-gray-600 break-all">
                      {selectedDirectory}
                    </p>
                  </div>
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors duration-200 shadow-sm h-[42px] self-end"
                  >
                    Change Directory
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col mt-6 min-h-0">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Debug Log</h2>
                <div className="log-scroll-area p-4 font-mono text-sm flex-1">
                  {logContent ? (
                    <pre className="log-content text-gray-800">{logContent}</pre>
                  ) : (
                    <p className="text-gray-500 italic">No log entries yet</p>
                  )}
                </div>
                <div className="mt-4 text-right flex-none">
                  <button
                    onClick={handleClearLog}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
                  >
                    Clear Log
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to WP Debug</h2>
                <p className="text-lg text-gray-600 mb-8">Select a WordPress installation directory to begin monitoring the debug.log file</p>
                <button
                  onClick={handleSelectDirectory}
                  disabled={isSelecting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm text-lg font-medium"
                >
                  {isSelecting ? 'Selecting...' : 'Select Directory'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 
