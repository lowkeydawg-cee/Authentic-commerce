/** Window event used by "View in 3D" links to open a hotspot in the product viewer. */
export const HOTSPOT_EVENT = "vesper:hotspot";

export function openHotspot(id: string) {
  window.dispatchEvent(new CustomEvent(HOTSPOT_EVENT, { detail: id }));
}
