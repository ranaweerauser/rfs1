// ==========================================================================
// cart.js — Shopping cart (unit-price aware) with localStorage persistence
// Each cart line stores: productId, unitType, rawQty (grams/ml/count),
// the basePrice used at time of adding, plus product snapshot for display.
// ==========================================================================

import { getCachedSettings } from "./settings.js";
import { toast } from "./ui-helpers.js";
import { calculatePrice, getEffectiveBasePrice, formatQuantity, getStepperConfig } from "./pricing.js";

const CART_KEY = "rfs_cart_v2";
const listeners = new Set();

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  listeners.forEach((cb) => cb(items));
}

export function onCartChange(cb) {
  listeners.add(cb);
  cb(readCart());
  return () => listeners.delete(cb);
}

export function getCart() {
  return readCart();
}

/**
 * Adds a product to the cart at a given raw quantity (grams/ml/count).
 * If the same product is already in the cart, quantities are merged
 * (clamped to the unit type's max and to available stock).
 */
export function addToCart(product, rawQty) {
  const items = readCart();
  const existing = items.find((i) => i.productId === product.id);
  const { max } = getStepperConfig(product.unitType);
  const effectivePrice = getEffectiveBasePrice(product);

  if (existing) {
    const newQty = Math.min(existing.rawQty + rawQty, max, product.stock);
    if (newQty <= existing.rawQty) {
      toast("No more stock available for this product.", "error");
      return false;
    }
    existing.rawQty = newQty;
    existing.basePrice = effectivePrice;
    existing.maxStock = product.stock;
  } else {
    if (rawQty > product.stock) {
      toast("Not enough stock available.", "error");
      return false;
    }
    items.push({
      productId: product.id,
      name: product.name,
      image: product.images?.[0] || "",
      unitType: product.unitType,
      basePrice: effectivePrice,
      rawQty: Math.min(rawQty, max),
      maxStock: product.stock
    });
  }
  writeCart(items);
  toast(`✅ ${product.name} added to cart`, "success");
  return true;
}

export function removeFromCart(productId) {
  writeCart(readCart().filter((i) => i.productId !== productId));
}

export function updateCartQty(productId, rawQty) {
  const items = readCart();
  const line = items.find((i) => i.productId === productId);
  if (!line) return;
  const { min, max } = getStepperConfig(line.unitType);
  if (rawQty < min) return removeFromCart(productId);
  line.rawQty = Math.min(rawQty, max, line.maxStock || max);
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}

export function cartItemCount() {
  return readCart().length;
}

export function cartLinePrice(line) {
  return calculatePrice(line.unitType, line.basePrice, line.rawQty);
}

export function cartLineLabel(line) {
  return formatQuantity(line.unitType, line.rawQty);
}

export function cartSubtotal() {
  return readCart().reduce((sum, line) => sum + cartLinePrice(line), 0);
}

export function calculateDeliveryFee(subtotal, deliveryMethod) {
  if (deliveryMethod === "pickup") return 0;
  const settings = getCachedSettings();
  if (settings.freeDeliveryThreshold && subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryBaseFee || 0;
}

export function cartTotals(deliveryMethod = "delivery") {
  const subtotal = cartSubtotal();
  const deliveryFee = calculateDeliveryFee(subtotal, deliveryMethod);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

export function meetsMinimumOrder() {
  const settings = getCachedSettings();
  return cartSubtotal() >= (settings.minOrderAmount || 0);
}

/** Returns true if this product is currently in the cart (used for the "added!" highlight). */
export function isInCart(productId) {
  return readCart().some((i) => i.productId === productId);
}
