// ==========================================================================
// admin-layout.js — Sidebar, Topbar, Auth Guard, Real-time order alerts
// Imported by every admin/*.html page.
// ==========================================================================

import { requireAdminAuth, adminLogout, hasRole } from "../auth.js";
import { subscribeAllOrders } from "../orders.js";
import { getCachedSettings, subscribeSettings } from "../settings.js";
import { escapeHtml, playChime, toast } from "../ui-helpers.js";

const NAV_ITEMS = [
  { section: "Overview" },
  { href: "dashboard.html", icon: "📊", label: "Dashboard" },
  { section: "Sales" },
  { href: "orders.html", icon: "📦", label: "Orders" },
  { href: "customers.html", icon: "👥", label: "Customers" },
  { href: "reports.html", icon: "📈", label: "Reports" },
  { section: "Catalog" },
  { href: "products.html", icon: "🛒", label: "Products" },
  { href: "categories.html", icon: "📂", label: "Categories" },
  { href: "coupons.html", icon: "🏷️", label: "Coupons" },
  { href: "reviews.html", icon: "⭐", label: "Reviews" },
  { section: "Store Settings" },
  { href: "settings-general.html", icon: "🏪", label: "General Settings" },
  { href: "settings-theme.html", icon: "🎨", label: "Theme Customizer" },
  { href: "settings-homepage.html", icon: "🖼️", label: "Homepage Builder" },
  { href: "settings-whatsapp.html", icon: "💬", label: "WhatsApp Settings" },
  { href: "settings-delivery.html", icon: "🚚", label: "Delivery & Pickup" },
  { href: "settings-alerts.html", icon: "🔔", label: "Alerts & Policies" },
  { section: "System" },
  { href: "admins.html", icon: "🔐", label: "Admin Accounts", roleOnly: "super_admin" },
  { href: "backup.html", icon: "💾", label: "Backup & Restore", roleOnly: "super_admin" },
  { href: "activity-logs.html", icon: "📜", label: "Activity Logs" }
];

export function initAdminLayout(pageKey) {
  const session = requireAdminAuth();
  if (!session) return null;

  const root = document.getElementById("admin-root");
  if (!root) return session;

  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="brand-row">
          <img src="../assets/images/logo.jpg" alt="logo" />
          <span id="sidebar-store-name">Ranaweera Family Super</span>
        </div>
        <nav class="admin-nav" id="admin-nav-mount"></nav>
        <div class="sidebar-footer">
          Logged in as <strong>${escapeHtml(session.name)}</strong><br/>
          <a href="#" id="admin-logout-link" style="color:#f4d77b;">Logout</a>
        </div>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <div class="flex items-center gap-12">
            <button class="admin-mobile-toggle btn btn-sm btn-outline" id="admin-mobile-toggle">☰</button>
            <h3 id="admin-page-title" style="margin:0;"></h3>
          </div>
          <div class="flex items-center gap-16">
            <span class="live-pulse" title="Live connection"></span>
            <span class="muted" style="font-size:12.5px;">Real-time sync active</span>
            <a href="../index.html" target="_blank" class="btn btn-sm btn-outline">View Site ↗</a>
          </div>
        </div>
        <div class="admin-content" id="admin-page-content"></div>
      </div>
    </div>
  `;

  renderNav(session, pageKey);

  document.getElementById("admin-logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    adminLogout();
    window.location.href = "login.html";
  });

  document.getElementById("admin-mobile-toggle")?.addEventListener("click", () => {
    document.getElementById("admin-sidebar").classList.toggle("open");
  });

  subscribeSettings((settings) => {
    document.getElementById("sidebar-store-name").textContent = settings.storeName;
  });

  initOrderAlertSound(session);

  return session;
}

function renderNav(session, pageKey) {
  const mount = document.getElementById("admin-nav-mount");
  mount.innerHTML = NAV_ITEMS.map((item) => {
    if (item.section) return `<div class="nav-section-title">${item.section}</div>`;
    if (item.roleOnly && !hasRole(session, item.roleOnly)) return "";
    const active = item.href === pageKey ? "active" : "";
    return `<a href="${item.href}" class="${active}">${item.icon} ${item.label}</a>`;
  }).join("");
}

// ---------------------------------------------------------------------
// Real-time new-order alert: plays a sound + toast the first time a brand
// new pending order appears after the admin panel has loaded.
// ---------------------------------------------------------------------
let knownOrderIds = null;

function initOrderAlertSound(session) {
  subscribeAllOrders((orders) => {
    const ids = new Set(orders.map((o) => o.id));
    if (knownOrderIds === null) {
      knownOrderIds = ids; // first snapshot = baseline, don't alert
      return;
    }
    const newOnes = orders.filter((o) => !knownOrderIds.has(o.id));
    if (newOnes.length) {
      playChime("order");
      newOnes.forEach((o) => {
        toast(`🛒 New Order: ${o.orderId} — Rs. ${Number(o.total).toLocaleString("en-LK")}`, "success", 6000);
        document.dispatchEvent(new CustomEvent("rfs:new-order", { detail: o }));
      });
    }
    knownOrderIds = ids;
  }, { status: "pending", limitTo: 50 });
}

export function setPageTitle(title) {
  const el = document.getElementById("admin-page-title");
  if (el) el.textContent = title;
  document.title = `${title} — Admin Panel`;
}
