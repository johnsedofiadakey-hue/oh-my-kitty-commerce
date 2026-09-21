/**
 * Forces 80mm thermal paper for whichever route renders it.
 *
 * Two things had to be got right here, both verified by rendering headless
 * through the DevTools protocol rather than assumed:
 *
 * 1. A *named* page (`@page receipt { ... }` plus `page: receipt`) is what the
 *    spec provides for scoping, but Chrome ignores it — the receipt silently
 *    fell back to US Letter, and the driver then shrank a Letter page onto an
 *    80mm roll. So the rule is emitted per route instead. An unnamed @page is
 *    document-wide, which is fine: these routes render nothing else, and the
 *    full-width financial statements live on their own routes.
 *
 * 2. `size: 80mm auto` is invalid CSS — the property takes one length, two
 *    lengths, or `auto`, never a mix — so the whole declaration was dropped.
 *    Measured: `80mm auto` gave 215.9x279.4mm, `80mm 200mm` gave 80x200mm.
 *
 * Because CSS has no "as tall as the content" option, the height is estimated
 * from the receipt's own length. Slightly over is harmless (a short blank
 * tail); under would split the receipt across two pages.
 */
export function ReceiptPageSize({ heightMm }: { heightMm: number }) {
  return (
    <style>{`
      @page {
        size: 80mm ${heightMm}mm;
        margin: 4mm;
      }
    `}</style>
  );
}

/**
 * Rough height of a rendered receipt, in mm. Derived from the line heights in
 * globals.css: a header block, the meta rows, two lines per item, the totals
 * block and a footer. Generous rather than tight, since overshooting costs a
 * little blank paper and undershooting splits the receipt in half.
 */
export function estimateReceiptHeightMm(itemCount: number, extraRows = 0) {
  const chrome = 125; // header, rules, totals, footer, padding
  const perItem = 13; // product line plus its sub-line
  const perRow = 6; // one extra meta row (payment reference, change due, ...)

  return Math.min(900, Math.max(120, Math.round(chrome + itemCount * perItem + extraRows * perRow)));
}
