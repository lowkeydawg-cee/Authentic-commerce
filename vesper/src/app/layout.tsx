import type { Metadata, Viewport } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import { BagDrawer } from "@/components/bag/BagDrawer";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap",
});
const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "VESPER — Dressed for the after-hours", template: "%s · VESPER" },
  description: "Sneakers, shoes, outerwear and accessories, crafted for the after-hours. Explore every piece in 3D.",
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="label fixed left-4 top-4 z-[100] -translate-y-24 bg-ivory px-5 py-3 text-ink transition-transform duration-quick focus:translate-y-0"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <BagDrawer />
      </body>
    </html>
  );
}
