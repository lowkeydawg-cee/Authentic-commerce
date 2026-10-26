"use client";

import { motion } from "framer-motion";
import { Gem, Leaf, ShieldCheck, Truck } from "lucide-react";

const PILLARS = [
  { icon: Gem, title: "Small-batch craft", body: "Every piece is made in limited runs and inspected by hand." },
  { icon: Truck, title: "Fast local delivery", body: "Free 1–2 day delivery across Kigali, nationwide within 4 days." },
  { icon: ShieldCheck, title: "Secure payments", body: "Mobile Money and cards, protected end to end." },
  { icon: Leaf, title: "Responsibly sourced", body: "Materials traced to the cooperatives that make them." },
];

export function BrandPromise() {
  return (
    <section id="promise" className="container-page scroll-mt-24 py-20">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            className="glass rounded-3xl p-6 transition-shadow hover:shadow-glow"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-300/10 text-gold-300">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
