import * as vscode from 'vscode';
import { 
    auth, 
    firestore, 
    storage 
} from '../firebase/fire-setup';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    UserCredential,
    User
} from 'firebase/auth';
import { 
    collection,
    doc, 
    setDoc, 
    getDoc, 
    getDocs,
    query, 
    where, 
    orderBy, 
    addDoc, 
    updateDoc,
    Timestamp,
    DocumentData
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL
} from 'firebase/storage';

// Authentication helpers
export async function signIn(email: string, password: string): Promise<UserCredential> {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error('Error signing in:', error);
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

export async function signUp(email: string, password: string): Promise<UserCredential> {
    try {
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error('Error signing up:', error);
        throw new Error(`Registration failed: ${error.message}`);
    }
}

export async function logOut(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error: any) {
        console.error('Error logging out:', error);
        throw new Error(`Logout failed: ${error.message}`);
    }
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

// Firestore helpers for chat sessions and messages
export async function saveChatSession(sessionData: {
    title: string;
    userId: string;
    model: string;
    [key: string]: any;
}): Promise<string> {
    try {
        const chatSessionsRef = collection(firestore, 'chatSessions');
        const docRef = await addDoc(chatSessionsRef, {
            ...sessionData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error: any) {
        console.error('Error saving chat session:', error);
        throw new Error(`Failed to save chat session: ${error.message}`);
    }
}

export async function saveChatMessage(sessionId: string, messageData: {
    role: string;
    content: string;
    [key: string]: any;
}): Promise<string> {
    try {
        const messagesRef = collection(firestore, `chatSessions/${sessionId}/messages`);
        const docRef = await addDoc(messagesRef, {
            ...messageData,
            timestamp: Timestamp.now()
        });
        
        // Update the session's last updated timestamp
        const sessionRef = doc(firestore, 'chatSessions', sessionId);
        await updateDoc(sessionRef, {
            updatedAt: Timestamp.now()
        });
        
        return docRef.id;
    } catch (error: any) {
        console.error('Error saving chat message:', error);
        throw new Error(`Failed to save message: ${error.message}`);
    }
}

export async function getUserChatSessions(userId: string): Promise<DocumentData[]> {
    try {
        const chatSessionsRef = collection(firestore, 'chatSessions');
        const q = query(
            chatSessionsRef, 
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error: any) {
        console.error('Error fetching user chat sessions:', error);
        throw new Error(`Failed to fetch chat sessions: ${error.message}`);
    }
}

export async function getChatSessionMessages(sessionId: string): Promise<DocumentData[]> {
    try {
        const messagesRef = collection(firestore, `chatSessions/${sessionId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error: any) {
        console.error('Error fetching chat messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
    }
}

// Storage helpers for files and images
export async function uploadFile(sessionId: string, file: Buffer, fileName: string): Promise<string> {
    try {
        const storageRef = ref(storage, `chatFiles/${sessionId}/${fileName}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error: any) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}
