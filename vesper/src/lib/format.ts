import type { Money } from "./commerce/types";

export function formatMoney({ amount, currencyCode }: Money): string {
  const digits = currencyCode === "RWF" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "code",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount).replace(/ /g, " ");
  } catch {
    return `${currencyCode} ${amount.toLocaleString("en-GB")}`;
  }
}

/** "1 October 2026" — fixed locale and time zone so server and client agree. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Kigali" }).format(new Date(iso));
}
