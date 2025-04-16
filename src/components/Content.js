import React from 'react';

const getFileIcon = (fileName, mimeType) => {
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('text')) return '📝';
  if (mimeType.includes('html')) return '🌐';
  if (fileName.endsWith('.py')) return '🐍';
  if (fileName.endsWith('.vtt')) return '🎧';
  return '📁';
};

const Content = ({
  folders,
  openSections,
  toggleSection,
  playVideo,
  currentVideo,
  progressData,
  markFileAsWatched,

  overallProgress,
}) => {

  const handleResumeClick = () => {
    const inProgressFolder = folders.find((folder) => {
      const contentFiles = folder.files.filter((f) => isDisplayableContentFile(f.file));

      const total = contentFiles.length;
      const completed = (progressData[folder.name] &&
        Object.values(progressData[folder.name]).filter((v) => v === true).length) || 0;
  
      return total > 0 && completed > 0 && completed < total;
    });
  
    if (inProgressFolder) {
      toggleSection(inProgressFolder.name);
      // Optionally scroll to it
      const section = document.getElementById(`folder-${inProgressFolder.name}`);
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isDisplayableContentFile = (file) => {
    const name = file.name.toLowerCase();
    return !name.endsWith('.vtt') && name !== 'progresstracking.json';
  };
  
  return (
    <div className="content-box">
      {overallProgress !== null && (
  <div className="overall-progress-container">
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${overallProgress}%` }}></div>
    </div>
    <div className="progress-label">📊 Overall Progress: {overallProgress}%</div>
  </div>
)}

<div className="content-header">
  <h2 className='header-content'>📚 Content</h2>
  <button className="resume-button" onClick={handleResumeClick}>▶️ Resume</button>
</div>


      {folders.map((folder, i) => {
        const isOpen = openSections[folder.name];
        const isCurrentFolder = currentVideo.folderName === folder.name;

        // 🎯 Get progress stats
        const contentFiles = folder.files.filter((f) => isDisplayableContentFile(f.file));

        const total = contentFiles.length;
        const completed = (progressData[folder.name] &&
          Object.values(progressData[folder.name]).filter((v) => v === true).length) || 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div 
          key={i} 
          id={`folder-${folder.name}`}
          className={`folder-section ${isCurrentFolder ? 'active-folder' : ''}`}>
            {/* 📊 Progress Bar */}
            <div>
              <div style={{ width: `${progressPercent}%` }}></div>
              <div className="progress-label-folder">{progressPercent}% completed</div>
            </div>

            <button onClick={() => toggleSection(folder.name)} className="folder-toggle">
              <span className="arrow">{isOpen ? '▼' : '▶'}</span> {folder.name}
            </button>

            {isOpen && (
              <ul className="file-list">
                {folder.files
                  .filter((f) => !f.file.name.toLowerCase().endsWith('.vtt')
                  &&
                  f.file.name.toLowerCase() !== 'progresstracking.json') // ✅ Hide .vtt from list
                  .map((f, j) => {
                    const { file } = f;
                    const isCurrentFile = isCurrentFolder && currentVideo.fileName === file.name;
                    const isWatched = progressData[folder.name]?.[file.name];
                    const icon = getFileIcon(file.name, file.type);

                    if (file.type.includes('video')) {
                      const subtitle = folder.files.find(
                        (sub) =>
                          sub.file.name.toLowerCase().startsWith(
                            file.name.split('.').slice(0, -1).join('.').toLowerCase()
                          ) && sub.file.name.toLowerCase().endsWith('english.vtt')
                      );

                      return (
                        <li key={j} className={`file-item ${isCurrentFile ? 'active-file' : ''}`}>
                          <button
                            onClick={() => {
                              playVideo(file, subtitle?.file || null, folder.name);
                              markFileAsWatched(folder.name, file.name);
                            }}
                            className="file-link"
                          >
                            {icon} {file.name} {isWatched && <span className='tick-position'>✅</span>}
                          </button>
                        </li>
                      );
                    }

                    const fileUrl = file.url || URL.createObjectURL(file);
                    return (
                      <li key={j} className="file-item">
<button
  className="file-link"
  onClick={() => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    markFileAsWatched(folder.name, file.name);
  }}
>
  {icon} {file.name} {isWatched && <span className='tick-position'>✅</span>}
</button>

                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Content;
