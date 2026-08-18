import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

type TransactionalHeaderProps = {
  actionHref: Route;
  actionLabel: string;
};

export function TransactionalHeader({ actionHref, actionLabel }: TransactionalHeaderProps) {
  return (
    <header className="shop-header transactional-header">
      <Link className="brand-lockup" href="/">
        <span aria-hidden="true" className="brand-lockup-icon">
          <Image
            alt=""
            fill
            priority
            sizes="40px"
            src="/brand/oh-my-kitty-logo.jpeg"
            style={{ objectFit: "cover", transform: "scale(2) translate(-2%, -10%)" }}
          />
        </span>
        <span className="brand-lockup-text">
          <strong>Oh My Kitty</strong>
          <small>intimate care</small>
        </span>
      </Link>
      <Link className="portal-link" href={actionHref}>
        {actionLabel}
      </Link>
    </header>
  );
}
