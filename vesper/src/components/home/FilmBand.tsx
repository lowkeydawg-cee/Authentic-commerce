"use client";

import { useEffect, useRef } from "react";
import { Poster } from "@/components/media/Poster";
import { film } from "@/content/home";
import { Reveal } from "./Reveal";

export function FilmBand() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stop playback whenever the dialog closes (Escape, button or backdrop).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => videoRef.current?.pause();
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  return (
    <section aria-labelledby="film-title" className="page-x mx-auto max-w-page pb-24 lg:pb-32">
      <Reveal variant="wipe">
        <div className="relative">
          <Poster shot={film.shot} tone="graphite" quiet className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]" />
          <div className="absolute inset-0 flex flex-col justify-end gap-4 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent p-6 sm:p-10">
            <p className="label text-bronze">{film.kicker}</p>
            <h2 id="film-title" className="font-display text-4xl italic sm:text-5xl">
              {film.title}
            </h2>
            <p className="max-w-md text-[15px] font-light text-mist">{film.body}</p>
            {film.src ? (
              <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="label mt-2 inline-flex min-h-12 items-center self-start border border-ivory/60 px-7 transition-colors duration-quick hover:bg-ivory hover:text-ink"
              >
                Play film
              </button>
            ) : (
              <p className="label mt-2 text-smoke">Premieres with Chapter I</p>
            )}
          </div>
        </div>
      </Reveal>

      {film.src && (
        <dialog
          ref={dialogRef}
          aria-label={film.title}
          className="w-[min(92vw,1280px)] bg-ink p-0 text-ivory backdrop:bg-ink/90"
          onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        >
          <video ref={videoRef} src={film.src} controls playsInline className="block w-full">
            <track kind="captions" srcLang="en" label="English" src={`${film.src.replace(/\.[^.]+$/, "")}.vtt`} default />
          </video>
          <form method="dialog" className="flex justify-end p-3">
            <button className="label min-h-11 px-4">Close</button>
          </form>
        </dialog>
      )}
    </section>
  );
}
