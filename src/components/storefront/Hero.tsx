"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ProductArt } from "@/components/ui/ProductArt";
import { formatMoney } from "@/lib/format";
import { useStorefrontCatalog } from "@/store/inventory";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  const { settings, products, categories } = useStorefrontCatalog();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yFront = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const yBack = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const featured = products.filter((p) => p.featured).slice(0, 3);
  const slugOf = (id: string) => categories.find((c) => c.id === id)?.slug;

  return (
    <section ref={ref} className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-10 h-[28rem] w-[28rem] animate-float rounded-full bg-gold-400/20 blur-[120px]" />
        <div className="absolute right-[-5%] top-40 h-[24rem] w-[24rem] animate-float rounded-full bg-violet-500/20 blur-[120px] [animation-delay:-3s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <motion.div style={{ opacity: fade }} className="container-page relative grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-gold-200 sm:text-xs sm:tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5" /> {settings.heroEyebrow}
          </motion.span>
          <motion.h1 variants={item} className="mt-6 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient-gold">{settings.heroTitle}</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            {settings.heroSubtitle}
          </motion.p>
          <motion.div variants={item} className="mt-10 flex flex-wrap gap-3">
            <a href="#catalog">
              <Button size="lg">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="/admin">
              <Button size="lg" variant="glass">Open stock dashboard</Button>
            </Link>
          </motion.div>
          <motion.div variants={item} className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/50">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold-300" /> Free delivery in Kigali</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold-300" /> 2-year craftsmanship warranty</span>
          </motion.div>
        </motion.div>

        {/* Floating featured cards */}
        <div id="featured" className="relative hidden h-[30rem] lg:block">
          {featured.map((p, i) => {
            const positions = [
              "left-6 top-0 z-[3] w-64 -rotate-6",
              "right-0 top-16 z-[2] w-60 rotate-[5deg]",
              "left-24 bottom-0 z-[1] w-56 rotate-2",
            ];
            return (
              <motion.div key={p.id} style={{ y: i === 1 ? yBack : yFront }} className={`absolute ${positions[i]}`}>
                <motion.a
                  href="#catalog"
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 120, damping: 18 }}
                  whileHover={{ scale: 1.06, rotate: 0, y: -8 }}
                  className="glass group block rounded-3xl p-3 hover:z-10 hover:shadow-glow"
                >
                  <ProductArt product={p} categorySlug={slugOf(p.categoryId)} className="aspect-[4/3] rounded-2xl" iconClassName="h-14 w-14" />
                  <div className="px-1 pb-1 pt-3">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-gold-200">{formatMoney(p.price, settings.currency)}</p>
                  </div>
                </motion.a>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
