import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Authentic — Curated Luxury, Delivered in Rwanda", template: "%s · Authentic" },
  description:
    "A premium storefront for hand-finished accessories, audio, apparel and homeware with live stock availability.",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
