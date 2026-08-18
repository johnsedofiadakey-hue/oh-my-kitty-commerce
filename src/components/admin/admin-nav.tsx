"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminSignOutButton } from "@/components/auth/admin-sign-out-button";

type AdminNavProps = {
  items: { label: string; href: string }[];
};

export function AdminNav({ items }: AdminNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      <header className="admin-mobile-bar">
        <Link className="admin-brand" href="/admin">
          <Image alt="Oh My Kitty logo" height={36} priority src="/brand/oh-my-kitty-logo.jpeg" width={36} />
          <span>Oh My Kitty Admin</span>
        </Link>
        <button
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="admin-nav-toggle"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      {open ? (
        <button
          aria-label="Close menu"
          className="admin-nav-backdrop"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}
      <aside className={open ? "app-sidebar open" : "app-sidebar"}>
        <Link className="admin-brand" href="/admin">
          <Image alt="Oh My Kitty logo" height={54} priority src="/brand/oh-my-kitty-logo.jpeg" width={54} />
          <span>Oh My Kitty Admin</span>
        </Link>
        <nav className="nav-list" aria-label="Admin">
          {items.map((item) => (
            <Link
              className="nav-item"
              href={item.href as Route}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <AdminSignOutButton />
        </nav>
      </aside>
    </>
  );
}
