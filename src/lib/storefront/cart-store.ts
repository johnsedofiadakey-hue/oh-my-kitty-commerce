const cartOpenChangedEvent = "oh-my-kitty-cart-open-changed";
let open = false;

export function isCartOpen() {
  return open;
}

export function openCart() {
  setOpen(true);
}

export function closeCart() {
  setOpen(false);
}

export function onCartOpenChanged(listener: () => void) {
  window.addEventListener(cartOpenChangedEvent, listener);
  return () => window.removeEventListener(cartOpenChangedEvent, listener);
}

function setOpen(next: boolean) {
  if (open === next) {
    return;
  }

  open = next;
  window.dispatchEvent(new Event(cartOpenChangedEvent));
}
