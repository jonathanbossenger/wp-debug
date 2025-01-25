import React, { useState } from 'react';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">WP Debug</h1>
        <div className="bg-white shadow-lg rounded-lg p-6">
          {selectedDirectory ? (
            <div>
              <p className="mb-4">Selected WordPress directory:</p>
              <p className="bg-gray-100 p-3 rounded break-all font-mono text-sm">
                {selectedDirectory}
              </p>
              <button
                onClick={handleSelectDirectory}
                disabled={isSelecting}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Change Directory
              </button>
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
