import React, { useState, useCallback } from 'react';
import { useLocalParticipant } from 'livekit-react';
import { Track } from 'livekit-client';

const ScreenShare = () => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const { localParticipant } = useLocalParticipant();

  const startScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    
    try {
      await localParticipant.setScreenShareEnabled(true);
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [localParticipant]);

  const stopScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    
    try {
      await localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [localParticipant]);

  return (
    <div className="screen-share-container">
      {isScreenSharing ? (
        <button 
          onClick={stopScreenShare}
          className="screen-share-button stop"
        >
          Stop Screen Share
        </button>
      ) : (
        <button 
          onClick={startScreenShare}
          className="screen-share-button start"
        >
          Start Screen Share
        </button>
      )}
      
      {isScreenSharing && localParticipant && (
        <div className="screen-share-preview">
          <Track
            source={Track.Source.ScreenShare}
            participant={localParticipant}
          />
        </div>
      )}
    </div>
  );
};

export default ScreenShare;
