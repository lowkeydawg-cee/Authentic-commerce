import Link from "next/link";
import clsx from "clsx";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="VESPER, home"
      className={clsx(
        "font-display tracking-wordmark text-ivory transition-opacity duration-quick hover:opacity-80",
        // Optical centring: tracking adds space after the last letter.
        "pl-[0.42em]",
        className,
      )}
    >
      VESPER
    </Link>
  );
}
