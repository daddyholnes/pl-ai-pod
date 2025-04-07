import * as React from 'react';
import { useState } from 'react';
import { uploadScreenCapture } from '../../../firebase/fire-setup';

interface ScreenShareProps {
  onImageCaptured: (imageUrl: string) => void;
  userId: string;
}

export const ScreenShare: React.FC<ScreenShareProps> = ({ onImageCaptured, userId }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const captureScreen = async () => {
    try {
      setIsCapturing(true);
      setError(null);
      
      // Request screen capture from the user
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });
      
      // Create a video element to display the stream
      const video = document.createElement('video');
      video.srcObject = mediaStream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Give time for the video to render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create a canvas with the same dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video to canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/png');
      
      // Stop all tracks
      mediaStream.getTracks().forEach(track => track.stop());
      
      // Upload to Firebase
      const imageUrl = await uploadScreenCapture(userId, imageData);
      
      // Notify parent component
      onImageCaptured(imageUrl);
      
    } catch (err: any) {
      console.error('Screen capture error:', err);
      setError(err.message || 'Failed to capture screen');
    } finally {
      setIsCapturing(false);
    }
  };
  
  return (
    <div className="screen-share-container">
      <button 
        className={`screen-share-button ${isCapturing ? 'capturing' : ''}`}
        onClick={captureScreen}
        disabled={isCapturing}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        {isCapturing ? 'Capturing...' : 'Share Screen'}
      </button>
      {error && <div className="screen-share-error">{error}</div>}
    </div>
  );
};
