import { sampleProvider } from "./sample-provider";
import type { CommerceProvider } from "./types";

/**
 * The active commerce backend. Swap this for a Shopify / Medusa / Supabase
 * adapter implementing `CommerceProvider` once the platform is chosen.
 */
export const commerce: CommerceProvider = sampleProvider;

export * from "./types";
