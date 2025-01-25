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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">WP Debug</h1>
        <div className="bg-white shadow-lg rounded-lg p-6">
          {selectedDirectory ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 mr-4">
                  <p className="font-semibold">Selected WordPress directory:</p>
                  <p className="bg-gray-100 p-2 rounded break-all font-mono text-sm">
                    {selectedDirectory}
                  </p>
                </div>
                <button
                  onClick={handleSelectDirectory}
                  disabled={isSelecting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 whitespace-nowrap"
                >
                  Change Directory
                </button>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Debug Log</h2>
                  <button
                    onClick={handleClearLog}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Clear Log
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-96 overflow-auto">
                  {logContent ? (
                    <pre className="log-content">{logContent}</pre>
                  ) : (
                    <p className="text-gray-500 italic">No log entries yet</p>
                  )}
                </div>
                {isWatching && (
                  <p className="text-sm text-gray-600 mt-2">
                    ✓ Watching for changes in debug.log
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4">Select a WordPress installation to begin monitoring debug.log</p>
              <button
                onClick={handleSelectDirectory}
                disabled={isSelecting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isSelecting ? 'Selecting...' : 'Select Directory'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 
