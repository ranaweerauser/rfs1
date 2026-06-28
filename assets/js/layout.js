// ==========================================================================
// layout.js — Header, Bottom Nav, Floating Buttons (New Template Design)
// ==========================================================================

import { subscribeSettings, toggleThemeMode } from "./settings.js";
import { onCartChange, cartItemCount } from "./cart.js";
import { onAuthChange, loginWithGoogle, getCurrentUser } from "./auth.js";
import { toast, escapeHtml } from "./ui-helpers.js";

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  cart:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6"/></svg>`,
  user:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/></svg>`,
  userIn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/><path d="m9 12 1.8 1.8L15 10" stroke="#1a5c3a" stroke-width="2.5"/></svg>`,
  menu:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  home:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`,
  deal:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  items:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  orders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6l1 4H8l1-4Z"/><path d="M4 6h16l-1.2 13.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 6Z"/><path d="M9 11h6M9 15h6"/></svg>`,
  wa:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.84.5 3.56 1.36 5.04L2 22l5.2-1.46a9.86 9.86 0 0 0 4.84 1.27c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm5.79 13.93c-.24.68-1.41 1.34-1.93 1.4-.5.06-1.07.27-3.6-.76-3.03-1.24-4.97-4.32-5.12-4.52-.15-.2-1.22-1.62-1.22-3.1s.78-2.2 1.05-2.5c.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.06.92 2.21.08.15.13.33.02.53-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.3.8 1.32 1.71 2.14 1.18 1.05 2.17 1.38 2.48 1.54.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.23.57.36.08.13.08.75-.16 1.44Z"/></svg>`,
  phone:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`,
  sun:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  moon:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>`,
};

const NAV_LINKS = [
  { href:"index.html", label:"Home" },
  { href:"about.html", label:"About Us" },
  { href:"categories.html", label:"Categories" },
  { href:"best-deals.html", label:"Special Offers" },
  { href:"contact.html", label:"Contact" },
];

function currentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function headerHtml(settings) {
  const cur = currentPage();
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const phoneDigits = (settings.phone || "").replace(/[^0-9+]/g, "");
  return `
  <div class="topbar">
    <div class="container" style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px;flex-wrap:wrap;gap:6px;">
      <div style="display:flex;align-items:center;gap:16px;font-size:12.5px;">
        <span>${ICONS.phone}${escapeHtml(settings.phone)}</span>
        <span>✉️ ${escapeHtml(settings.email)}</span>
      </div>
      <div style="display:flex;gap:12px;font-size:12.5px;">
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact</a>
      </div>
    </div>
  </div>
  ${settings.announcementEnabled && settings.announcementText ? `<div class="announcement-bar">${escapeHtml(settings.announcementText)}</div>` : ""}
  ${settings.alerts?.enabled && settings.alerts?.message ? `
  <div class="customer-alert-bar" style="background:${settings.alerts.bgColor||"#fff3e8"};color:${settings.alerts.textColor||"#c45000"};">
    <span class="alert-icon-pulse">🔔</span>
    <span>${escapeHtml(settings.alerts.message)}</span>
  </div>` : ""}
  <div class="main-nav container">
    <a href="index.html" class="brand">
      <img src="${settings.logoUrl}" alt="${escapeHtml(settings.storeName)}" />
      <div>
        <div style="font-size:14px;font-weight:800;line-height:1.1;color:var(--green-dark);">${escapeHtml(settings.storeName)}</div>
        <div style="font-size:10px;font-weight:500;color:var(--text-muted);font-family:var(--font-body);letter-spacing:.4px;">NITTAMBUWA</div>
      </div>
    </a>
    <nav class="nav-desktop-links">
      ${NAV_LINKS.map((l) => `<a href="${l.href}" class="${cur===l.href?"active":""}">${l.label}</a>`).join("")}
    </nav>
    <div class="search-bar">
      ${ICONS.search}
      <input type="text" id="global-search-input" placeholder="Search products..." />
    </div>
    <div class="nav-actions">
      <button class="theme-toggle ${isDark?"dark":""}" id="theme-toggle-btn" title="Toggle theme" aria-label="Toggle dark/light mode">
        <span class="theme-toggle-track">
          <span class="theme-toggle-thumb">
            <span class="theme-toggle-icon" id="theme-icon">
              ${isDark ? ICONS.moon : ICONS.sun}
            </span>
          </span>
        </span>
      </button>
      <button class="icon-btn" id="account-icon-btn" title="Account">${ICONS.user}</button>
      <a class="icon-btn" href="cart.html" title="Cart" style="position:relative;">${ICONS.cart}<span class="badge" id="cart-badge" style="display:none;">0</span></a>
      <a href="products.html" class="shop-btn" style="display:none;" id="desktop-shop-btn">
        ${ICONS.items} Shop in Store
      </a>
      <button class="mobile-menu-btn" id="mobile-menu-btn">${ICONS.menu}</button>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    ${NAV_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}
    <a href="account.html">My Account</a>
    <a href="cart.html">Cart</a>
  </div>`;
}

function footerHtml(settings) {
  return `
  <div class="footer-grid container">
    <div class="footer-brand">
      <img src="${settings.logoUrl}" alt="${escapeHtml(settings.storeName)}" />
      <strong style="display:block;color:#fff;font-size:14px;margin-bottom:6px;">${escapeHtml(settings.storeName)}</strong>
      <p>${escapeHtml(settings.tagline)}</p>
      <div class="social-row">
        ${settings.social?.facebook ? `<a href="${settings.social.facebook}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9l2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg></a>` : ""}
        ${settings.social?.instagram ? `<a href="${settings.social.instagram}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>` : ""}
        ${settings.social?.tiktok ? `<a href="${settings.social.tiktok}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16.6 2h-3.1v13.6a3 3 0 1 1-2.1-2.9V9.5a6.1 6.1 0 1 0 5.2 6V8.8a7.5 7.5 0 0 0 4.4 1.4V7.1A4.5 4.5 0 0 1 16.6 2Z"/></svg></a>` : ""}
        ${settings.social?.youtube ? `<a href="${settings.social.youtube}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.5v5l4.5-2.5Z"/></svg></a>` : ""}
      </div>
    </div>
    <div>
      <h4>Quick Links</h4>
      <a href="index.html">Home</a>
      <a href="about.html">About Us</a>
      <a href="categories.html">Categories</a>
      <a href="best-deals.html">Special Offers</a>
      <a href="contact.html">Contact Us</a>
    </div>
    <div>
      <h4>Customer Info</h4>
      <a href="orders.html">Track My Order</a>
      <a href="terms.html">Terms &amp; Conditions</a>
      <a href="privacy.html">Privacy Policy</a>
      <a href="returns.html">Return Policy</a>
      <a href="faq.html">FAQ</a>
    </div>
    <div>
      <h4>Newsletter</h4>
      <p style="font-size:13px;color:rgba(255,255,255,.7);">Get the latest offers and updates delivered to your inbox.</p>
      <div class="newsletter-input">
        <input type="email" placeholder="Your email address" id="newsletter-email" />
        <button onclick="alert('Thank you for subscribing!')">Subscribe</button>
      </div>
      <p style="margin-top:12px;font-size:13px;color:rgba(255,255,255,.7);">📍 ${escapeHtml(settings.address)}</p>
    </div>
  </div>
  <div class="footer-bottom">© ${new Date().getFullYear()} ${escapeHtml(settings.storeName)}. All rights reserved. &nbsp;·&nbsp; Proudly Serving Nittambuwa ❤️</div>`;
}

function bottomNavHtml() {
  const cur = currentPage();
  const tabs = [
    { href:"index.html",      icon:"home",   label:"Home" },
    { href:"best-deals.html", icon:"deal",   label:"Best Deals" },
    { href:"products.html",   icon:"items",  label:"Items" },
    { href:"cart.html",       icon:"cart",   label:"Cart",     badge:true },
    { href:"orders.html",     icon:"orders", label:"My Orders" },
  ];
  return `<nav class="bottom-nav">${tabs.map((t) => `
    <a href="${t.href}" class="bottom-nav-item ${cur===t.href?"active":""}">
      ${ICONS[t.icon]}
      <span class="lbl">${t.label}</span>
      ${t.badge ? `<span class="badge" id="cart-badge" style="display:none;">0</span>` : ""}
    </a>`).join("")}</nav>`;
}

function floatHtml(settings) {
  const wa = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");
  const ph = (settings.phone || "").replace(/[^0-9+]/g, "");
  return `<div class="float-stack">
    ${settings.whatsappEnabled !== false ? `<a class="float-btn float-whatsapp" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="WhatsApp">${ICONS.wa}</a>` : ""}
    <a class="float-btn float-call" href="tel:${ph}" title="Call Us">${ICONS.phone}</a>
  </div>`;
}

export function mountLayout() {
  const hMount = document.getElementById("app-header");
  const fMount = document.getElementById("app-footer");
  const floatM = document.getElementById("app-floats");
  const navM   = document.getElementById("app-bottomnav");

  if (navM) navM.innerHTML = bottomNavHtml();

  subscribeSettings((settings) => {
    document.title = document.title === "Loading..." ? settings.storeName : document.title;
    if (hMount) hMount.innerHTML = headerHtml(settings);
    if (fMount) fMount.innerHTML = footerHtml(settings);
    if (floatM) floatM.innerHTML = floatHtml(settings);
    bindHeader();
  });

  onCartChange(updateBadge);
  onAuthChange(syncUserIcon);
}

function updateBadge() {
  const count = cartItemCount();
  document.querySelectorAll("#cart-badge").forEach((b) => {
    b.textContent = count; b.style.display = count > 0 ? "flex" : "none";
  });
}

function syncUserIcon() {
  const btn = document.getElementById("account-icon-btn");
  if (!btn) return;
  const user = getCurrentUser();
  btn.innerHTML = user ? ICONS.userIn : ICONS.user;
  btn.title = user ? "My Account" : "Login with Google";
}

function bindHeader() {
  // Mobile menu
  const mb = document.getElementById("mobile-menu-btn");
  const mm = document.getElementById("mobile-menu");
  if (mb && mm) mb.onclick = () => mm.classList.toggle("open");

  // Theme toggle
  const tb = document.getElementById("theme-toggle-btn");
  if (tb) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    tb.classList.toggle("dark", isDark);
    const ic = document.getElementById("theme-icon");
    if (ic) ic.innerHTML = isDark ? ICONS.moon : ICONS.sun;
    tb.onclick = () => {
      tb.classList.add("animating");
      const mode = toggleThemeMode();
      tb.classList.toggle("dark", mode === "dark");
      const ico = document.getElementById("theme-icon");
      if (ico) ico.innerHTML = mode === "dark" ? ICONS.moon : ICONS.sun;
      setTimeout(() => tb.classList.remove("animating"), 400);
    };
  }

  // Account button
  const ab = document.getElementById("account-icon-btn");
  if (ab) {
    ab.onclick = async () => {
      const user = getCurrentUser();
      if (user) { window.location.href = "account.html"; return; }
      try {
        const r = await loginWithGoogle();
        if (r) { toast("Welcome! Logged in.", "success"); window.location.href = "account.html"; }
      } catch (e) {
        if (e.message === "DOMAIN_NOT_AUTHORIZED") {
          toast("⚠️ Add your domain to Firebase Authorized Domains first.", "error", 6000);
        } else {
          toast("Google login failed. Please try again.", "error");
        }
      }
    };
  }

  // Search
  const si = document.getElementById("global-search-input");
  if (si) {
    si.onkeydown = (e) => {
      if (e.key === "Enter" && si.value.trim()) {
        window.location.href = `products.html?search=${encodeURIComponent(si.value.trim())}`;
      }
    };
  }

  // Show desktop shop button on wide screens
  const dsb = document.getElementById("desktop-shop-btn");
  if (dsb && window.innerWidth > 900) dsb.style.display = "flex";

  updateBadge();
  syncUserIcon();
}

document.addEventListener("DOMContentLoaded", mountLayout);
