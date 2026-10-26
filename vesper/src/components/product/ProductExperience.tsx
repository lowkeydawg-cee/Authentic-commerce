"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { ProductImage } from "@/components/media/ProductImage";
import { bag } from "@/lib/cart/store";
import type { Product } from "@/lib/commerce/types";
import { formatMoney } from "@/lib/format";
import { detectCapability, type Capability } from "@/components/viewer/capability";
import type { StandinSpec } from "@/three/standins";
import { HOTSPOT_EVENT } from "./hotspot-event";
import { SizeGuide } from "./SizeGuide";

// The viewer (three.js + R3F) loads only when 3D is actually shown.
const ProductViewer = dynamic(() => import("@/components/viewer/ProductViewer"), { ssr: false });

type PhotoView = "front" | "alt";
type View = "3d" | PhotoView;
const VIEW_LABEL: Record<PhotoView, string> = { front: "Front", alt: "Profile" };

/** Reads ?colour= on the client so the page itself can stay statically generated. */
export function ProductExperienceWithUrl({ product }: { product: Product }) {
  const colour = useSearchParams().get("colour");
  return <ProductExperience product={product} initialColour={colour} />;
}

export function ProductExperience({ product, initialColour }: { product: Product; initialColour?: string | null }) {
  const start = product.colorways.find((c) => c.id === initialColour) ?? product.colorways[0];
  const [colourId, setColourId] = useState(start.id);
  const [view, setView] = useState<View>("front");
  const oneSize = product.sizes.length === 1;
  const [size, setSize] = useState<string | null>(oneSize ? product.sizes[0] : null);
  const [status, setStatus] = useState<"idle" | "needSize" | "added">("idle");
  const [nudge, setNudge] = useState(0);
  const sizeGroupRef = useRef<HTMLFieldSetElement>(null);
  const buyRef = useRef<HTMLButtonElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  const id = useId();
  const galleryRef = useRef<HTMLElement>(null);
  const [capability, setCapability] = useState<Capability | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);
  const [env, setEnv] = useState({ reduced: false, mobile: false });
  const can3d = capability !== null && capability.tier !== "none" && !viewerFailed;

  const colourway = product.colorways.find((c) => c.id === colourId)!;
  const soldOut = (s: string) => colourway.soldOutSizes.includes(s);
  const allSoldOut = product.sizes.every(soldOut);

  const chooseColour = (next: string) => {
    setColourId(next);
    setStatus("idle");
    const cw = product.colorways.find((c) => c.id === next)!;
    if (size && cw.soldOutSizes.includes(size) && !oneSize) setSize(null);
    // Keep the URL shareable without a server round-trip.
    const url = new URL(window.location.href);
    url.searchParams.set("colour", next);
    window.history.replaceState(null, "", url);
  };

  const addToBag = () => {
    if (!size) {
      setStatus("needSize");
      setNudge((n) => n + 1);
      return;
    }
    bag.add({ slug: product.slug, colorwayId: colourway.id, size });
    setStatus("added");
  };

  useEffect(() => {
    if (status !== "added") return;
    const t = setTimeout(() => setStatus("idle"), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // Mobile: show the sticky add-to-bag bar once the main button has scrolled
  // above the viewport. A scroll check (not IntersectionObserver) so a fast
  // flick past the button is never missed.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = buyRef.current;
        if (el) setBuyVisible(el.getBoundingClientRect().bottom > 0);
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // Decide on 3D once per visit: auto-start on capable desktops, tap-to-start elsewhere.
  useEffect(() => {
    const cap = detectCapability();
    setCapability(cap);
    setEnv({
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      mobile: window.matchMedia("(pointer: coarse)").matches,
    });
    if (cap.auto) setView("3d");
  }, []);

  const show3d = () => {
    setViewerReady(false);
    setView("3d");
  };

  // "View in 3D" links in How it's made jump the viewer to that detail.
  useEffect(() => {
    const onHotspot = (e: Event) => {
      const hotspotId = (e as CustomEvent<string>).detail;
      galleryRef.current?.scrollIntoView({ behavior: env.reduced ? "auto" : "smooth", block: "start" });
      if (!can3d) return;
      if (view !== "3d") show3d();
      setActiveHotspot(hotspotId);
    };
    window.addEventListener(HOTSPOT_EVENT, onHotspot);
    return () => window.removeEventListener(HOTSPOT_EVENT, onHotspot);
  });

  // Only mention loading if the model takes longer than 2 s (Step 7 · page loading).
  useEffect(() => {
    if (view !== "3d" || viewerReady) return setSlowLoad(false);
    const t = setTimeout(() => setSlowLoad(true), 2000);
    return () => clearTimeout(t);
  }, [view, viewerReady]);

  // After a "choose a size" nudge, move focus to the first available size.
  useEffect(() => {
    if (nudge > 0) sizeGroupRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
  }, [nudge]);

  const buyLabel = allSoldOut ? "Sold out" : status === "needSize" ? "Please select a size" : status === "added" ? "Added to bag ✓" : "Add to bag";
  const buyClass = clsx(
    "label min-h-14 font-semibold transition-colors duration-quick ease-quiet disabled:cursor-not-allowed disabled:opacity-50",
    status === "needSize" ? "bg-oxblood text-ivory" : "bg-ivory text-ink hover:bg-white",
  );

  return (
    <div className="grid gap-y-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]">
      {/* ── Gallery / 3D viewer ──────────────────────────── */}
      <section ref={galleryRef} aria-label={`${product.title} images and 3D view`} className="min-w-0 scroll-mt-[calc(var(--header-h)+16px)]">
        <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto lg:h-[calc(100svh-var(--header-h)-120px)] lg:min-h-[560px]">
          {view === "3d" && capability ? (
            <>
              {/* Poster stays until the model's first frame, then crossfades out. */}
              <ProductImage
                src={colourway.images.front}
                alt=""
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                className={clsx("pointer-events-none absolute inset-0 transition-opacity duration-[400ms] ease-camera", viewerReady ? "opacity-0" : "opacity-100")}
              />
              <ProductViewer
                spec={{ kind: product.model.kind, style: product.model.style, finishes: colourway.finishes, framing: product.model.framing } as StandinSpec}
                angle={product.model.angles.front}
                hotspots={product.highlights}
                activeId={activeHotspot}
                onActiveChange={setActiveHotspot}
                capability={capability}
                reducedMotion={env.reduced}
                mobile={env.mobile}
                label={`${product.title} in ${colourway.name}`}
                onReady={() => setViewerReady(true)}
                onError={() => {
                  setViewerFailed(true);
                  setView("front");
                }}
              />
              {slowLoad && <div className="label pointer-events-none absolute inset-x-0 top-0 h-px origin-left animate-pulse bg-ivory" aria-hidden="true" />}
              {product.model.standin && (
                <p className="label pointer-events-none absolute left-4 top-4 bg-ink/60 px-2.5 py-1 text-smoke backdrop-blur-sm">Stand‑in model</p>
              )}
            </>
          ) : (
            <>
              <ProductImage
                key={colourway.images[view === "3d" ? "front" : view]}
                src={colourway.images[view === "3d" ? "front" : view]}
                alt={`${product.title} in ${colourway.name}, ${VIEW_LABEL[view === "3d" ? "front" : view].toLowerCase()} view`}
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                className="anim-crossfade absolute inset-0"
              />
              <p className="label absolute bottom-5 left-5 text-smoke">
                {colourway.name} · {VIEW_LABEL[view === "3d" ? "front" : view]}
              </p>
            </>
          )}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Choose a view">
          {can3d && (
            <button
              type="button"
              aria-pressed={view === "3d"}
              aria-label="View in 3D"
              onClick={show3d}
              className={clsx(
                "relative grid aspect-square place-items-center border bg-[radial-gradient(ellipse_at_50%_45%,#3A3430_0%,#121111_75%)] transition-colors duration-quick",
                view === "3d" ? "border-ivory" : "border-transparent hover:border-line",
              )}
            >
              <span className="font-display text-2xl">3D</span>
            </button>
          )}
          {(Object.keys(VIEW_LABEL) as PhotoView[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={`${VIEW_LABEL[v]} view`}
              onClick={() => {
                setView(v);
                setActiveHotspot(null);
              }}
              className={clsx(
                "relative aspect-square border transition-colors duration-quick",
                view === v ? "border-ivory" : "border-transparent hover:border-line",
              )}
            >
              <ProductImage src={colourway.images[v]} alt="" sizes="120px" className="absolute inset-0" />
            </button>
          ))}
        </div>
        {viewerFailed && (
          <p role="status" className="mt-3 text-sm text-mist">
            3D isn&apos;t available on this device, so we&apos;re showing photographs.
          </p>
        )}
      </section>

      {/* ── Buy panel ────────────────────────────────────── */}
      <section aria-labelledby={`${id}-title`} className="flex flex-col gap-8 lg:px-4 xl:px-10">
        <div className="space-y-3">
          <p className="label text-smoke">{product.material}</p>
          <h1 id={`${id}-title`} className="font-display text-[clamp(40px,4vw,60px)] leading-[1.02]">
            {product.title}
          </h1>
          <p className="text-lg tabular-nums">{formatMoney(product.price)}</p>
          <p className="max-w-md text-[15px] font-light leading-relaxed text-mist">{product.description}</p>
        </div>

        <fieldset>
          <legend className="label mb-4 text-mist">
            Colour — <span className="text-ivory">{colourway.name}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colorways.map((c) => (
              <label key={c.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-colour`}
                  value={c.id}
                  checked={c.id === colourId}
                  onChange={() => chooseColour(c.id)}
                  className="peer sr-only"
                />
                <span
                  className={clsx(
                    "grid h-12 w-12 place-items-center rounded-full border transition-colors duration-quick peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ivory",
                    c.id === colourId ? "border-ivory" : "border-line hover:border-mist",
                  )}
                >
                  <span className="h-[34px] w-[34px] rounded-full border border-white/10" style={{ backgroundColor: c.swatch }} />
                </span>
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {!oneSize && (
          <fieldset ref={sizeGroupRef} aria-describedby={`${id}-fit ${id}-size-error`}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <legend className="label text-mist">
                {product.sizeLabel === "EU" ? "Size (EU)" : "Size"} — <span className="text-ivory">{size ?? "Select a size"}</span>
              </legend>
              <SizeGuide kind={product.sizeLabel === "EU" ? "footwear" : "apparel"} />
            </div>
            <div key={nudge} className={clsx("grid grid-cols-4 gap-2", nudge > 0 && "anim-nudge")}>
              {product.sizes.map((s) => (
                <label key={s} className="relative">
                  <input
                    type="radio"
                    name={`${id}-size`}
                    value={s}
                    checked={size === s}
                    disabled={soldOut(s)}
                    onChange={() => {
                      setSize(s);
                      setStatus("idle");
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={clsx(
                      "flex min-h-12 items-center justify-center border text-[15px] tabular-nums transition-colors duration-quick peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ivory",
                      soldOut(s)
                        ? "cursor-not-allowed border-night text-smoke/60 line-through"
                        : size === s
                          ? "cursor-pointer border-ivory bg-ivory text-ink"
                          : "cursor-pointer border-line hover:border-mist",
                    )}
                  >
                    {s}
                    {soldOut(s) && <span className="sr-only">, sold out in {colourway.name}</span>}
                  </span>
                </label>
              ))}
            </div>
            <p id={`${id}-size-error`} role="alert" className="mt-3 min-h-5 text-sm text-[#E39A9D]">
              {status === "needSize" ? "Please choose a size to continue." : ""}
            </p>
          </fieldset>
        )}

        <p id={`${id}-fit`} className="-mt-4 border border-line p-4 text-sm leading-relaxed text-mist">
          <span className="text-ivory">Fit: </span>
          {product.fit}
        </p>

        <div className="space-y-3">
          <button ref={buyRef} type="button" onClick={addToBag} disabled={allSoldOut} className={clsx(buyClass, "w-full")}>
            {buyLabel}
          </button>
          <div role="status" className="min-h-6">
            {status === "added" && (
              <p className="anim-fade-quick flex flex-wrap items-center justify-between gap-3 border border-line bg-night p-4 text-sm">
                <span>
                  Added: {product.title} · {colourway.name}
                  {oneSize ? "" : ` · ${size}`}
                </span>
                <Link href="/bag" className="label link-draw">
                  View bag
                </Link>
              </p>
            )}
          </div>
          <p className="text-sm text-smoke">Complimentary delivery · Free returns within 30 days</p>
        </div>

        <Accordion
          items={[
            { id: "details", title: "Details", body: <ul className="space-y-1.5">{product.details.map((d) => <li key={d}>{d}</li>)}</ul> },
            { id: "care", title: "Materials & care", body: <ul className="space-y-1.5">{product.care.map((d) => <li key={d}>{d}</li>)}</ul> },
            {
              id: "shipping",
              title: "Shipping & returns",
              body: (
                <p>
                  Complimentary delivery. Free returns and exchanges within 30 days, unworn and in the original packaging.{" "}
                  <Link href="/shipping-returns" className="link-draw text-ivory">
                    Full policy
                  </Link>
                </p>
              ),
            },
          ]}
        />
      </section>

      {/* Mobile sticky add-to-bag (Step 6 · mobile behaviour) */}
      <div
        aria-hidden={buyVisible}
        inert={buyVisible}
        className={clsx(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-line bg-ink/95 px-5 py-3 backdrop-blur-md transition-transform duration-standard ease-glide lg:hidden",
          buyVisible ? "translate-y-full" : "translate-y-0",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{product.title}</p>
          <p className="text-sm tabular-nums text-mist">
            {formatMoney(product.price)}
            {size && !oneSize ? ` · ${size}` : ""}
          </p>
        </div>
        <button type="button" onClick={addToBag} disabled={allSoldOut} className={clsx(buyClass, "shrink-0 px-6")}>
          {buyLabel}
        </button>
      </div>
    </div>
  );
}

function Accordion({ items }: { items: { id: string; title: string; body: React.ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const base = useId();
  return (
    <div className="border-t border-line">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="border-b border-line">
            <h2>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${base}-${item.id}`}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="label flex min-h-14 w-full items-center justify-between text-left"
              >
                {item.title}
                <span aria-hidden="true" className="text-base">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h2>
            <div
              id={`${base}-${item.id}`}
              hidden={!isOpen}
              className="pb-6 text-[15px] font-light leading-relaxed text-mist"
            >
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
