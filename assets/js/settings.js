// ==========================================================================
// settings.js — Real-time Site Settings / Theme Engine
// One Firestore document (settings/siteSettings) drives the ENTIRE site:
// theme colors, fonts, logo, contact info, whatsapp number, social links,
// homepage banners, maintenance mode, delivery rules, etc.
// Admin Panel writes to this doc -> onSnapshot here updates the live site
// INSTANTLY on every open tab (true real-time, no refresh needed).
// ==========================================================================

import { db, doc, onSnapshot, getDoc, COL, SETTINGS_DOC_ID } from "./firebase-config.js";

export const FONT_OPTIONS = [
  { value: "'Poppins', sans-serif", label: "Poppins (Modern)" },
  { value: "'Inter', sans-serif", label: "Inter (Clean)" },
  { value: "'Nunito', sans-serif", label: "Nunito (Friendly)" },
  { value: "'Playfair Display', serif", label: "Playfair Display (Elegant)" },
  { value: "'Roboto', sans-serif", label: "Roboto (Classic)" },
  { value: "'Montserrat', sans-serif", label: "Montserrat (Bold)" }
];

export const DEFAULT_SETTINGS = {
  storeName: "Ranaweera Family Super",
  logoUrl: "assets/images/logo.jpg",
  faviconUrl: "assets/images/logo.jpg",
  tagline: "Your Trusted Family Supermarket",
  phone: "+94 77 000 0000",
  whatsappNumber: "+94770000000",
  whatsappEnabled: true,
  email: "info@ranaweerafamilysuper.lk",
  address: "No. 123, Main Street, Colombo, Sri Lanka",
  mapEmbedUrl: "",
  deliveryAreaNote: "🚚 We currently deliver only to areas near Nittambuwa town.",
  headerBgColor: "",
  headerTextColor: "",
  social: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  theme: {
    gold1: "#f4d77b", gold2: "#caa23f", gold3: "#9a7321",
    maroon1: "#a8123a", maroon2: "#5c0d22", dark: "#1a1410",
    defaultMode: "light",
    themeId: 1,
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Poppins', sans-serif",
    textColor: "#241a12",
    bgColor: "#fbf8f2",
    surfaceColor: "#ffffff"
  },
  banners: [],
  announcementText: "",
  announcementEnabled: false,
  freeDeliveryThreshold: 5000,
  minOrderAmount: 0,
  deliveryBaseFee: 250,
  maintenanceMode: false,
  maintenanceMessage: "We're upgrading our store. Back soon!",
  currencySymbol: "Rs.",
  whatsappMessageTemplate:
    "🛒 *Ranaweera Family Super Website Order Request*\n\nCustomer: {name}\nPhone: {phone}\nOrder Total: {currency} {total}\nDelivery: {deliveryMethod}\nOrder #: {orderId}",
  // Customer-facing alert messages (customizable from admin panel)
  alerts: {
    enabled: false,
    message: "🎉 Special offer this weekend! Free delivery on orders above Rs.3000.",
    bgColor: "#fff2da",
    textColor: "#9a6400"
  },
  // Editable policy pages content
  policies: {
    terms: "",
    privacy: "",
    returns: "",
    faq: ""
  },
  // Banner button customization
  bannerButtonText: "Shop Now",
  bannerButtonBgColor: "#f4d77b",
  bannerButtonTextColor: "#2a1505"
};

let cachedSettings = null;
const listeners = new Set();

/** Deep-merge defaults so missing fields never break the UI */
function mergeDefaults(data) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const k in data || {}) {
    if (typeof data[k] === "object" && data[k] !== null && !Array.isArray(data[k])) {
      merged[k] = { ...merged[k], ...data[k] };
    } else {
      merged[k] = data[k];
    }
  }
  return merged;
}

function applyThemeVars(settings) {
  const r = document.documentElement;
  const t = settings.theme || {};
  if (t.gold1) r.style.setProperty("--rfs-gold-1", t.gold1);
  if (t.gold2) r.style.setProperty("--rfs-gold-2", t.gold2);
  if (t.gold3) r.style.setProperty("--rfs-gold-3", t.gold3);
  if (t.maroon1) r.style.setProperty("--rfs-maroon-1", t.maroon1);
  if (t.maroon2) r.style.setProperty("--rfs-maroon-2", t.maroon2);
  if (t.dark) r.style.setProperty("--rfs-dark", t.dark);
  if (t.headingFont) r.style.setProperty("--font-head", t.headingFont);
  if (t.bodyFont) r.style.setProperty("--font-body", t.bodyFont);

  // Apply saved light/dark mode unless user already chose one manually
  const storedMode = localStorage.getItem("rfs_theme_mode");
  const mode = storedMode || t.defaultMode || "light";
  r.setAttribute("data-theme", mode);

  // Apply gradient theme ID (1–20) and enable glassmorphism layer
  const themeId = t.themeId || 1;
  r.setAttribute("data-theme-id", String(themeId));
  document.body?.classList.add("theme-enabled");

  // Header custom colors
  if (settings.headerBgColor) r.style.setProperty("--header-bg", settings.headerBgColor);
  else r.style.removeProperty("--header-bg");
  if (settings.headerTextColor) r.style.setProperty("--header-text", settings.headerTextColor);
  else r.style.removeProperty("--header-text");

  // Custom text/background colors only apply in LIGHT mode — inline styles
  // would otherwise out-rank the stylesheet's [data-theme="dark"] overrides.
  if (mode === "light") {
    if (t.textColor) r.style.setProperty("--text-main", t.textColor);
    if (t.bgColor) r.style.setProperty("--bg-body", t.bgColor);
    if (t.surfaceColor) r.style.setProperty("--bg-surface", t.surfaceColor);
  } else {
    r.style.removeProperty("--text-main");
    r.style.removeProperty("--bg-body");
    r.style.removeProperty("--bg-surface");
  }
}

/** Subscribe to live settings changes. Calls cb immediately with cached value if present. */
export function subscribeSettings(cb) {
  listeners.add(cb);
  if (cachedSettings) cb(cachedSettings);
  return () => listeners.delete(cb);
}

export function getCachedSettings() {
  return cachedSettings || DEFAULT_SETTINGS;
}

export function initSettingsListener() {
  const ref = doc(db, COL.SETTINGS, SETTINGS_DOC_ID);
  onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : {};
      cachedSettings = mergeDefaults(data);
      applyThemeVars(cachedSettings);
      listeners.forEach((cb) => cb(cachedSettings));
      document.dispatchEvent(new CustomEvent("rfs:settings-ready", { detail: cachedSettings }));
    },
    (err) => {
      console.error("Settings listener error:", err);
      cachedSettings = DEFAULT_SETTINGS;
      applyThemeVars(cachedSettings);
      listeners.forEach((cb) => cb(cachedSettings));
    }
  );
}

export function toggleThemeMode() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("rfs_theme_mode", next);
  applyThemeVars(getCachedSettings()); // re-applies (or clears) custom colors for the new mode
  return next;
}

// Kick off immediately on import
initSettingsListener();
