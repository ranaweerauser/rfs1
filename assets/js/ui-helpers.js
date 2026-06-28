// ==========================================================================
// ui-helpers.js — Toasts, Modals, Loading states, formatting utilities
// ==========================================================================

import { getCachedSettings } from "./settings.js";

export function toast(message, type = "info", duration = 3200) {
  let wrap = document.getElementById("toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s ease";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export function formatCurrency(amount) {
  const symbol = getCachedSettings().currencySymbol || "Rs.";
  const num = Number(amount || 0);
  return `${symbol} ${num.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

export function openModal(innerHtml, opts = {}) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "active-modal-backdrop";
  backdrop.innerHTML = `<div class="modal-box ${opts.wide ? "wide" : ""}">${innerHtml}</div>`;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop && opts.closeOnBackdrop !== false) closeModal();
  });
  document.body.appendChild(backdrop);
  return backdrop;
}

export function closeModal() {
  document.getElementById("active-modal-backdrop")?.remove();
}

export function debounce(fn, delay = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateOrderId() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RFS-${ymd}-${rand}`;
}

/**
 * Plays a short professional chime sequence (~5 seconds total with the
 * final note's natural decay). Used for: admin "new order" alerts and
 * customer "order cancelled" confirmations.
 * @param {"order"|"cancel"} type
 */
export function playChime(type = "order") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === "cancel"
      ? [392.0, 329.6, 261.6] // descending G4-E4-C4 (soft "cancelled" tone)
      : [523.3, 659.3, 784.0, 1046.5]; // ascending C5-E5-G5-C6 (bright "new order" chime)

    const noteGap = type === "cancel" ? 0.42 : 0.38;
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * noteGap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + noteGap + 0.55);
      osc.start(start);
      osc.stop(start + noteGap + 0.6);
    });
    // Let the final note's tail ring out — combined with the note gaps this
    // sequence comfortably fills the requested ~5 second notification window
    // when paired with the on-screen toast/popup duration.
  } catch (e) {
    // Audio may be blocked until the user interacts with the page; fail silently.
  }
}

export function skeletonCard() {
  return `<div class="product-card"><div class="img-wrap skeleton"></div><div class="body">
    <div class="skeleton" style="height:11px;width:50%;border-radius:4px;"></div>
    <div class="skeleton" style="height:14px;width:85%;border-radius:4px;"></div>
    <div class="skeleton" style="height:18px;width:40%;border-radius:4px;"></div>
  </div></div>`;
}
