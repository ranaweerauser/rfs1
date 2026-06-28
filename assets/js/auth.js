// ==========================================================================
// auth.js — Customer Google Login + Admin Username/Password Login
// ==========================================================================

import {
  auth, db, googleProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs,
  COL
} from "./firebase-config.js";

let currentUser = null;
let currentCustomerProfile = null;
const authListeners = new Set();

export function onAuthChange(cb) {
  authListeners.add(cb);
  cb(currentUser, currentCustomerProfile);
  return () => authListeners.delete(cb);
}
function notifyListeners() {
  authListeners.forEach((cb) => cb(currentUser, currentCustomerProfile));
}

// Handle pending Google redirect result
(async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      currentUser = result.user;
      currentCustomerProfile = await ensureCustomerDoc(result.user);
      notifyListeners();
    }
  } catch (err) {
    if (err?.code !== "auth/redirect-cancelled-by-user" &&
        err?.code !== "auth/credential-already-in-use") {
      console.warn("Google redirect result:", err?.code || err?.message);
    }
  }
})();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentCustomerProfile = user ? await ensureCustomerDoc(user) : null;
  notifyListeners();
});

async function ensureCustomerDoc(user) {
  try {
    const ref = doc(db, COL.CUSTOMERS, user.uid);
    const snap = await getDoc(ref);
    const base = { uid: user.uid, name: user.displayName || "", email: user.email || "", photoURL: user.photoURL || "", phone: "", addresses: [], blocked: false };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
      return base;
    }
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
    return { ...base, ...snap.data() };
  } catch (e) {
    return { uid: user.uid, name: user.displayName || "", email: user.email || "" };
  }
}

function isGitHubPages() {
  return window.location.hostname.endsWith("github.io");
}
function isMobileOrInApp() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|FBAN|FBAV|Instagram|wv\)/i.test(ua);
}

export async function loginWithGoogle() {
  if (isGitHubPages() || isMobileOrInApp()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    const fallbackCodes = ["auth/popup-blocked","auth/popup-closed-by-user","auth/cancelled-popup-request","auth/unauthorized-domain"];
    if (fallbackCodes.includes(err?.code)) {
      if (err?.code === "auth/unauthorized-domain") {
        throw new Error("DOMAIN_NOT_AUTHORIZED");
      }
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function logout() { await signOut(auth); }
export function getCurrentUser() { return currentUser; }
export function getCurrentCustomerProfile() { return currentCustomerProfile; }
export function isLoggedIn() { return !!currentUser; }

// ==========================================================================
// ADMIN AUTH
// ==========================================================================
const ADMIN_SESSION_KEY = "rfs_admin_session";
const DEFAULT_ADMIN_USER = "Ranaweera@2026";
const DEFAULT_ADMIN_PASS = "Ranaweera@2026";

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2,"0")).join("");
}

export async function seedDefaultAdminIfNeeded() {
  try {
    const snap = await getDocs(collection(db, COL.ADMINS));
    if (snap.empty) {
      const passwordHash = await sha256(DEFAULT_ADMIN_PASS);
      await setDoc(doc(db, COL.ADMINS, "default-super-admin"), {
        username: DEFAULT_ADMIN_USER,
        passwordHash,
        role: "super_admin",
        name: "Store Owner",
        active: true,
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn("seedDefaultAdmin:", e?.message);
  }
}

export async function adminLogin(username, password) {
  const passHash = await sha256(password);

  // ── Primary: query Firestore ──────────────────────────────────────────────
  try {
    const q = query(collection(db, COL.ADMINS), where("username","==", username));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const adminDoc = snap.docs[0];
      const data = adminDoc.data();
      if (data.active === false) throw new Error("This admin account has been disabled.");
      if (passHash !== data.passwordHash) throw new Error("Invalid username or password.");
      const session = {
        id: adminDoc.id, username: data.username,
        name: data.name || data.username, role: data.role || "admin",
        loginAt: Date.now()
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      try {
        await setDoc(doc(collection(db, COL.ADMIN_LOGS)), {
          adminId: adminDoc.id, username: data.username,
          action: "login", timestamp: serverTimestamp(), userAgent: navigator.userAgent
        });
      } catch {}
      return session;
    }
  } catch (firestoreErr) {
    // If Firestore is not set up yet, fall through to hardcoded check below
    if (!firestoreErr?.message?.includes("Invalid username")) {
      console.warn("Firestore admin query failed:", firestoreErr?.code);
    } else {
      throw firestoreErr;
    }
  }

  // ── Fallback: hardcoded default credentials ───────────────────────────────
  // Works even when Firestore isn't configured yet. Creates the Firestore
  // record in the background so next login will use the primary path.
  const defaultHash = await sha256(DEFAULT_ADMIN_PASS);
  if (username === DEFAULT_ADMIN_USER && passHash === defaultHash) {
    const session = {
      id: "default-super-admin", username: DEFAULT_ADMIN_USER,
      name: "Store Owner", role: "super_admin", loginAt: Date.now()
    };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    // Seed in the background
    seedDefaultAdminIfNeeded().catch(() => {});
    return session;
  }

  throw new Error("Invalid username or password.");
}

export function getAdminSession() {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function adminLogout() { sessionStorage.removeItem(ADMIN_SESSION_KEY); }
export function requireAdminAuth() {
  const s = getAdminSession();
  if (!s) { window.location.href = "login.html"; return null; }
  return s;
}
export function hasRole(session, ...roles) {
  if (!session) return false;
  if (session.role === "super_admin") return true;
  return roles.includes(session.role);
}
