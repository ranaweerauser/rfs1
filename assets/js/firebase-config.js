// ==========================================================================
// Ranaweera Family Super — Firebase Core Config
// Initializes Firebase App, Auth, Firestore, Storage, Messaging (optional).
// Every other module imports `db`, `auth`, `app` from here.
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment,
  writeBatch, runTransaction, startAfter
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ---- Your Firebase project config ----
const firebaseConfig = {
  apiKey: "AIzaSyCodIROzFmT0pmLVUCSyHn0VO3yXqnwjSY",
  authDomain: "ranaweera-family-super.firebaseapp.com",
  projectId: "ranaweera-family-super",
  storageBucket: "ranaweera-family-super.firebasestorage.app",
  messagingSenderId: "570723625768",
  appId: "1:570723625768:web:55b5c6e78058588f72be1d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Re-export commonly used Firestore helpers so pages only import from ONE file
export {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment,
  writeBatch, runTransaction, startAfter,
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, signInWithEmailAndPassword
};

// ---- Cloudinary config (unsigned upload) ----
export const CLOUDINARY_CLOUD_NAME = "dprfv3wmk";
export const CLOUDINARY_UPLOAD_PRESET = "RanaweraFamilySuper";
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// ---- Firestore collection name constants (single source of truth) ----
export const COL = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  ADMINS: "admins",
  SETTINGS: "settings",
  COUPONS: "coupons",
  REVIEWS: "reviews",
  DELIVERY_ZONES: "deliveryZones",
  ADMIN_LOGS: "adminLogs"
};

// Single global settings document — theme, contact info, whatsapp number, etc.
export const SETTINGS_DOC_ID = "siteSettings";
