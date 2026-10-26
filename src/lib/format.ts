export function formatMoney(amount: number, currency: string): string {
  // RWF has no minor unit in everyday use; other currencies get two decimals.
  const fractionDigits = currency === "RWF" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uid(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${random}`;
}

export function orderReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `AC-${stamp}${rand}`;
}
