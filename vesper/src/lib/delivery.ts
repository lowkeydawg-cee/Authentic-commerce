/**
 * Delivery and payment terms, shared by checkout and the Shipping & returns page
 * so the two can never disagree. Sample rates; real ones come from the commerce platform.
 */
export const DELIVERY = [
  { id: "standard", label: "Standard delivery", note: "2–4 business days", fee: 0 },
  { id: "express", label: "Express courier", note: "Next business day in Kigali", fee: 10000 },
] as const;

export const PAYMENT = [
  { id: "card", label: "Card", note: "Visa, Mastercard" },
  { id: "mtn", label: "MTN Mobile Money", note: "Approve on your phone" },
  { id: "airtel", label: "Airtel Money", note: "Approve on your phone" },
] as const;

export const COUNTRIES = ["Rwanda", "Burundi", "Democratic Republic of the Congo", "Kenya", "Tanzania", "Uganda"];

export const RETURNS = {
  days: 14,
  summary: "Unworn pieces can be returned within 14 days of delivery, in their original packaging.",
};
