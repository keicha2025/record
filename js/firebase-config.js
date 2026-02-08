// js/firebase-config.js
// Firebase SDK Imports (Using CDN ES Modules for simplicity without build step)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    enableIndexedDbPersistence,
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    writeBatch,
    arrayUnion,
    arrayRemove,
    collectionGroup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    reauthenticateWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCoiPuZo6BwzLJBQdHjC6wc-ol6T-cMeb0",
    authDomain: "project-2096109701191973112.firebaseapp.com",
    projectId: "project-2096109701191973112",
    storageBucket: "project-2096109701191973112.firebasestorage.app",
    messagingSenderId: "690825505366",
    appId: "1:690825505366:web:20b1812eb64a3aacb369f7",
    measurementId: "G-460NFXZ6Y9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Firebase Persistence: Multiple tabs open, persistence disabled.');
    } else if (err.code == 'unimplemented') {
        console.warn('Firebase Persistence: Browser not supported.');
    }
});

export {
    db,
    auth,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    reauthenticateWithPopup,
    // Firestore
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    getDoc,
    writeBatch,
    arrayUnion,
    arrayRemove,
    collectionGroup
};
