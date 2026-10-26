import Image from "next/image";
import clsx from "clsx";

export type PosterTone = "ink" | "oxblood" | "graphite" | "bronze";

const STAGE: Record<PosterTone, string> = {
  ink: "bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,#4A423C_0%,#1D1A18_55%,#0B0B0C_100%)]",
  oxblood: "bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,#5A2F31_0%,#221416_55%,#0B0B0C_100%)]",
  graphite: "bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,#3E3D40_0%,#1A1A1C_55%,#0B0B0C_100%)]",
  bronze: "bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,#57493C_0%,#201B17_55%,#0B0B0C_100%)]",
};

interface PosterProps {
  /** Alt text, and the brief shown until photography is supplied. */
  shot: string;
  src?: string | null;
  tone?: PosterTone;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Hide the brief caption (e.g. when the 3D model sits on top). */
  quiet?: boolean;
}

/**
 * Product / campaign still. Renders the supplied photograph; until one exists
 * it shows the studio stage with the shot brief, so layouts can be reviewed
 * with the exact framing photography needs to deliver.
 */
export function Poster({ shot, src, tone = "ink", className, priority, sizes = "100vw", quiet }: PosterProps) {
  return (
    <div className={clsx("relative overflow-hidden", STAGE[tone], className)}>
      {src ? (
        <Image src={src} alt={shot} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute bottom-[22%] left-1/2 h-6 w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0)_70%)]"
          />
          <div role="img" aria-label={shot} className="absolute inset-0" />
          {!quiet && (
            <p className="label absolute inset-x-6 bottom-6 text-smoke" aria-hidden="true">
              Photograph · {shot}
            </p>
          )}
        </>
      )}
    </div>
  );
}
