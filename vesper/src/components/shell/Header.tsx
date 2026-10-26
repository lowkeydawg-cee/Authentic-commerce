"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { PRIMARY_LINKS } from "@/lib/navigation";
import { CollectionMenu } from "./CollectionMenu";
import { BagIcon, ChevronIcon, MenuIcon, SearchIcon } from "./icons";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";

/**
 * Site header. Transparent over the cinematic stage, solid ink once the page
 * scrolls, tucked away while scrolling down and revealed on scroll up.
 */
export function Header() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const collectionButtonRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO(milestone 7): read from the cart store.
  const bagCount: number = 0;

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setSolid(y > 24);
        setHidden(y > 160 && y > lastY);
        lastY = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close menus whenever the route changes.
  useEffect(() => {
    setCollectionOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const closeCollection = useCallback((returnFocus: boolean) => {
    setCollectionOpen(false);
    if (returnFocus) collectionButtonRef.current?.focus();
  }, []);

  // Escape and outside-click close the collection panel.
  useEffect(() => {
    if (!collectionOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCollection(true);
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closeCollection(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [collectionOpen, closeCollection]);

  // Hover intent for mouse users; keyboard and touch use the button.
  const hoverOpen = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setCollectionOpen(true), 120);
  };
  const hoverClose = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setCollectionOpen(false), 220);
  };

  const raised = solid || collectionOpen;

  return (
    <>
      <header
        ref={headerRef}
        onMouseLeave={hoverClose}
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-standard ease-glide",
          raised ? "border-b border-line bg-ink/95 backdrop-blur-md" : "border-b border-transparent bg-transparent",
          hidden && !collectionOpen && !mobileOpen ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div className="page-x mx-auto grid h-[var(--header-h)] max-w-page grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: desktop navigation / mobile menu button */}
          <nav aria-label="Primary" className="flex items-center">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              className="-ml-3 grid h-11 w-11 place-items-center lg:hidden"
            >
              <MenuIcon />
            </button>
            <ul className="hidden items-center gap-9 lg:flex">
              <li onMouseEnter={hoverOpen}>
                <button
                  ref={collectionButtonRef}
                  type="button"
                  aria-expanded={collectionOpen}
                  aria-controls="collection-menu"
                  onClick={() => setCollectionOpen((o) => !o)}
                  className="label flex h-11 items-center gap-2"
                >
                  Collection
                  <ChevronIcon
                    className={clsx("transition-transform duration-quick ease-glide", collectionOpen && "rotate-180")}
                  />
                </button>
              </li>
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href} onMouseEnter={hoverClose}>
                  <Link
                    href={link.href}
                    className="label link-draw"
                    aria-current={pathname.startsWith(link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Wordmark className="text-xl sm:text-2xl lg:text-[28px]" />

          {/* Right: utilities */}
          <div className="flex items-center justify-end gap-1 sm:gap-6">
            <Link href="/search" className="label hidden h-11 items-center gap-2 sm:flex">
              <SearchIcon className="h-[18px] w-[18px]" />
              <span className="hidden xl:inline">Search</span>
            </Link>
            <Link href="/account" className="label link-draw hidden pt-1 lg:inline">
              Account
            </Link>
            <Link
              href="/bag"
              aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
              className="label -mr-3 flex h-11 min-w-11 items-center justify-center gap-2 px-3 sm:mr-0 sm:px-0"
            >
              <BagIcon className="lg:hidden" />
              <span className="hidden lg:inline">Bag</span>
              <span aria-hidden="true" className="tabular-nums">
                ({bagCount})
              </span>
            </Link>
          </div>
        </div>

        <CollectionMenu open={collectionOpen} onNavigate={() => setCollectionOpen(false)} onMouseEnter={hoverOpen} />
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
