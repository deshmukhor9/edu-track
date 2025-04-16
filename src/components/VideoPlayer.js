import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ file, subtitle }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;

      return () => {
        URL.revokeObjectURL(videoURL);
      };
    }
  }, [file]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        controls
        width="100%"
        crossOrigin="anonymous"
      >
        {subtitle && (
          <track
            label="English"
            kind="subtitles"
            srcLang="en"
            src={URL.createObjectURL(subtitle)}
            default
          />
        )}
        Sorry, your browser doesn't support embedded videos.
      </video>
    </div>
  );
};

export default VideoPlayer;
