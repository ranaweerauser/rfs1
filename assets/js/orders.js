// ==========================================================================
// orders.js — Order placement + Real-time sync (Admin Dashboard & WhatsApp)
// ==========================================================================

import {
  db, collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  COL
} from "./firebase-config.js";
import { getCachedSettings } from "./settings.js";
import { adjustStock } from "./products.js";
import { cartLinePrice, cartLineLabel } from "./cart.js";

export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

export const CANCEL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const ORDER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generates a unique order ID in the format:
 *   RFS-ID-XXXXXXXX-NNNNNNNNN
 * where XXXXXXXX = 8 random uppercase letters, NNNNNNNNN = 9 random digits.
 */
export function generateOrderId() {
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let letters = "";
  for (let i = 0; i < 8; i++) letters += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  let digits = "";
  for (let i = 0; i < 9; i++) digits += Math.floor(Math.random() * 10);
  return `RFS-ID-${letters}-${digits}`;
}

/**
 * Places a new order. Customer MUST be logged in (enforced by the calling
 * page) — payload.customer.uid is required.
 * @param {object} payload { customer:{uid,name,phone,address,notes}, cartLines, deliveryMethod }
 */
export async function placeOrder(payload) {
  const orderId = generateOrderId();
  const items = payload.cartLines.map((line) => ({
    productId: line.productId,
    name: line.name,
    image: line.image,
    unitType: line.unitType,
    rawQty: line.rawQty,
    quantityLabel: cartLineLabel(line),
    basePrice: line.basePrice,
    lineTotal: cartLinePrice(line)
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = payload.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  const now = Date.now();
  const orderData = {
    orderId,
    customerUid: payload.customer.uid,
    customerName: payload.customer.name,
    customerPhone: payload.customer.phone,
    customerAddress: payload.customer.address || "",
    notes: payload.customer.notes || "",
    items,
    subtotal,
    deliveryFee,
    total,
    deliveryMethod: payload.deliveryMethod,
    status: ORDER_STATUS.PENDING,
    statusHistory: [{ status: ORDER_STATUS.PENDING, at: new Date().toISOString() }],
    seenByAdmin: false,
    createdAtMs: now,
    cancelDeadlineMs: now + CANCEL_WINDOW_MS,
    expireAtMs: now + ORDER_EXPIRY_MS,
    // `expireAt` (a Firestore Timestamp) is what a TTL policy in Firebase
    // Console should be pointed at, to auto-delete this document after 7 days.
    expireAt: new Date(now + ORDER_EXPIRY_MS),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COL.ORDERS), orderData);

  for (const item of items) {
    try {
      await adjustStock(item.productId, -item.rawQty);
    } catch (e) {
      console.warn("Stock adjust failed for", item.productId, e);
    }
  }

  return { id: docRef.id, ...orderData };
}

/** Builds the WhatsApp click-to-chat URL for an order cancellation notification. */
export function buildWhatsAppCancellationLink(order) {
  const settings = getCachedSettings();
  const phoneDigits = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");
  const message = [
    `❌ *Order Cancellation — Ranaweera Family Super*`,
    ``,
    `Order ID: ${order.orderId}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Cancelled Total: ${settings.currencySymbol || "Rs."} ${Number(order.total).toLocaleString("en-LK")}`,
    ``,
    `Items:`,
    ...order.items.map((i) => `• ${i.name} (${i.quantityLabel})`),
    ``,
    `This order has been cancelled by the customer.`
  ].join("\n");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

/** Builds the WhatsApp click-to-chat URL for a new order notification. */
export function buildWhatsAppOrderLink(order) {
  const settings = getCachedSettings();
  const template = settings.whatsappMessageTemplate || "";
  const message = template
    .replace("{name}", order.customerName)
    .replace("{phone}", order.customerPhone)
    .replace("{currency}", settings.currencySymbol || "Rs.")
    .replace("{total}", Number(order.total).toLocaleString("en-LK"))
    .replace("{deliveryMethod}", order.deliveryMethod === "pickup" ? "Self Pickup" : "Cash On Delivery")
    .replace("{orderId}", order.orderId || order.id);

  const itemsList = order.items.map((i) => `• ${i.name} (${i.quantityLabel})`).join("\n");
  const fullMessage = `${message}\n\nItems:\n${itemsList}`;
  const phoneDigits = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(fullMessage)}`;
}

// ---------------------------------------------------------------------
// REAL-TIME SUBSCRIPTIONS
// ---------------------------------------------------------------------
export function subscribeAllOrders(cb, opts = {}) {
  const constraints = [orderBy("createdAt", "desc")];
  if (opts.status) constraints.unshift(where("status", "==", opts.status));
  constraints.push(limit(opts.limitTo || 200));
  const q = query(collection(db, COL.ORDERS), ...constraints);
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

/** Customer: live updates for their OWN order history only. */
export function subscribeCustomerOrders(uid, cb) {
  const q = query(collection(db, COL.ORDERS), where("customerUid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeSingleOrder(orderDocId, cb) {
  return onSnapshot(doc(db, COL.ORDERS, orderDocId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() });
  });
}

export async function updateOrderStatus(orderDocId, newStatus, cancelReason) {
  const ref = doc(db, COL.ORDERS, orderDocId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  const history = existing.statusHistory || [];
  history.push({ status: newStatus, at: new Date().toISOString(), reason: cancelReason || null });

  const updatePayload = { status: newStatus, statusHistory: history, updatedAt: serverTimestamp() };
  if (cancelReason) updatePayload.cancelReason = cancelReason;
  await updateDoc(ref, updatePayload);

  if (newStatus === ORDER_STATUS.CANCELLED && existing.items) {
    for (const item of existing.items) {
      try {
        await adjustStock(item.productId, item.rawQty);
      } catch (e) {
        console.warn("Restock failed:", e);
      }
    }
  }
}

/** Customer-initiated cancellation, only allowed within the 15-minute window. */
export async function cancelOrderByCustomer(orderDocId) {
  const ref = doc(db, COL.ORDERS, orderDocId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Order not found.");
  const order = snap.data();
  if (order.status !== ORDER_STATUS.PENDING) throw new Error("This order can no longer be cancelled.");
  if (Date.now() > (order.cancelDeadlineMs || 0)) throw new Error("The 15-minute cancellation window has passed.");
  await updateOrderStatus(orderDocId, ORDER_STATUS.CANCELLED, "Cancelled by customer");
}

/** Admin: mark an order as reviewed/seen (separate from status workflow). */
export async function markOrderSeen(orderDocId) {
  return updateDoc(doc(db, COL.ORDERS, orderDocId), { seenByAdmin: true });
}

export async function getOrderStats() {
  const allSnap = await getDocs(collection(db, COL.ORDERS));
  const orders = allSnap.docs.map((d) => d.data());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = orders.filter((o) => {
    const created = o.createdAt?.toDate ? o.createdAt.toDate() : null;
    return created && created >= today;
  });

  const revenue = orders
    .filter((o) => o.status === ORDER_STATUS.DELIVERED)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalOrders: orders.length,
    todaysOrders: todaysOrders.length,
    pendingOrders: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
    unseenOrders: orders.filter((o) => !o.seenByAdmin).length,
    revenue
  };
}
