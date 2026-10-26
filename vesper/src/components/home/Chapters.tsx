"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Poster } from "@/components/media/Poster";
import { chapters, hero } from "@/content/home";
import { Reveal } from "./Reveal";

/**
 * Layout 1 · camera chapters. On desktop with motion allowed, the product stays
 * pinned while scrolling moves the "camera" through three framings (GSAP
 * ScrollTrigger, scrubbed with a cinematic lag and snapping to each chapter).
 * On phones, with reduced motion or without JavaScript it becomes a plain
 * sequence of stills and text.
 */
export function Chapters() {
  return (
    <section aria-labelledby="chapters-title">
      <h2 id="chapters-title" className="sr-only">
        The Nocturne, in three chapters
      </h2>
      <PinnedChapters />
      <StackedChapters />
    </section>
  );
}

function PinnedChapters() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !rootRef.current || !cameraRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current!;
        const camera = cameraRef.current!;
        const texts = gsap.utils.toArray<HTMLElement>("[data-chapter-text]", root);
        const spots = gsap.utils.toArray<HTMLElement>("[data-chapter-spot]", root);
        const last = chapters.length - 1;

        gsap.set(texts.slice(1), { autoAlpha: 0, y: 24 });
        gsap.set(spots.slice(1), { autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", duration: 1 },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.4, // cinematic lag behind the scrollbar
            snap: {
              snapTo: 1 / last,
              directional: false, // settle on the nearest chapter, not the next one
              duration: { min: 0.6, max: 1.5 },
              ease: "power2.inOut",
              delay: 0.15,
            },
            onUpdate: (self) => setActive(Math.round(self.progress * last)),
          },
        });

        chapters.slice(1).forEach((chapter, i) => {
          const at = i;
          tl.to(camera, { xPercent: chapter.focus.x, yPercent: chapter.focus.y, scale: chapter.focus.scale }, at)
            .to(texts[i], { autoAlpha: 0, y: -24, duration: 0.4 }, at)
            .to(spots[i], { autoAlpha: 0, duration: 0.3 }, at)
            .to(texts[i + 1], { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.5)
            .to(spots[i + 1], { autoAlpha: 1, duration: 0.4 }, at + 0.6);
        });

        return () => {
          gsap.set([camera, ...texts, ...spots], { clearProps: "all" });
        };
      });
      cleanup = () => mm.revert();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{ height: `${chapters.length * 100}vh` }}
      className="relative hidden lg:block motion-reduce:!hidden [@media(scripting:none)]:!hidden"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div ref={cameraRef} className="absolute inset-0 origin-center will-change-transform">
          <Poster shot={hero.shot} src={hero.src} tone="ink" quiet className="h-full w-full" />
        </div>
        {/* Hotspots sit outside the camera layer so labels stay crisp at any zoom. */}
        {chapters.map((c) => (
          <div
            key={c.id}
            data-chapter-spot=""
            aria-hidden="true"
            className="absolute flex items-center gap-3"
            style={{ left: c.hotspot.x, top: c.hotspot.y }}
          >
            <span className="h-3.5 w-3.5 rounded-full border border-ivory bg-ivory/90 shadow-[0_0_0_7px_rgba(239,234,224,0.16)]" />
            <span className="label bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur-sm">{c.hotspot.label}</span>
          </div>
        ))}

        <div className="page-x pointer-events-none absolute inset-x-0 bottom-16 grid">
          {chapters.map((c) => (
            <article key={c.id} data-chapter-text="" className="col-start-1 row-start-1 max-w-md self-end">
              <p className="label text-bronze">Chapter {c.index}</p>
              <h3 className="mt-3 font-display text-5xl">{c.title}</h3>
              <p className="mt-4 text-[17px] font-light leading-relaxed text-mist">{c.body}</p>
            </article>
          ))}
        </div>

        <ol aria-hidden="true" className="page-x absolute right-0 top-1/2 flex -translate-y-1/2 flex-col gap-4">
          {chapters.map((c, i) => (
            <li
              key={c.id}
              className={clsx(
                "label flex items-center justify-end gap-3 transition-colors duration-standard ease-glide",
                i === active ? "text-ivory" : "text-smoke",
              )}
            >
              {c.index}
              <span
                className={clsx(
                  "h-px bg-current transition-[width] duration-standard ease-glide",
                  i === active ? "w-10" : "w-4",
                )}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Phones, reduced motion and no-JS: the same story as a sequence of stills. */
function StackedChapters() {
  return (
    <div className="page-x space-y-20 py-24 lg:hidden motion-reduce:!block [@media(scripting:none)]:!block">
      {chapters.map((c) => (
        <article key={c.id} className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <Reveal variant="wipe">
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[16/10]">
              <div
                className="absolute inset-0 origin-center"
                style={{ transform: `translate(${c.focus.x}%, ${c.focus.y}%) scale(${c.focus.scale})` }}
              >
                <Poster shot={c.shot} src={hero.src} tone="ink" quiet sizes="100vw" className="h-full w-full" />
              </div>
              <span className="label absolute bottom-4 left-4 bg-ink/70 px-3 py-1.5 text-ivory">{c.hotspot.label}</span>
            </div>
          </Reveal>
          <Reveal>
            <p className="label text-bronze">Chapter {c.index}</p>
            <h3 className="mt-3 font-display text-4xl sm:text-5xl">{c.title}</h3>
            <p className="mt-4 max-w-md text-base font-light leading-relaxed text-mist">{c.body}</p>
          </Reveal>
        </article>
      ))}
    </div>
  );
}
