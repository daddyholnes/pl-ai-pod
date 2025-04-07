import * as React from 'react';
import { useState } from 'react';
import { uploadScreenCapture } from '../firebase/fire-setup';

// Check if LiveKit is available without causing import errors
let LiveKitScreenShare: React.ComponentType | null = null;
try {
  // Dynamic import to avoid errors if LiveKit isn't installed
  LiveKitScreenShare = require('./LiveKit/ScreenShare').default;
} catch (error) {
  console.log('LiveKit not available, using native screen capture');
}

interface ScreenShareBridgeProps {
  userId: string;
  onImageCaptured?: (imageUrl: string) => void;
  useLiveKit?: boolean;
}

export const ScreenShareBridge: React.FC<ScreenShareBridgeProps> = ({ 
  userId, 
  onImageCaptured,
  useLiveKit = false
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if LiveKit should be used and is available
  const shouldUseLiveKit = useLiveKit && LiveKitScreenShare !== null;

  // Use native screen capture implementation
  const captureScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen capture is not supported in this browser");
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);
      
      // Get screen capture stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });
      
      // Create video element to capture a frame
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // Wait for metadata to load
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = canvas.toDataURL('image/png');
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Upload to Firebase
      const imageUrl = await uploadScreenCapture(userId, imageData);
      
      // Notify parent component
      if (onImageCaptured) {
        onImageCaptured(imageUrl);
      }
      
    } catch (err) {
      console.error("Screen capture error:", err);
      setError("Failed to capture screen");
    } finally {
      setIsCapturing(false);
    }
  };

  // Render appropriate component
  if (shouldUseLiveKit) {
    return <LiveKitScreenShare />;
  }
  
  return (
    <div className="screen-share-bridge">
      <button
        className={`screen-share-button ${isCapturing ? 'disabled' : ''}`}
        onClick={captureScreen}
        disabled={isCapturing}
      >
        {isCapturing ? 'Capturing...' : 'Capture Screen'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
