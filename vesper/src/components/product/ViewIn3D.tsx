"use client";

import { openHotspot } from "./hotspot-event";

export function ViewIn3D({ id, title }: { id: string; title: string }) {
  return (
    <button type="button" onClick={() => openHotspot(id)} className="label link-draw mt-5 text-mist hover:text-ivory">
      View in 3D <span className="sr-only">: {title}</span>↑
    </button>
  );
}
