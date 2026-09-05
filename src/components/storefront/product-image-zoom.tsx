"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

/**
 * A tap-to-zoom lightbox for the PDP hero image — shows the whole image
 * (never cropped) at full size. Tapping toggles between fit-to-screen and a
 * 2x zoom centered on wherever was tapped, same pattern most storefronts use
 * for a "click to zoom" product photo. On mobile this is on top of the
 * device's own pinch-zoom, which already works here since the site's
 * viewport doesn't disable it — this just makes it easy to trigger without
 * knowing pinch-zoom exists.
 */
export function ProductImageZoom({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("center center");

  function openZoom() {
    setOpen(true);
    setZoomed(false);
    setOrigin("center center");
  }

  function close() {
    setOpen(false);
    setZoomed(false);
  }

  function handleFrameClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoomed((value) => !value);
  }

  const dialog = open ? (
    <div className="image-zoom-backdrop" onClick={close} role="presentation">
      <button aria-label="Close" className="sheet-close image-zoom-close" onClick={close} type="button">
        <span aria-hidden="true">x</span>
      </button>
      <div
        className={zoomed ? "image-zoom-frame zoomed" : "image-zoom-frame"}
        onClick={(event) => {
          event.stopPropagation();
          handleFrameClick(event);
        }}
      >
        {/* Plain img, not next/image — this is a user-triggered full-size
            view of an image already loaded on the page, not a new fetch
            that benefits from responsive srcset/lazy-loading. */}
        <img alt={alt} className="image-zoom-img" src={src} style={{ transformOrigin: origin }} />
      </div>
      <p className="image-zoom-hint">{zoomed ? "Tap to zoom out" : "Tap to zoom in"}</p>
    </div>
  ) : null;

  return (
    <>
      <button
        aria-label={`View a larger image of ${alt}`}
        className="product-detail-zoom-trigger"
        onClick={openZoom}
        type="button"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {dialog && typeof document !== "undefined" ? createPortal(dialog, document.body) : null}
    </>
  );
}
