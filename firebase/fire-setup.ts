// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// Analytics is typically not needed in a VS Code extension context
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8d_jp-_vJ3rgAzXsjr4tbbyr_efkLJgc",
  authDomain: "camera-calibration-beta.firebaseapp.com",
  projectId: "camera-calibration-beta",
  storageBucket: "camera-calibration-beta.firebasestorage.app",
  messagingSenderId: "515204322079",
  appId: "1:515204322079:web:2e13af10cdf85e7d28962a",
  measurementId: "G-Y11C3GY65H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services we'll use with the VS Code extension
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Storage helper for screen captures
export const uploadScreenCapture = async (userId: string, imageData: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `screenshots/${userId}/${Date.now()}.png`);
    
    // Convert base64 data URL to blob
    // Using a different approach that works in both browser and Node.js environments
    const base64Data = imageData.split(',')[1];
    
    // Handle different environments (browser vs Node.js)
    let blob: Blob;
    
    if (typeof window === 'undefined') {
      // Node.js environment (VS Code extension)
      const Buffer = require('buffer').Buffer;
      const buffer = Buffer.from(base64Data, 'base64');
      blob = new Blob([buffer], { type: 'image/png' });
    } else {
      // Browser environment
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      // Process in chunks to avoid memory issues with large images
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      blob = new Blob(byteArrays, { type: 'image/png' });
    }
    
    // Upload blob to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading screen capture:", error);
    throw error;
  }
};

// Analytics doesn't work well in Node.js environment (VS Code extension)
// const analytics = getAnalytics(app);

export { app };