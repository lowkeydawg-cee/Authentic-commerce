import Image from "next/image";
import clsx from "clsx";

/**
 * A product render or photograph presented on the VESPER studio stage.
 * The caller positions it (`relative` with a size, or `absolute inset-0`).
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
  priority,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  return (
    <div className={clsx("overflow-hidden bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,#3A3430_0%,#171514_58%,#0E0D0E_100%)]", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={clsx("object-contain", imgClassName)} />
    </div>
  );
}
