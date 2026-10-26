import { createLocalRepository } from "./local";
import type { StoreRepository } from "./repository";
import { createSupabaseRepository } from "./supabase";

let instance: StoreRepository | null = null;

/** Picks the backend from env vars. Defaults to the zero-config local store. */
export function getRepository(): StoreRepository {
  if (instance) return instance;
  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "local";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (provider === "supabase") {
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_DATA_PROVIDER=supabase requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    instance = createSupabaseRepository(url, key);
  } else {
    instance = createLocalRepository();
  }
  return instance;
}

export type { StoreRepository, AdminSession } from "./repository";
