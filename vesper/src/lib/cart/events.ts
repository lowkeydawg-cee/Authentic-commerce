/** Opens the mini-bag. `added` marks an add-to-bag confirmation (auto-closes after 4 s). */
export const BAG_OPEN_EVENT = "vesper:bag-open";

export function openBag(added = false) {
  window.dispatchEvent(new CustomEvent(BAG_OPEN_EVENT, { detail: { added } }));
}
