import React from 'react';

const RecentDirectories = ({ onDirectorySelect, isSelecting }) => {
  const [recentDirs, setRecentDirs] = React.useState([]);

  React.useEffect(() => {
    const loadRecentDirectories = async () => {
      try {
        console.log('Fetching recent directories...');
        const dirs = await window.electronAPI.getRecentDirectories();
        console.log('Received directories:', dirs);
        setRecentDirs(dirs);
      } catch (error) {
        console.error('Error loading recent directories:', error);
      }
    };
    loadRecentDirectories();
  }, []);

  console.log('Current recentDirs:', recentDirs);

  if (recentDirs.length === 0) {
    console.log('No recent directories found');
    return null;
  }

  return (
    <div className="mb-6">
      <p className="text-gray-600 mb-3">Recent Directories</p>
      <div className="space-y-2 mb-6">
        {recentDirs.map((directory, index) => (
          <button
            key={index}
            onClick={() => onDirectorySelect(directory)}
            disabled={isSelecting}
            className="w-full text-left px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
          >
            <p className="font-mono text-sm text-gray-600 truncate">{directory}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentDirectories; 
