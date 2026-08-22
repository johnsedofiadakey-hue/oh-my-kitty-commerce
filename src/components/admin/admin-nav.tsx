"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSignOutButton } from "@/components/auth/admin-sign-out-button";
import { AdminIcon, type AdminIconName } from "@/components/admin/admin-icons";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminIconName;
  badge?: number;
};

export type AdminNavGroup = {
  label: string | null;
  items: AdminNavItem[];
};

type AdminNavProps = {
  groups: AdminNavGroup[];
  actorName: string;
  actorRole: string;
};

export function AdminNav({ groups, actorName, actorRole }: AdminNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
          <Image alt="Oh My Kitty logo" height={40} priority src="/brand/oh-my-kitty-logo.jpeg" width={40} />
          <span>
            Oh My Kitty
            <em>Admin</em>
          </span>
        </Link>
        <div className="nav-groups">
          {groups.map((group) => (
            <nav aria-label={group.label ?? "Overview"} className="nav-group" key={group.label ?? "overview"}>
              {group.label ? <div className="nav-group-label">{group.label}</div> : null}
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    className={active ? "nav-item active" : "nav-item"}
                    href={item.href as Route}
                    key={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <AdminIcon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </nav>
          ))}
        </div>
        <div className="nav-foot">
          <Link className="nav-user" href={"/admin/account" as Route}>
            <span className="nav-avatar">{initials(actorName)}</span>
            <span className="nav-user-copy">
              <strong>{actorName}</strong>
              <em>{actorRole}</em>
            </span>
          </Link>
          <AdminSignOutButton />
        </div>
      </aside>
    </>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
