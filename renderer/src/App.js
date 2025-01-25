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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">WP Debug</h1>
        
        {selectedDirectory ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-700 mb-2">WordPress Directory</p>
                  <p className="bg-white px-4 py-2 rounded-md border border-gray-200 font-mono text-sm text-gray-600 break-all">
                    {selectedDirectory}
                  </p>
                </div>
                <button
                  onClick={handleSelectDirectory}
                  disabled={isSelecting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors duration-200 shadow-sm"
                >
                  Change Directory
                </button>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Debug Log</h2>
              <div className="log-scroll-area p-4 font-mono text-sm">
                {logContent ? (
                  <pre className="log-content text-gray-800">{logContent}</pre>
                ) : (
                  <p className="text-gray-500 italic">No log entries yet</p>
                )}
              </div>
              <div className="mt-8 text-right">
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
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-6">Select a WordPress installation to begin monitoring debug.log</p>
            <button
              onClick={handleSelectDirectory}
              disabled={isSelecting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm"
            >
              {isSelecting ? 'Selecting...' : 'Select Directory'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 
