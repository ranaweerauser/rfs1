// ==========================================================================
// pricing.js — Unit Types, Quantity Steppers & Proportional Price Calculator
//
// Every product has ONE unit type (g, kg, ml, L, item, ගෙඩි, කෑලි, බෝතල්,
// bottle, පෙට්ටි). The admin enters ONE base price (price per 1kg / 1L /
// 1 unit). The customer picks a quantity with a +/- stepper, and the price
// is calculated proportionally in real time.
// ==========================================================================

export const UNIT_TYPES = [
  { value: "g",      label: "Grams (g)",       family: "weight", icon: "⚖️" },
  { value: "kg",      label: "Kilograms (Kg)",  family: "weight", icon: "⚖️" },
  { value: "ml",      label: "Milliliters (ml)", family: "volume", icon: "🧴" },
  { value: "l",       label: "Liters (L)",       family: "volume", icon: "🧴" },
  { value: "item",    label: "Items",            family: "count",  icon: "📦" },
  { value: "ගෙඩි",     label: "ගෙඩි",             family: "count",  icon: "🥥" },
  { value: "කෑලි",     label: "කෑලි",             family: "count",  icon: "🔪" },
  { value: "බෝතල්",    label: "බෝතල්",            family: "count",  icon: "🍾" },
  { value: "bottle",  label: "Bottle",           family: "count",  icon: "🍾" },
  { value: "පෙට්ටි",    label: "පෙට්ටි",            family: "count",  icon: "📦" }
];

export function getUnitMeta(unitType) {
  return UNIT_TYPES.find((u) => u.value === unitType) || UNIT_TYPES[4];
}

/**
 * Returns the stepper configuration for a unit type — i.e. the minimum,
 * maximum, and step size, all expressed in the SAME base numeric unit that
 * `stock` and cart quantities are stored in:
 *   - g / kg  -> stored & stepped in GRAMS
 *   - ml / l  -> stored & stepped in MILLILITERS
 *   - count types -> stored & stepped in whole units
 */
export function getStepperConfig(unitType) {
  switch (unitType) {
    case "g":
      // Small-package weight items: fixed small options only.
      return { min: 250, max: 750, step: 250, kind: "weight-small" };
    case "kg":
      // Full range: starts small (250g) and goes up to 100kg, in 250g steps.
      return { min: 250, max: 100000, step: 250, kind: "weight-full" };
    case "ml":
      return { min: 250, max: 750, step: 250, kind: "volume-small" };
    case "l":
      return { min: 250, max: 100000, step: 250, kind: "volume-full" };
    default:
      // Count-based: items, ගෙඩි, කෑලි, බෝතල්, bottle, පෙට්ටි
      return { min: 1, max: 100, step: 1, kind: "count" };
  }
}

/** Formats a raw stored quantity (grams/ml/count) into a human label, e.g. 1250 -> "1.25 Kg". */
export function formatQuantity(unitType, rawQty) {
  const meta = getUnitMeta(unitType);
  if (meta.family === "weight") {
    if (rawQty < 1000) return `${rawQty}g`;
    const kg = rawQty / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}Kg`;
  }
  if (meta.family === "volume") {
    if (rawQty < 1000) return `${rawQty}ml`;
    const l = rawQty / 1000;
    return `${l % 1 === 0 ? l : l.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}L`;
  }
  return `${rawQty} ${meta.label}`;
}

/**
 * Calculates the price for a given raw quantity, proportional to the base
 * price (which is always "price per 1kg / per 1L / per 1 unit").
 *   - weight/volume: price = (rawQty / 1000) * basePrice
 *   - count: price = rawQty * basePrice
 */
export function calculatePrice(unitType, basePrice, rawQty) {
  const meta = getUnitMeta(unitType);
  if (meta.family === "weight" || meta.family === "volume") {
    return (rawQty / 1000) * basePrice;
  }
  return rawQty * basePrice;
}

/** Returns the effective base price to use for calculations (discount price if active, else normal price). */
export function getEffectiveBasePrice(product) {
  if (product.discountPrice && product.discountPrice < product.basePrice) return product.discountPrice;
  return product.basePrice;
}

/** Default quantity to pre-select when a customer opens a product (the smallest sensible amount). */
export function getDefaultQuantity(unitType) {
  return getStepperConfig(unitType).min;
}

export function clampQuantity(unitType, qty) {
  const { min, max, step } = getStepperConfig(unitType);
  let q = Math.round(qty / step) * step;
  if (q < min) q = min;
  if (q > max) q = max;
  return q;
}
