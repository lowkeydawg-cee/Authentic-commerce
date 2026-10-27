/**
 * Client-care details shown on Contact, Shipping & returns and Account.
 * LAUNCH: confirm these with the business before going live (see README).
 */
export const site = {
  email: "care@vesper.rw",
  hours: "Monday to Saturday, 9:00–19:00 (Kigali time)",
  responseTime: "We reply within one business day.",
  city: "Kigali, Rwanda",
};

/** Public origin, used for the sitemap and social previews. Set NEXT_PUBLIC_SITE_URL in the host's environment. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
