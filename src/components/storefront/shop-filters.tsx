"use client";

import { useEffect, useRef } from "react";
import type { ShopFilterOption } from "@/lib/storefront/catalogue";

type ShopFiltersProps = {
  categories: ShopFilterOption[];
  category: string;
  need: string;
  needs: ShopFilterOption[];
  onCategoryChange: (slug: string) => void;
  onNeedChange: (slug: string) => void;
};

export function ShopFilters({
  categories,
  category,
  need,
  needs,
  onCategoryChange,
  onNeedChange
}: ShopFiltersProps) {
  if (needs.length === 0 && categories.length === 0) {
    return null;
  }

  return (
    <div className="shop-filters">
      <FilterRow label="Need" onChange={onNeedChange} options={needs} value={need} />
      <FilterRow label="Category" onChange={onCategoryChange} options={categories} value={category} />
    </div>
  );
}

function FilterRow({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (slug: string) => void;
  options: ShopFilterOption[];
  value: string;
}) {
  const pillsRef = useRef<HTMLDivElement>(null);

  // On a phone the row scrolls sideways, so a chosen pill (e.g. from a
  // shared link) can sit off-screen — bring it into view inside its own row
  // without moving the page.
  useEffect(() => {
    const row = pillsRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !active) {
      return;
    }
    if (active.offsetLeft < row.scrollLeft || active.offsetLeft + active.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, active.offsetLeft - 8), behavior: "smooth" });
    }
  }, [value]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="shop-filter-row" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
      <span className="shop-filter-label" aria-hidden="true">
        {label}
      </span>
      <div className="shop-filter-pills" ref={pillsRef}>
        <button
          aria-pressed={value === ""}
          className="shop-pill"
          onClick={() => onChange("")}
          type="button"
        >
          All
        </button>
        {options.map((option) => (
          <button
            aria-pressed={value === option.slug}
            className="shop-pill"
            key={option.slug}
            onClick={() => onChange(value === option.slug ? "" : option.slug)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
