// ==========================================================================
// products.js — Product & Category data layer (real-time, unit-price based)
// IMPORTANT: All sorting is done CLIENT-SIDE to avoid Firestore composite
// index requirements. Products will ALWAYS load immediately after deploy
// without needing any manual index setup in Firebase Console.
// ==========================================================================

import {
  db, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, limit, onSnapshot, serverTimestamp, increment,
  COL
} from "./firebase-config.js";

// Client-side sort — no composite indexes needed
function sortItems(items, sortBy) {
  const arr = [...items];
  if (sortBy === "price_asc") return arr.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
  if (sortBy === "price_desc") return arr.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
  if (sortBy === "name_asc") return arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  // Default: newest first
  return arr.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds || 0) * 1000;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds || 0) * 1000;
    return tb - ta;
  });
}

// Apply all optional client-side filters
function applyFilters(items, opts) {
  let result = items;
  if (opts.activeOnly !== false) result = result.filter((p) => p.active !== false);
  if (opts.categoryId) result = result.filter((p) => p.categoryId === opts.categoryId);
  if (opts.onDeal) result = result.filter((p) => p.hasDiscount === true);
  if (opts.bestDeals) result = result.filter((p) => p.bestDeals === true);
  return sortItems(result, opts.sortBy);
}

// ---------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------
export async function getCategories() {
  const snap = await getDocs(collection(db, COL.CATEGORIES));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function subscribeCategories(cb) {
  return onSnapshot(
    collection(db, COL.CATEGORIES),
    (snap) => {
      const cats = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      cb(cats);
    },
    (err) => { console.error("subscribeCategories error:", err); cb([]); }
  );
}

export async function addCategory(data) {
  return addDoc(collection(db, COL.CATEGORIES), {
    name: data.name,
    imageUrl: data.imageUrl || "",
    icon: data.icon || "🛒",
    parentId: data.parentId || null,
    sortOrder: data.sortOrder ?? Date.now(),
    visible: data.visible !== false,
    createdAt: serverTimestamp()
  });
}

export async function updateCategory(id, data) {
  return updateDoc(doc(db, COL.CATEGORIES, id), data);
}

export async function deleteCategory(id) {
  return deleteDoc(doc(db, COL.CATEGORIES, id));
}

export const SUPERMARKET_CATEGORY_PRESETS = [
  { name: "Vegetables", icon: "🥦" }, { name: "Fruits", icon: "🍎" },
  { name: "Rice & Grains", icon: "🌾" }, { name: "Dhal & Lentils", icon: "🫘" },
  { name: "Spices & Condiments", icon: "🌶️" }, { name: "Cooking Oil & Ghee", icon: "🫙" },
  { name: "Dairy & Eggs", icon: "🥚" }, { name: "Meat", icon: "🥩" },
  { name: "Chicken", icon: "🍗" }, { name: "Fish & Seafood", icon: "🐟" },
  { name: "Bakery", icon: "🍞" }, { name: "Beverages", icon: "🥤" },
  { name: "Tea & Coffee", icon: "☕" }, { name: "Snacks", icon: "🍿" },
  { name: "Biscuits & Sweets", icon: "🍪" }, { name: "Frozen Foods", icon: "🧊" },
  { name: "Instant Noodles", icon: "🍜" }, { name: "Sauces & Ketchup", icon: "🍅" },
  { name: "Baby Care", icon: "🍼" }, { name: "Personal Care", icon: "🧴" },
  { name: "Health & Wellness", icon: "💊" }, { name: "Household Cleaning", icon: "🧹" },
  { name: "Laundry", icon: "🧺" }, { name: "Kitchen & Dining", icon: "🍽️" },
  { name: "Pet Supplies", icon: "🐾" }, { name: "Stationery", icon: "✏️" }
];

// ---------------------------------------------------------------------
// PRODUCTS — Real-time, no composite indexes, client-side filters+sort
// ---------------------------------------------------------------------

/**
 * REAL-TIME product listing. No composite indexes required.
 * Uses onSnapshot on the whole products collection, then filters+sorts client-side.
 * For 6000 products this is fast; Firestore streams only changed docs on updates.
 */
export function subscribeProductsPage(opts = {}, cb) {
  // Only filter by ONE field in Firestore (no composite index needed).
  // Everything else is done client-side.
  let q;
  if (opts.categoryId) {
    q = query(collection(db, COL.PRODUCTS), where("categoryId", "==", opts.categoryId));
  } else {
    // Fetch all — client-side filters handle active/deals/bestDeals
    q = collection(db, COL.PRODUCTS);
  }

  return onSnapshot(
    q,
    (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb({ items: applyFilters(raw, opts) });
    },
    async (err) => {
      console.warn("subscribeProductsPage error, using fallback getDocs:", err.code);
      try {
        const snap = await getDocs(collection(db, COL.PRODUCTS));
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb({ items: applyFilters(raw, opts) });
      } catch (e2) {
        console.error("Fallback failed:", e2);
        cb({ items: [], error: e2 });
      }
    }
  );
}

export async function fetchProductsPage(opts = {}) {
  const snap = await getDocs(collection(db, COL.PRODUCTS));
  const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { items: applyFilters(raw, opts) };
}

export function subscribeProduct(id, cb) {
  return onSnapshot(
    doc(db, COL.PRODUCTS, id),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (err) => { console.error("subscribeProduct error:", err); cb(null); }
  );
}

export async function getProductById(id) {
  const snap = await getDoc(doc(db, COL.PRODUCTS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function searchProducts(termRaw) {
  const term = (termRaw || "").trim().toLowerCase();
  if (!term) return { items: [] };
  try {
    const snap = await getDocs(query(
      collection(db, COL.PRODUCTS),
      where("searchKeywords", "array-contains", term),
      limit(60)
    ));
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.active !== false);
    return { items };
  } catch {
    // Fallback: scan all and filter
    const snap = await getDocs(collection(db, COL.PRODUCTS));
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.active !== false && (p.name || "").toLowerCase().includes(term));
    return { items };
  }
}

export function subscribeSearchProducts(termRaw, cb) {
  const term = (termRaw || "").trim().toLowerCase();
  if (!term) { cb({ items: [] }); return () => {}; }
  return onSnapshot(
    query(collection(db, COL.PRODUCTS), where("searchKeywords", "array-contains", term), limit(60)),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false);
      cb({ items });
    },
    async () => {
      // Fallback name search
      const snap = await getDocs(collection(db, COL.PRODUCTS));
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.active !== false && (p.name || "").toLowerCase().includes(term));
      cb({ items });
    }
  );
}

export function buildSearchKeywords(name) {
  const clean = (name || "").toLowerCase().trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const tokens = new Set();
  words.forEach((w) => { for (let i = 1; i <= w.length; i++) tokens.add(w.slice(0, i)); });
  tokens.add(clean);
  return Array.from(tokens).slice(0, 60);
}

export async function addProduct(data) {
  const basePrice = Number(data.basePrice) || 0;
  const discountPrice = Number(data.discountPrice) || 0;
  const hasDiscount = !!(discountPrice && discountPrice < basePrice);
  return addDoc(collection(db, COL.PRODUCTS), {
    name: data.name,
    categoryId: data.categoryId || null,
    images: data.images || [],
    unitType: data.unitType || "item",
    basePrice,
    discountPrice: hasDiscount ? discountPrice : null,
    hasDiscount,
    bestDeals: !!data.bestDeals,
    stock: Number(data.stock) || 0,
    active: data.active !== false,
    avgRating: 0,
    reviewCount: 0,
    searchKeywords: buildSearchKeywords(data.name),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateProduct(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (data.basePrice !== undefined || data.discountPrice !== undefined) {
    const base = Number(data.basePrice || 0);
    const disc = Number(data.discountPrice || 0);
    payload.hasDiscount = !!(disc && disc < base);
    payload.discountPrice = payload.hasDiscount ? disc : null;
  }
  if (data.name) payload.searchKeywords = buildSearchKeywords(data.name);
  if (data.bestDeals !== undefined) payload.bestDeals = !!data.bestDeals;
  return updateDoc(doc(db, COL.PRODUCTS, id), payload);
}

export async function deleteProduct(id) {
  return deleteDoc(doc(db, COL.PRODUCTS, id));
}

export async function adjustStock(productId, deltaRaw) {
  return updateDoc(doc(db, COL.PRODUCTS, productId), { stock: increment(deltaRaw) });
}

export async function getLowStockProducts(threshold = 1000) {
  const snap = await getDocs(collection(db, COL.PRODUCTS));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => (p.stock || 0) <= threshold);
}

// ---------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------
export async function addReview(productId, review) {
  await addDoc(collection(db, COL.REVIEWS), {
    productId,
    customerName: review.customerName,
    customerUid: review.customerUid,
    rating: review.rating,
    comment: review.comment,
    approved: false,
    createdAt: serverTimestamp()
  });
}

export async function getApprovedReviews(productId) {
  const snap = await getDocs(query(collection(db, COL.REVIEWS), where("productId", "==", productId)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.approved === true);
}

export function subscribeApprovedReviews(productId, cb) {
  return onSnapshot(
    query(collection(db, COL.REVIEWS), where("productId", "==", productId)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.approved === true)),
    (err) => { console.error("subscribeApprovedReviews error:", err); cb([]); }
  );
}
