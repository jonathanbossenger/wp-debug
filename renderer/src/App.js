import React, { useState, useEffect, useRef } from 'react';

const LogEntry = ({ entry, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Split the entry into timestamp and message
  const timestampMatch = entry.match(/^(\[[^\]]+\])/);
  const timestamp = timestampMatch ? timestampMatch[1] : '';
  const message = timestampMatch ? entry.slice(timestamp.length) : entry;
  
  // Split message into first line and rest
  const lines = message.split('\n');
  const firstLine = lines[0];
  const remainingLines = lines.slice(1).join('\n');
  
  return (
    <div className={`py-2 px-2 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} whitespace-pre-wrap`}>
      {timestamp && (
        <span className="inline-block text-indigo-700 font-medium mr-2">{timestamp}</span>
      )}
      <span className="text-gray-700">
        {firstLine}
        {lines.length > 1 && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 px-2 py-0.5 text-xs font-medium rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
            {isExpanded && (
              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                {remainingLines}
              </div>
            )}
          </>
        )}
      </span>
    </div>
  );
};

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState(null);
  const logScrollAreaRef = useRef(null);

  useEffect(() => {
    // Set up debug log update listener
    if (window.electronAPI) {
      window.electronAPI.onDebugLogUpdated((content) => {
        setLogContent(content);
      });
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when log content changes
    if (logScrollAreaRef.current) {
      logScrollAreaRef.current.scrollTop = logScrollAreaRef.current.scrollHeight;
    }
  }, [logContent]);

  useEffect(() => {
    // Start watching debug.log when directory is selected
    if (selectedDirectory) {
      setIsWatching(true);
      window.electronAPI.watchDebugLog(selectedDirectory)
        .then(content => {
          setLogContent(content);
          setError(null);
        })
        .catch(error => {
          console.error('Error watching debug.log:', error);
          setIsWatching(false);
          setError('Error watching debug.log file');
        });
    }
  }, [selectedDirectory]);

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    setError(null);
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setSelectedDirectory(directory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error.message || 'Error selecting WordPress directory');
      setSelectedDirectory(null);
    }
    setIsSelecting(false);
  };

  const handleClearLog = async () => {
    if (selectedDirectory) {
      try {
        await window.electronAPI.clearDebugLog(selectedDirectory);
        setLogContent('');
        setError(null);
      } catch (error) {
        console.error('Error clearing debug.log:', error);
        setError('Error clearing debug log file');
      }
    }
  };

  const handleQuit = async () => {
    await window.electronAPI.quitApp();
  };

  const renderLogContent = (content) => {
    // Split content into entries (split on timestamps at the start of a line)
    const entries = content.split(/(?=^\[.*?\])/m);
    
    return entries.map((entry, index) => {
      if (!entry.trim()) return null; // Skip empty entries
      return <LogEntry key={index} entry={entry} index={index} />;
    }).filter(Boolean); // Remove null entries
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
          <div className="p-6 flex-none">
            <h1 className="text-3xl font-bold text-gray-800">WP Debug</h1>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
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
                    {isSelecting ? 'Selecting...' : 'Change Directory'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col mt-6 min-h-0">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Debug Log</h2>
                <div ref={logScrollAreaRef} className="log-scroll-area p-4 font-mono text-sm flex-1">
                  {logContent ? (
                    <div className="log-content text-gray-800">
                      {renderLogContent(logContent)}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No log entries yet</p>
                  )}
                </div>
                <div className="mt-4 text-right flex-none">
                  <div className="space-x-3">
                    <button
                      onClick={handleClearLog}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
                    >
                      Clear Log
                    </button>
                    <button
                      onClick={handleQuit}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
                    >
                      Quit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Select your WordPress installation directory to begin</p>
                <button
                  onClick={handleSelectDirectory}
                  disabled={isSelecting}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm"
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
