export interface NavLink {
  label: string;
  href: string;
}

export const CATEGORIES: NavLink[] = [
  { label: "Sneakers", href: "/collections/sneakers" },
  { label: "Shoes", href: "/collections/shoes" },
  { label: "T-shirts", href: "/collections/t-shirts" },
  { label: "Jackets", href: "/collections/jackets" },
  { label: "Accessories", href: "/collections/accessories" },
];

/** Primary links shown in the desktop header next to the Collection menu. */
export const PRIMARY_LINKS: NavLink[] = [
  { label: "Sneakers", href: "/collections/sneakers" },
  { label: "Outerwear", href: "/collections/jackets" },
  { label: "Journal", href: "/journal" },
];

export const SUPPORT_LINKS: NavLink[] = [
  { label: "Size guide", href: "/size-guide" },
  { label: "Shipping & returns", href: "/shipping-returns" },
  { label: "Care", href: "/care" },
  { label: "Contact", href: "/contact" },
];

export const HOUSE_LINKS: NavLink[] = [
  { label: "Journal", href: "/journal" },
  { label: "The house", href: "/journal/the-house" },
  { label: "Account", href: "/account" },
];
