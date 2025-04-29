import React, { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Content from './components/Content';
import './styles.css';

function App() {
  const [folders, setFolders] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [currentVideo, setCurrentVideo] = useState({ folderName: null, fileName: null });
  const [progressData, setProgressData] = useState({}); // ✅ to track watched videos
  const [selectedFolderName, setSelectedFolderName] = useState(null);


  const handleFolderSelect = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setSelectedFolderName(directoryHandle.name);
      const newFolders = [];
      const newOpenSections = {};
      const newProgressData = {};

      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'directory') {
          const files = [];

          for await (const [fileName, fileHandle] of handle.entries()) {
            const file = await fileHandle.getFile();
            files.push({ fileName, file, fileHandle });
          }

          // Read progressTracking.json if exists
          let progress = {};
          try {
            const progressHandle = await handle.getFileHandle('progressTracking.json');
            const progressFile = await progressHandle.getFile();
            const progressText = await progressFile.text();
            const json = JSON.parse(progressText);
            progress = json?.progress || {};
          } catch (e) {
            console.log(`No progress file in ${name}, starting fresh.`);
          }

          files.sort((a, b) => {
            const getNumber = (name) => {
              const match = name.file.name.match(/^(\d+)/);
              return match ? parseInt(match[1]) : Infinity;
            };
            return getNumber(a) - getNumber(b);
          });

          newFolders.push({ name, files, dirHandle: handle });
          newOpenSections[name] = false;
          newProgressData[name] = progress;
        }
      }

      newFolders.sort((a, b) => {
        const numA = parseInt(a.name);
        const numB = parseInt(b.name);
        return isNaN(numA) || isNaN(numB) ? a.name.localeCompare(b.name) : numA - numB;
      });

      setFolders(newFolders);
      setOpenSections(newOpenSections);
      setProgressData(newProgressData);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('User cancelled the folder picker.');
      } else {
        console.error('Unexpected error selecting folder:', error);
      }
    }
  };

  const playVideo = (file, subtitle, folderName) => {
    setCurrentVideo({ folderName, fileName: file.name });
    setSelectedVideo(file);
    setSelectedSubtitle(subtitle);
  };

  const markFileAsWatched = async (folderName, fileName) => {
    setProgressData((prev) => {
      const updated = { ...prev };
      if (!updated[folderName]) updated[folderName] = {};
      updated[folderName][fileName] = true;
      return updated;
    });

    const folder = folders.find((f) => f.name === folderName);
    if (folder?.dirHandle) {
      const updatedProgress = {
        folderName,
        progress: {
          ...(progressData[folderName] || {}),
          [fileName]: true,
        },
      };

      try {
        const fileHandle = await folder.dirHandle.getFileHandle('progressTracking.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(updatedProgress, null, 2));
        await writable.close();
        console.log(`Saved progress for ${fileName} in ${folderName}`);
      } catch (err) {
        console.error('Error writing progress file:', err);
      }
    }
  };

  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const calculateOverallProgress = () => {
    let totalVideos = 0;
    let totalWatched = 0;
  
    folders.forEach(folder => {
      const videoFiles = folder.files.filter((f) => f.file.type.includes('video'));
      totalVideos += videoFiles.length;
  
      const watchedVideos = progressData[folder.name] || {};
      totalWatched += Object.values(watchedVideos).filter(Boolean).length;
    });
  
    return totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0;
  };
  

  const overallProgress = calculateOverallProgress();
  return (
    <div className="app-container">
      <div className="header">
      <div className="logo-title">
      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="EduTrack Logo" className="logo-img" />
      <h2>EduTrack: Offline Learning Journey</h2>
    </div>
        {!selectedFolderName ? (
      <button onClick={handleFolderSelect} className="folder-button">
        📁 Choose Course Folder
      </button>
    ) : (
      <div className="selected-folder-name">
        📂 {selectedFolderName}
      </div>
    )}
      </div>

      <div className="main-layout">
        <div className="left-section">
          {selectedVideo ? (
            <VideoPlayer file={selectedVideo} subtitle={selectedSubtitle} />
          ) : (
            <div className="placeholder">
            <img src={`${process.env.PUBLIC_URL}/main-img.png`} alt="Placeholder" className="placeholder-img" />
          </div>
          
          )}
        </div>
        <div className="right-section">
          <Content
            folders={folders}
            openSections={openSections}
            toggleSection={toggleSection}
            playVideo={playVideo}
            currentVideo={currentVideo}
            progressData={progressData}
            markFileAsWatched={markFileAsWatched}
            overallProgress={overallProgress}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
